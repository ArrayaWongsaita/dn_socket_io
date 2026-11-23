"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { RequireUser } from "@/components/require-user";
import { createSocket } from "@/lib/socket";

// PAGE 1: CONNECTION
//
// Goal: connect to the server, see your socket id, and watch the three basic events:
//   connect         -> we are connected
//   disconnect      -> the connection ended
//   connect_error   -> the server refused us (for example: unknown user)
//
// Server side of this lesson: api/src/connection/connection.gateway.ts

export default function ConnectionPage() {
  return <RequireUser>{(user) => <ConnectionLesson userId={user.id} />}</RequireUser>;
}

function ConnectionLesson({ userId }: { userId: number }) {
  // The socket lives in a ref: it must survive re-renders but is not something we draw.
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // Adds one line to the on-screen log.
  const addLog = (line: string) =>
    setLog((old) => [`${new Date().toLocaleTimeString()}  ${line}`, ...old]);

  // Builds a socket for the "/connection" namespace and starts listening to its events.
  // Returns the socket without connecting it yet.
  function buildSocket(idToSend: number) {
    const socket = createSocket("/connection", idToSend);

    // 'connect' fires when the connection is established. socket.id is now available.
    socket.on("connect", () => {
      setConnected(true);
      setSocketId(socket.id ?? null);
      addLog(`connect -> my socket id is ${socket.id}`);
    });

    // 'disconnect' fires when the connection ends. `reason` tells us why.
    socket.on("disconnect", (reason) => {
      setConnected(false);
      setSocketId(null);
      addLog(`disconnect -> reason: ${reason}`);
    });

    // 'connect_error' fires when the connection could not be made, e.g. the server
    // rejected our handshake. error.message is the text the server sent.
    socket.on("connect_error", (error) => {
      addLog(`connect_error -> ${error.message}`);
    });

    return socket;
  }

  // Close the connection when the user leaves this page.
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Button: Connect
  function handleConnect(idToSend: number = userId) {
    socketRef.current?.disconnect(); // drop an old connection first
    socketRef.current = buildSocket(idToSend);
    socketRef.current.connect(); // <- this line actually opens the connection
  }

  // Button: Disconnect
  function handleDisconnect() {
    socketRef.current?.disconnect(); // <- this line closes it
  }

  // Button: Ping. We send an event and the server answers (an "acknowledgement").
  async function handlePing() {
    const reply = await socketRef.current?.emitWithAck("ping");
    addLog(`ping -> server replied ${JSON.stringify(reply)}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">1. Connection</h1>

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p>
          Status:{" "}
          <span
            className={`rounded px-2 py-0.5 text-sm font-medium ${
              connected ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-700"
            }`}
          >
            {connected ? "connected" : "disconnected"}
          </span>
        </p>
        <p className="mt-2">
          Socket ID: <code className="font-mono">{socketId ?? "-"}</code>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => handleConnect()} disabled={connected} className={btn}>
            Connect
          </button>
          <button onClick={handleDisconnect} disabled={!connected} className={btn}>
            Disconnect
          </button>
          <button onClick={handlePing} disabled={!connected} className={btn}>
            Ping server
          </button>
          <button onClick={() => handleConnect(9999)} disabled={connected} className={btn}>
            Connect as a user that does not exist
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Event log</h2>
        <ul className="min-h-24 space-y-1 rounded-lg bg-zinc-900 p-3 font-mono text-sm text-green-300">
          {log.length === 0 && <li className="text-zinc-500">Press Connect...</li>}
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
