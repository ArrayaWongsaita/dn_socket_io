"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { RequireUser } from "@/components/require-user";
import { API_URL } from "@/lib/config";
import { createSocket } from "@/lib/socket";

// PAGE 2: BROADCAST
//
// Goal: see the different ways an event can be sent.
// Open this page in several browser windows (each as a different user),
// press the buttons, and watch who receives what.
//
// Server side of this lesson: api/src/broadcast/broadcast.gateway.ts

type User = { id: number; name: string };
type Received = { pattern: string; from: string; text: string };

export default function BroadcastPage() {
  return <RequireUser>{(user) => <BroadcastLesson me={user} />}</RequireUser>;
}

function BroadcastLesson({ me }: { me: User }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [text, setText] = useState("Hello!");
  const [toUserId, setToUserId] = useState<number>(0);
  const [toUserIds, setToUserIds] = useState<number[]>([]);
  const [received, setReceived] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);

  // Connect when the page opens, disconnect when it closes.
  useEffect(() => {
    const socket = createSocket("/broadcast", me.id);
    socketRef.current = socket;

    // TODO(2.1): listen to events and connect.
    //   - socket.on("connect", () => setConnected(true))   and the same for "disconnect" with false
    //   - The server always uses the event name 'received' when it delivers something to us:
    //       socket.on("received", (message: Received) => { ...add a line to the list with setReceived... })
    //   - then open the connection: socket.connect()
    void setConnected;
    void setReceived;
    void (null as Received | null);

    // Close the connection when the user leaves the page.
    return () => {
      socket.disconnect();
    };
  }, [me.id]);

  // List of users for the "send to ..." pickers (plain REST).
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then((list: User[]) => {
        setUsers(list);
        setToUserId(list.find((u) => u.id !== me.id)?.id ?? 0);
      });
  }, [me.id]);

  const addResult = (line: string) => setResults((old) => [line, ...old]);

  // Each button below sends ONE event. The server decides who receives it.
  const socket = () => socketRef.current!;

  // Hint for all of them:  socket().emit("<event name>", { text })
  // The server side of each one is in api/src/broadcast/broadcast.gateway.ts (same TODO number).

  // TODO(2.3): to myself only.        event: "send:self"   payload: { text }
  const sendToSelf = () => {
    void socket;
  };
  // TODO(2.4): to everyone, me included.   event: "send:all"   payload: { text }
  const sendToAll = () => {};
  // TODO(2.5): to everyone except me.      event: "send:others"   payload: { text }
  const sendToOthers = () => {};
  // TODO(2.6): to one user. event: "send:user"  payload: { text, toUserId }
  //   emitWithAck waits for the server's reply ("how many tabs got it?"):
  //   const reply = await socket().emitWithAck(...);   addResult(`send:user -> delivered to ${reply.delivered} tab(s)`)
  const sendToUser = async () => {
    void [toUserId, addResult];
  };
  // TODO(2.7): to several users. event: "send:users"  payload: { text, toUserIds }  (also replies with { delivered })
  const sendToUsers = async () => {
    void toUserIds;
  };
  // TODO(2.8): request and reply: only the server answers me. event: "send:ack"  payload: { text }
  //   addResult(`send:ack -> server replied ${JSON.stringify(reply)}`)
  const sendAndWaitReply = async () => {};

  const others = users.filter((u) => u.id !== me.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">2. Broadcast</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You are <strong>{me.name}</strong> ({connected ? "connected" : "not connected"}). Open this page in
        more windows as other users and press the buttons.
      </p>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Message text"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Action title="Only me" hint="client.emit" onClick={sendToSelf} disabled={!connected} />
        <Action title="Everyone (including me)" hint="server.emit" onClick={sendToAll} disabled={!connected} />
        <Action
          title="Everyone except me"
          hint="client.broadcast.emit"
          onClick={sendToOthers}
          disabled={!connected}
        />
        <Action title="Server replies to me" hint="acknowledgement" onClick={sendAndWaitReply} disabled={!connected} />

        <div className={card}>
          <h3 className="font-medium">One other user</h3>
          <code className="text-xs text-zinc-500">server.to(&quot;user:id&quot;).emit</code>
          <div className="mt-2 flex gap-2">
            <select
              value={toUserId}
              onChange={(e) => setToUserId(Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {others.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button onClick={sendToUser} disabled={!connected || !toUserId} className={btn}>
              Send
            </button>
          </div>
        </div>

        <div className={card}>
          <h3 className="font-medium">Several users</h3>
          <code className="text-xs text-zinc-500">server.to([&quot;user:a&quot;, &quot;user:b&quot;]).emit</code>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {others.map((u) => (
              <label key={u.id} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={toUserIds.includes(u.id)}
                  onChange={(e) =>
                    setToUserIds((old) => (e.target.checked ? [...old, u.id] : old.filter((id) => id !== u.id)))
                  }
                />
                {u.name}
              </label>
            ))}
            <button onClick={sendToUsers} disabled={!connected || toUserIds.length === 0} className={btn}>
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Log title="Events I received" lines={received} empty="Nothing yet" />
        <Log title="Replies from the server" lines={results} empty="Nothing yet" />
      </div>
    </div>
  );
}

function Action(props: { title: string; hint: string; onClick: () => void; disabled: boolean }) {
  return (
    <div className={card}>
      <h3 className="font-medium">{props.title}</h3>
      <code className="text-xs text-zinc-500">{props.hint}</code>
      <div className="mt-2">
        <button onClick={props.onClick} disabled={props.disabled} className={btn}>
          Send
        </button>
      </div>
    </div>
  );
}

function Log({ title, lines, empty }: { title: string; lines: string[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-2 font-medium">{title}</h2>
      <ul className="min-h-24 space-y-1 rounded-lg bg-zinc-900 p-3 font-mono text-sm text-green-300">
        {lines.length === 0 && <li className="text-zinc-500">{empty}</li>}
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

const card = "rounded-lg border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900";
const btn =
  "rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40";
