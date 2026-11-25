"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { EventLog } from "@/components/event-log";
import { API_URL } from "@/lib/config";
import { useSocketLog } from "@/lib/use-socket-log";

// LESSON 2: DISCONNECT
//
// Goal: end a connection and see WHY it ended. The `reason` tells you who closed it:
//   "io client disconnect"  -> you pressed Disconnect
//   "transport close"       -> the connection was lost (stop the API and watch!)
//
// Server side of this lesson: api/src/lessons/02-disconnect.gateway.ts
export default function DisconnectLesson() {
  // (You wrote this in lesson 1.) Connects to http://localhost:3001/lesson2
  const [socket] = useState<Socket | null>(() =>
    typeof window === "undefined" ? null : io(`${API_URL}/lesson2`),
  );
  const [connected, setConnected] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const { entries } = useSocketLog(socket);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setConnected(true);
      setReason(null);
    });

    // Step 1: the 'disconnect' event fires when the connection ends. The callback gets the `reason`.
    socket.on("disconnect", (why: string) => {
      setConnected(false);
      setReason(why);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">2. Disconnect</h1>
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
          Reason: <code className="font-mono">{reason ?? "-"}</code>
        </p>
        <div className="mt-4 flex gap-2">
          {/* Step 2: close the connection yourself. */}
          <button onClick={() => socket?.disconnect()} disabled={!connected} className={btn}>
            Disconnect
          </button>
          <button onClick={() => socket?.connect()} disabled={connected} className={btn}>
            Connect again
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Try it, then close this tab: the API terminal prints <code>disconnected: {"<id>"}</code>.
        </p>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
