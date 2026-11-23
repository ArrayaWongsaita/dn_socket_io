import { io, type Socket } from "socket.io-client";
import { API_URL } from "./config";

// Creates a socket for ONE namespace ("/connection", "/broadcast" or "/chat").
//
// - The address we connect to is  API_URL + namespace,  e.g. http://localhost:3001/chat
// - `auth` is sent to the server during the handshake. The server reads it to
//   know which user is connecting (see api/src/socket/auth.middleware.ts).
// - `autoConnect: false` means "don't connect yet": each page calls socket.connect() itself.
export function createSocket(namespace: string, userId: number): Socket {
  return io(API_URL + namespace, {
    auth: { userId },
    autoConnect: false,
  });
}
