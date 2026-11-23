"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { RequireUser } from "@/components/require-user";
import { API_URL } from "@/lib/config";
import { createSocket } from "@/lib/socket";

// PAGE 3: CHAT ROOMS
//
// Goal: join a room, then send and receive messages that only that room sees.
// Open two windows as two users, put both in the same room and chat.
//
// Server side of this lesson: api/src/chat/chat.gateway.ts

type User = { id: number; name: string };
type Room = { id: number; name: string };
type Message = { id: number; text: string; createdAt: string; user: User };
type MembersUpdate = { roomId: number; members: User[] };
type NewMessage = Message & { roomId: number };

export default function ChatPage() {
  return <RequireUser>{(user) => <ChatLesson me={user} />}</RequireUser>;
}

function ChatLesson({ me }: { me: User }) {
  const socketRef = useRef<Socket | null>(null);
  // We need the current room inside socket listeners that are created only once,
  // so we keep a copy of it in a ref as well.
  const roomIdRef = useRef<number | null>(null);

  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Connect to the "/chat" namespace when the page opens, disconnect when it closes.
  useEffect(() => {
    const socket = createSocket("/chat", me.id);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // A new message arrived in a room I am in -> add it to the list.
    socket.on("message:new", (message: NewMessage) => {
      if (message.roomId === roomIdRef.current) {
        setMessages((old) => [...old, message]);
      }
    });

    // The server tells us who is in the room whenever someone joins or leaves.
    socket.on("room:members", (update: MembersUpdate) => {
      if (update.roomId === roomIdRef.current) {
        setMembers(update.members);
      }
    });

    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [me.id]);

  // The list of rooms comes from a normal REST call.
  useEffect(() => {
    fetch(`${API_URL}/rooms`)
      .then((res) => res.json())
      .then(setRooms);
  }, []);

  // Enter a room: leave the old one, join the new one, then load old messages (REST).
  async function enterRoom(newRoomId: number) {
    const socket = socketRef.current!;
    setError(null);

    if (roomIdRef.current !== null) {
      await socket.emitWithAck("room:leave", { roomId: roomIdRef.current });
    }

    const reply = await socket.emitWithAck("room:join", { roomId: newRoomId });
    if (!reply.ok) {
      setError(reply.error);
      return;
    }

    roomIdRef.current = newRoomId;
    setRoomId(newRoomId);
    setMembers([]);
    const history = await fetch(`${API_URL}/rooms/${newRoomId}/messages`).then((res) => res.json());
    setMessages(history);
  }

  // Send what the user typed to the room they are in.
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (roomId === null) return;
    const reply = await socketRef.current!.emitWithAck("message:send", { roomId, text });
    if (reply.ok) setText("");
    else setError(reply.error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">3. Chat rooms</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You are <strong>{me.name}</strong> ({connected ? "connected" : "not connected"}).
      </p>

      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <aside className="space-y-2">
          <h2 className="font-medium">Rooms</h2>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => enterRoom(room.id)}
              disabled={!connected}
              className={`block w-full rounded-md border px-3 py-2 text-left disabled:opacity-40 ${
                room.id === roomId
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                  : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              # {room.name}
            </button>
          ))}
          {roomId !== null && (
            <div className="pt-2">
              <h3 className="text-sm font-medium">In this room</h3>
              <ul className="text-sm">
                {members.map((m) => (
                  <li key={m.id}>
                    {m.name}
                    {m.id === me.id && " (you)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="flex min-h-96 flex-col rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          {roomId === null ? (
            <p className="m-auto text-zinc-500">Pick a room to start chatting</p>
          ) : (
            <>
              <ul className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((m) => (
                  <li key={m.id}>
                    <span className={`font-medium ${m.user.id === me.id ? "text-indigo-600" : ""}`}>
                      {m.user.name}
                    </span>
                    : {m.text}
                  </li>
                ))}
              </ul>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-zinc-300 p-3 dark:border-zinc-700">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
                />
                <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
