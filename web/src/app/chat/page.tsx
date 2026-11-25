"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { RequireUser } from "@/components/require-user";
import { API_URL } from "@/lib/config";
import { useSocketLog } from "@/lib/use-socket-log";
import { EventLog } from "@/components/event-log";

// LESSONS 11 + 12: CHAT ROOMS
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
  // The connection to /chat. Your user id goes in the handshake (lesson 10), so the server knows who you are.
  const [socket] = useState<Socket | null>(() =>
    typeof window === "undefined" ? null : io(`${API_URL}/chat`, { auth: { userId: me.id }, ackTimeout: 3000, autoConnect: false }),
  );
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
  const { entries } = useSocketLog(socket);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setConnected(true);
      // LESSON 12: 'connect' also fires again after the connection drops and comes back (Socket.IO
      // reconnects by itself). The server forgets our rooms when we disconnect, so join the room again.
      if (roomIdRef.current !== null) socket.emit("room:join", { roomId: roomIdRef.current });
    });
    socket.on("disconnect", () => setConnected(false));

    // LESSON 11: a new message arrived in a room I am in.
    socket.on("message:new", (message: NewMessage) => {
      if (message.roomId === roomIdRef.current) setMessages((old) => [...old, message]);
    });

    // LESSON 12: the server says who is in the room.
    socket.on("room:members", (update: MembersUpdate) => {
      if (update.roomId === roomIdRef.current) setMembers(update.members);
    });

    socket.connect(); // listeners are ready: now connect

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  // The list of rooms comes from a normal REST call.
  useEffect(() => {
    fetch(`${API_URL}/rooms`)
      .then((res) => res.json())
      .then(setRooms);
  }, []);

  // emitWithAck throws when the server does not answer within 3 seconds: show that as an error.
  const noAnswer = "no answer from the server: is the handler written and the API running?";

  // Enter a room: leave the old one, join the new one, then load old messages (REST).
  async function enterRoom(newRoomId: number) {
    if (!socket) return;
    setError(null);

    try {
      if (roomIdRef.current !== null) {
        await socket.emitWithAck("room:leave", { roomId: roomIdRef.current });
      }

      // Remember the new room BEFORE joining: the server sends the member list
      // right away, and our listener must already know which room we are in.
      roomIdRef.current = newRoomId;
      setRoomId(newRoomId);
      setMembers([]);
      setMessages([]);

      const reply = await socket.emitWithAck("room:join", { roomId: newRoomId });
      if (!reply.ok) {
        roomIdRef.current = null;
        setRoomId(null);
        setError(reply.error);
        return;
      }

      // Load the old messages (REST). Keep any live message that arrived meanwhile,
      // without showing the same message twice.
      const history: Message[] = await fetch(`${API_URL}/rooms/${newRoomId}/messages`).then((res) => res.json());
      setMessages((live) => [...history, ...live.filter((m) => !history.some((h) => h.id === m.id))]);
    } catch {
      roomIdRef.current = null;
      setRoomId(null);
      setError(noAnswer);
    }
  }

  // Send what the user typed to the room they are in.
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!socket || roomId === null) return;
    try {
      const reply = await socket.emitWithAck("message:send", { roomId, text });
      if (reply.ok) setText("");
      else setError(reply.error);
    } catch {
      setError(noAnswer);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">11-12. Chat rooms</h1>
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
      <EventLog entries={entries} />
    </div>
  );
}
