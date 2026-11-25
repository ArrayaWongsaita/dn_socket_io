"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { EventLog } from "@/components/event-log";
import { API_URL } from "@/lib/config";
import { saveCurrentUser, useCurrentUser } from "@/lib/current-user";
import { useSocketLog } from "@/lib/use-socket-log";

type User = { id: number; name: string };
type ChatMessage = { text: string; from: string };

// LESSON 10: WHO IS CONNECTED
//
// Goal: tell the server who you are when you connect, and see it refuse someone it does not know.
// 1. Pick a user (this is the "login" for lessons 10-12: no password, just a click).
// 2. Press Connect. Then try "Connect as a user that does not exist".
// 3. Send a message: the name next to it comes from the SERVER, not from your tab.
//
// Server side of this lesson: api/src/lessons/10-auth.gateway.ts and api/src/socket/auth.middleware.ts
export default function AuthLesson() {
  const current = useCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState("hello");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { entries } = useSocketLog(socket);

  // The list of users comes from a normal REST call (needs the database).
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setApiError(`Cannot reach the API at ${API_URL}. Is it running (and the database)?`));
  }, []);

  // Close the connection when you leave the page.
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  function connect(userId: number) {
    socket?.disconnect();

    // Step 1: send your user id in the handshake. The server reads it as socket.handshake.auth.userId.
    const next = io(`${API_URL}/auth`, { auth: { userId } });

    next.on("connect", () => setConnected(true));
    next.on("disconnect", () => setConnected(false));
    // Step 2: when the server refuses the handshake you get 'connect_error'. error.message is the server's text
    // (the panel already shows it; the page only needs to know we are not connected).
    next.on("connect_error", () => setConnected(false));
    next.on("message:new", (message: ChatMessage) => setMessages((old) => [message, ...old]));
    setSocket(next);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">10. Who is connected</h1>
      <section className="space-y-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="font-medium">1. Who do you want to be?</h2>
        {apiError && <p className="text-red-600">{apiError}</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => saveCurrentUser(user)}
              className={`rounded-lg border p-3 font-medium hover:border-indigo-500 ${
                current?.id === user.id
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {user.name}
            </button>
          ))}
        </div>

        <h2 className="pt-2 font-medium">2. Connect</h2>
        <p className="text-sm">Status: {connected ? "connected" : "not connected"}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => current && connect(current.id)} disabled={!current || connected} className={btn}>
            Connect as {current?.name ?? "..."}
          </button>
          <button onClick={() => connect(9999)} disabled={connected} className={btn}>
            Connect as a user that does not exist
          </button>
          <button onClick={() => socket?.disconnect()} disabled={!connected} className={btn}>
            Disconnect
          </button>
        </div>

        <h2 className="pt-2 font-medium">3. Send a message to everyone</h2>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
          />
          <button onClick={() => socket?.emit("message:send", { text })} disabled={!connected} className={btn}>
            Send
          </button>
        </div>
        <ul className="space-y-1">
          {messages.map((m, i) => (
            <li key={i}>
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
