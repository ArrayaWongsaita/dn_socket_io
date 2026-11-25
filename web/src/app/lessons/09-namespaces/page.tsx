"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { EventLog } from "@/components/event-log";
import { API_URL } from "@/lib/config";
import { useSocketLog } from "@/lib/use-socket-log";

// LESSON 9: NAMESPACES
//
// Goal: one page, TWO connections to the same server: /news and /sports.
// Publish a headline on one channel and see that the other never hears it.
//
// Server side of this lesson: api/src/lessons/09-namespaces.gateway.ts
export default function NamespacesLesson() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">9. Namespaces</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <Channel namespace="news" />
        <Channel namespace="sports" />
      </div>
    </div>
  );
}

// One connection to one namespace, with its own headline list and its own log.
function Channel({ namespace }: { namespace: "news" | "sports" }) {
  // Connect to a namespace by adding its name to the address: http://localhost:3001/news
  const [socket] = useState<Socket | null>(() =>
    typeof window === "undefined" ? null : io(`${API_URL}/${namespace}`),
  );
  const [connected, setConnected] = useState(false);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [text, setText] = useState(`${namespace} headline`);
  const { entries } = useSocketLog(socket);

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("headline", (data: { text: string }) => setHeadlines((old) => [data.text, ...old]));
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <section className="space-y-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="font-medium">
        /{namespace} <span className="text-sm text-zinc-500">({connected ? "connected" : "not connected"})</span>
      </h2>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
        />
        <button onClick={() => socket?.emit("headline", { text })} disabled={!connected} className={btn}>
          Publish
        </button>
      </div>
      <ul className="space-y-1 text-sm">
        {headlines.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
      <EventLog entries={entries} />
    </section>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
