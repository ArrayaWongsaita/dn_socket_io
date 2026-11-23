import type { Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';

// The "who are you?" check that runs ONCE, at the very first moment a client connects
// (this first conversation between client and server is called the "handshake").
//
// The browser sends:   io(url, { auth: { userId: 1 } })
// We read it here:     socket.handshake.auth.userId
//
// - Found a real user  -> remember them in `socket.data.user` and let the connection through.
// - Anything else      -> call next(new Error(...)); the client receives a "connect_error" event
//                         with that message and the connection is refused.
export function createAuthMiddleware(prisma: PrismaService) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    const userId = Number(socket.handshake.auth.userId);

    // Step 1: userId must be a whole number (a missing userId becomes NaN too).
    if (!Number.isInteger(userId)) {
      return next(new Error('userId missing or not a number'));
    }

    // Step 2: that number must belong to a user in the database.
    // We wrap the database call in try/catch: Socket.IO does not handle errors thrown
    // inside middleware, so without this a bad id (or a stopped database) would crash the server.
    let user;
    try {
      // Ids in Postgres are 32-bit integers; anything bigger cannot exist.
      user = userId > 0 && userId <= 2_147_483_647 ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    } catch {
      return next(new Error('could not check the user right now, is the database running?'));
    }
    if (!user) {
      return next(new Error('user not found'));
    }

    // Step 3: remember who this socket is. Every event handler can read it later.
    socket.data.user = { id: user.id, name: user.name };
    next();
  };
}
