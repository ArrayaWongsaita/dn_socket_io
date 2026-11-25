"use client";

import { useState } from "react";
import { EventLog } from "@/components/event-log";
import { useLessonSocket } from "@/lib/use-lesson-socket";

// What the server answers (see the gateway): a result, or an error message.
type AddReply = { ok: true; result: number } | { ok: false; error: string };

// LESSON 5: ACKNOWLEDGEMENT
//
// Goal: ask the server a question and wait for ITS answer, like `await fetch(...)`.
// `emitWithAck` sends the event and returns a promise that resolves with the server's reply.
//
// Server side of this lesson: api/src/lessons/05-acknowledgement.gateway.ts
export default function AcknowledgementLesson() {
  const { socket, connected, entries } = useLessonSocket("lesson5");
  const [a, setA] = useState("2");
  const [b, setB] = useState("3");
  const [answer, setAnswer] = useState<string | null>(null);

  async function add() {
    // Send 'math:add' and wait for the reply. (Send "x" instead of a number to see an error reply.)
    try {
      const reply: AddReply = await socket!.emitWithAck("math:add", { a: Number(a), b: Number(b) });
      setAnswer(reply.ok ? `${a} + ${b} = ${reply.result}` : `error: ${reply.error}`);
    } catch {
      // emitWithAck throws when the server does not answer in time (see ACK_TIMEOUT_MS).
      setAnswer("no answer from the server: is the handler written and the API running?");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">5. Acknowledgement</h1>
      <section className="space-y-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm">Status: {connected ? "connected" : "not connected"}</p>
        <div className="flex items-center gap-2">
          <input value={a} onChange={(e) => setA(e.target.value)} className={input} />
          <span>+</span>
          <input value={b} onChange={(e) => setB(e.target.value)} className={input} />
          <button onClick={add} disabled={!connected} className={btn}>
            Ask the server
          </button>
        </div>
        <p>
          Answer: <strong>{answer ?? "-"}</strong>
        </p>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}

const input = "w-20 rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700";
const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
