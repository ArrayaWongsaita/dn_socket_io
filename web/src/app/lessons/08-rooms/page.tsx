"use client";

import { useEffect, useState } from "react";
import { EventLog } from "@/components/event-log";
import { useLessonSocket } from "@/lib/use-lesson-socket";
import { useNickname } from "@/lib/nickname";

type RoomMessage = { room: string; from: string; text: string };

const ROOMS = ["red", "blue"];

// LESSON 8: ROOMS
//
// Goal: join a room and talk only to the people inside it.
// This page is already written: the new commands are all on the server.
// Open 3 tabs: put two of them in "red" and one in "blue", then say something in "red".
//
// Server side of this lesson: api/src/lessons/08-rooms.gateway.ts
export default function RoomsLesson() {
  const { socket, connected, entries } = useLessonSocket("lesson8");
  const [nickname] = useNickname();
  const [text, setText] = useState("hello room");
  const [myRooms, setMyRooms] = useState<string[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.on("room:message", (message: RoomMessage) => setMessages((old) => [message, ...old]));
  }, [socket]);

  async function join(room: string) {
    const reply = await socket!.emitWithAck("room:join", { room });
    setMyRooms((reply.rooms as string[]).filter((r) => ROOMS.includes(r)));
  }

  async function leave(room: string) {
    await socket!.emitWithAck("room:leave", { room });
    setMyRooms((old) => old.filter((r) => r !== room));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">8. Rooms</h1>
      <section className="space-y-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm">
          Status: {connected ? "connected" : "not connected"} · You are <strong>{nickname}</strong> · In rooms:{" "}
          <strong>{myRooms.join(", ") || "none"}</strong>
        </p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {ROOMS.map((room) => (
            <div key={room} className="space-y-2 rounded border border-zinc-300 p-3 dark:border-zinc-700">
              <h2 className="font-medium">Room: {room}</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => join(room)} disabled={!connected} className={btn}>
                  Join
                </button>
                <button onClick={() => leave(room)} disabled={!connected} className={btn}>
                  Leave
                </button>
                <button
                  onClick={() => socket?.emit("room:say", { room, from: nickname, text })}
                  disabled={!connected}
                  className={btn}
                >
                  Say in {room}
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                {messages
                  .filter((m) => m.room === room)
                  .map((m, i) => (
                    <li key={i}>
                      <strong>{m.from}:</strong> {m.text}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <EventLog entries={entries} />
    </div>
  );
}

const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
