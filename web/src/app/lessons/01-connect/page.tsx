"use client";

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { EventLog } from "@/components/event-log";
import { useSocketLog } from "@/lib/use-socket-log";

// LESSON 1: CONNECT
//
// Goal: open a connection to the server and see your socket id.
// Open this page in two tabs: each tab gets its own socket id.
//
// Server side of this lesson: api/src/lessons/01-connect.gateway.ts
export default function ConnectLesson() {
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === "undefined") return null; // never connect while Next.js renders on the server

    // TODO(1.1): create the socket for the "/lesson1" address of the API and return it.
    //   - import { io } from "socket.io-client" and  import { API_URL } from "@/lib/config"
    //   - the address is  API_URL + "/lesson1"  (that is http://localhost:3001/lesson1)
    //   - hint: return io(`${API_URL}/lesson1`, { autoConnect: false });
    //     `autoConnect: false` means "do not connect yet": first listen to the events (TODO 1.2), then connect.
    return null;
  });
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  // The black panel at the bottom: it records everything the socket sends and receives.
  const { entries } = useSocketLog(socket);

  useEffect(() => {
    if (!socket) return;

    // TODO(1.2): a) listen to the 'connect' event. It fires when the connection is ready; socket.id is set now.
    //   hint: socket.on("connect", () => { setConnected(true); setSocketId(socket.id ?? null); });
    //   b) THEN open the connection (listening first means you can never miss the event).
    //   hint: socket.connect();
    void setConnected;
    void setSocketId;

    // Close the connection when you leave the page.
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">1. Connect</h1>
      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p>
          Status:{" "}
          <span
            className={`rounded px-2 py-0.5 text-sm font-medium ${
              connected ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-700"
            }`}
          >
            {connected ? "connected" : "not connected"}
          </span>
        </p>
        <p className="mt-2">
          Socket ID: <code className="font-mono">{socketId ?? "-"}</code>
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          Look at the API terminal too: it should print <code>connected: {"<the same id>"}</code>.
        </p>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}
