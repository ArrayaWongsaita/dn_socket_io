"use client";

import { useEffect, useState } from "react";
import { EventLog } from "@/components/event-log";
import { useLessonSocket } from "@/lib/use-lesson-socket";
import { useNickname } from "@/lib/nickname";

type Received = { pattern: "all" | "others"; from: string; text: string };
void (null as Received | null);

// LESSON 7: EVERYONE EXCEPT ME
//
// Goal: see the difference between the two buttons. Open 3 tabs.
//   "Send to all"     -> all tabs get it, including the sender
//   "Send to others"  -> every tab EXCEPT the sender gets it
//
// Server side of this lesson: api/src/lessons/07-everyone-else.gateway.ts
export default function EveryoneElseLesson() {
  const { socket, connected, entries } = useLessonSocket("lesson7");
  const [nickname] = useNickname();
  const [text, setText] = useState("hi");
  const [messages, setMessages] = useState<Received[]>([]);

  useEffect(() => {
    if (!socket) return;

    // TODO(7.2): listen for 'received' and add it to the list. Both buttons arrive as this same event;
    //   `pattern` says which button was used.
    //   hint: socket.on("received", (message: Received) => setMessages((old) => [message, ...old]))
    void setMessages;
  }, [socket]);

  const send = (event: "send:all" | "send:others") => socket?.emit(event, { from: nickname, text });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">7. Everyone except me</h1>
      <section className="space-y-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm">
          Status: {connected ? "connected" : "not connected"} · You are <strong>{nickname}</strong>
        </p>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
          />
          <button onClick={() => send("send:all")} disabled={!connected} className={btn}>
            Send to all
          </button>
          <button onClick={() => send("send:others")} disabled={!connected} className={btn}>
            Send to others
          </button>
        </div>
        <ul className="space-y-1">
          {messages.map((m, i) => (
            <li key={i}>
              <span className="rounded bg-zinc-200 px-1.5 text-xs dark:bg-zinc-700">{m.pattern}</span>{" "}
              <strong>{m.from}:</strong> {m.text}
            </li>
          ))}
        </ul>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
