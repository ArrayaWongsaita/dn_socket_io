"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

// One line of the on-screen event log.
export type LogEntry = {
  id: number;
  time: string;
  kind: "sent" | "received" | "system";
  text: string;
};

const MAX_ENTRIES = 200;

// Watches a socket and records everything that crosses the wire, so every lesson
// can show "what was sent and what came back" without extra code from you.
//   sent      = events this tab emitted        (socket.onAnyOutgoing)
//   received  = events the server sent         (socket.onAny)
//   system    = connect / disconnect / connect_error (these three are not caught by onAny)
// Newest entry first.
export function useSocketLog(socket: Socket | null) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const nextId = useRef(0);

  const add = useCallback((kind: LogEntry["kind"], text: string) => {
    const entry: LogEntry = { id: nextId.current++, time: new Date().toLocaleTimeString(), kind, text };
    setEntries((old) => [entry, ...old].slice(0, MAX_ENTRIES));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const show = (event: string, args: unknown[]) =>
      `${event} ${args.map((a) => JSON.stringify(a)).join(" ")}`.trim();

    const onConnect = () => add("system", `connect (socket id ${socket.id})`);
    const onDisconnect = (reason: string) => add("system", `disconnect: ${reason}`);
    const onError = (error: Error) => add("system", `connect_error: ${error.message}`);
    const onReceived = (event: string, ...args: unknown[]) => add("received", show(event, args));
    const onSent = (event: string, ...args: unknown[]) => add("sent", show(event, args));

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);
    socket.onAny(onReceived);
    socket.onAnyOutgoing(onSent);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.offAny(onReceived);
      socket.offAnyOutgoing(onSent);
    };
  }, [socket, add]);

  const clear = useCallback(() => setEntries([]), []);
  return { entries, clear };
}
