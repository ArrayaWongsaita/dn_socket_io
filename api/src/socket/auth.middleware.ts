import type { Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';

// The "who are you?" check that runs ONCE, at the very first moment a client connects
// (this first conversation between client and server is called the "handshake").
//
// The browser sends:   io(url, { auth: { userId: 1 } })
// We read it here:     socket.handshake.auth.userId
//
// GOAL
//   - Found a real user  -> remember them in `socket.data.user` and let the connection through.
//   - Anything else      -> call next(new Error('some message')); the client receives a
//                           "connect_error" event with that message and the connection is refused.
//
// It is used by all three gateways (connection, broadcast, chat).
export function createAuthMiddleware(prisma: PrismaService) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    // TODO(1.4): Step 1 - read the userId the browser sent in the handshake.
    //   hint: socket.handshake.auth.userId   and   Number(...)
    //   It must be a whole number (hint: Number.isInteger). If not: return next(new Error('userId missing or not a number'))

    // TODO(1.4): Step 2 - look the user up in the database.
    //   hint: await prisma.user.findUnique({ where: { id: userId } })
    //   Wrap it in try/catch: Socket.IO does not handle errors thrown here, so a database
    //   error would crash the whole server. In the catch: return next(new Error('...'))
    //   If no user is found: return next(new Error('user not found'))

    // TODO(1.4): Step 3 - remember who this socket is so every event handler can read it later.
    //   hint: socket.data.user = { id: user.id, name: user.name }   then call next()

    // Temporary line so the app keeps running: delete it when steps 1-3 are done.
    void prisma;
    next(new Error('TODO(1.4): the handshake check is not written yet'));
  };
}
