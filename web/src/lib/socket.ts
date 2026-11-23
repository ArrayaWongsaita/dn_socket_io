import type { Socket } from "socket.io-client";

// Creates a socket for ONE namespace ("/connection", "/broadcast" or "/chat").
// Every page calls this, so write it first (it is the first step of page 1).
//
// TODO(1.1): create and return the socket.
//   - import { io } from "socket.io-client" and  import { API_URL } from "./config"
//   - The address to connect to is  API_URL + namespace,  e.g. http://localhost:3001/chat
//   - Second argument (options):
//       auth: { userId }      -> sent to the server during the handshake, so it knows who you are
//       autoConnect: false    -> "don't connect yet": each page calls socket.connect() itself
//   - hint:  return io(API_URL + namespace, { auth: { userId }, autoConnect: false });
export function createSocket(namespace: string, userId: number): Socket {
  throw new Error(`TODO(1.1): write createSocket in web/src/lib/socket.ts (namespace ${namespace}, user ${userId})`);
}
