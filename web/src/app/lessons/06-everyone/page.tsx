"use client";

import { useEffect, useState } from "react";
import { EventLog } from "@/components/event-log";
import { useLessonSocket } from "@/lib/use-lesson-socket";
import { useNickname } from "@/lib/nickname";

type Shout = { from: string; text: string };
void (null as Shout | null);

// LESSON 6: EVERYONE
//
// Goal: one tab sends, ALL tabs receive (the sender too).
// Open this page in 3 tabs, shout from one, and watch all three.
//
// Server side of this lesson: api/src/lessons/06-everyone.gateway.ts
export default function EveryoneLesson() {
  const { socket, connected, entries } = useLessonSocket("lesson6");
  const [nickname] = useNickname();
  const [text, setText] = useState("hello everyone");
  const [shouts, setShouts] = useState<Shout[]>([]);

  useEffect(() => {
    if (!socket) return;

    // TODO(6.2): listen for 'shout' (the server sends it to everyone) and add it to the list.
    //   hint: socket.on("shout", (shout: Shout) => setShouts((old) => [shout, ...old]))
    void setShouts;
  }, [socket]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">6. Everyone</h1>
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
          {/* TODO(6.1): send the 'shout' event with { from: nickname, text }.
              hint: socket?.emit("shout", { from: nickname, text }) */}
          <button
            onClick={() => void socket}
            disabled={!connected}
            className={btn}
          >
            Shout
          </button>
        </div>
        <ul className="space-y-1">
          {shouts.map((s, i) => (
            <li key={i}>
              <strong>{s.from}:</strong> {s.text}
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
