"use client";

import { useEffect, useState } from "react";
import { EventLog } from "@/components/event-log";
import { useLessonSocket } from "@/lib/use-lesson-socket";

type Message = { message: string };

// LESSON 4: SERVER TO CLIENT
//
// Goal: receive events the server sends. Two of them:
//   'welcome'      arrives by itself right after you connect
//   'hello:reply'  arrives after you press "Say hello"
//
// Server side of this lesson: api/src/lessons/04-send-to-client.gateway.ts
export default function SendToClientLesson() {
  const { socket, connected, entries } = useLessonSocket("lesson4");
  const [name, setName] = useState("Ann");
  const [welcome, setWelcome] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for an event with socket.on('event name', callback). The callback gets the data.
    socket.on("welcome", (data: Message) => setWelcome(data.message));
    socket.on("hello:reply", (data: Message) => setReply(data.message));
  }, [socket]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">4. Server to client</h1>
      <section className="space-y-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm">Status: {connected ? "connected" : "not connected"}</p>
        <p>
          Welcome message: <strong>{welcome ?? "-"}</strong>
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
          />
          <button onClick={() => socket?.emit("hello", { name })} disabled={!connected} className={btn}>
            Say hello
          </button>
        </div>
        <p>
          Reply: <strong>{reply ?? "-"}</strong>
        </p>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
