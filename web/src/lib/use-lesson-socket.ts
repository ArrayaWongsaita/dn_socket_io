"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "./config";
import { useSocketLog } from "./use-socket-log";

// Lessons 3-9 use this so the page can focus on the lesson itself.
// You wrote the same thing by hand in lessons 1 and 2:
//   - connect to  API_URL + "/" + namespace   (for example http://localhost:3001/lesson3)
//   - close the connection when you leave the page
export function useLessonSocket(namespace: string) {
  // Created once, but not connected yet (it only exists in the browser, never on the server).
  const [socket] = useState<Socket | null>(() =>
    typeof window === "undefined" ? null : io(`${API_URL}/${namespace}`, { autoConnect: false }),
  );
  const [connected, setConnected] = useState(false);
  const { entries, clear } = useSocketLog(socket);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.connect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return { socket, connected, entries, clear };
}
