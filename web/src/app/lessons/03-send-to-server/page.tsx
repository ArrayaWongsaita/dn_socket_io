"use client";

import { useState } from "react";
import { EventLog } from "@/components/event-log";
import { useLessonSocket } from "@/lib/use-lesson-socket";

// LESSON 3: CLIENT TO SERVER
//
// Goal: send a message from the browser to the server.
// Type something and press Send. Then look at the API terminal.
//
// The connection is written for you (useLessonSocket does what you wrote in lessons 1 and 2).
// Server side of this lesson: api/src/lessons/03-send-to-server.gateway.ts
export default function SendToServerLesson() {
  const { socket, connected, entries } = useLessonSocket("lesson3");
  const [text, setText] = useState("hello server");

  function send() {
    // Send an event named 'note:send' with some data (any JSON you like).
    socket?.emit("note:send", { text });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">3. Client to server</h1>
      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm">Status: {connected ? "connected" : "not connected"}</p>
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
          />
          <button onClick={send} disabled={!connected} className={btn}>
            Send
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          The panel shows <code>→ note:send</code> (what you sent). The text itself appears in the API terminal.
        </p>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
