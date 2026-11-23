import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuthMiddleware } from '../socket/auth.middleware.js';

// PAGE 3: CHAT ROOMS
//
// A ROOM is a named group of sockets. Socket.IO does the bookkeeping for us:
//   client.join('room:1')            put this socket in the group
//   client.leave('room:1')           take it out
//   server.to('room:1').emit(...)    send an event to everybody in the group
// Sockets also leave their rooms automatically when they disconnect.
//
// Events the web page uses (ack = the value you return is sent back to the sender):
//   room:join    { roomId }        ack { ok: true } or { ok: false, error }
//   room:leave   { roomId }        ack { ok: true }
//   message:send { roomId, text }  ack { ok: true } or { ok: false, error }
// Events this gateway sends to the browsers of a room:
//   room:members { roomId, members: { id, name }[] }
//   message:new  { id, text, createdAt, roomId, user: { id, name } }
//
// Web side of this lesson: web/src/app/chat/page.tsx
//
// TODO(3.2): give this gateway the namespace 'chat'.
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Namespace;

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Namespace) {
    // TODO(3.2): apply the handshake check (createAuthMiddleware).
    void server;
    void createAuthMiddleware;
    void this.prisma;
  }

  handleConnection(client: Socket) {
    // TODO(3.6): when this socket is about to disconnect, tell each room it was in.
    //   hint: client.on('disconnecting', () => { for (const room of client.rooms) ... })
    //   While 'disconnecting' the socket is still inside its rooms; exclude it from the member list.
    void client;
  }

  // TODO(3.3): 'room:join' { roomId }
  //   1. Check the room exists in the database (prisma.room.findUnique). If not return { ok: false, error: 'room not found' }.
  //   2. Put the socket in the room.   hint: await client.join(`room:${roomId}`)
  //   3. Tell everybody in the room who is inside now (see TODO 3.6 helper below).
  //   4. return { ok: true }
  //
  // TODO(3.4): 'room:leave' { roomId }
  //   client.leave(`room:${roomId}`), tell the room the new member list, return { ok: true }
  //
  // TODO(3.5): 'message:send' { roomId, text }
  //   1. Refuse if the socket has not joined that room (hint: client.rooms.has(...)) -> { ok: false, error: 'join the room first' }
  //   2. Refuse if the text is empty after trim() -> { ok: false, error: 'message is empty' }
  //   3. Save with Prisma: this.prisma.message.create({ data: { text, roomId, userId: client.data.user.id }, include: { user: true } })
  //   4. Send it to the room only: this.server.to(`room:${roomId}`).emit('message:new', { ... })
  //   5. return { ok: true }
  //
  // TODO(3.6): write a helper  sendMemberList(room: string, leavingSocketId?: string)
  //   - hint: const sockets = await this.server.in(room).fetchSockets()
  //   - One person may have several tabs: list each user only once (hint: a Map keyed by user id).
  //   - Skip the socket whose id is leavingSocketId.
  //   - Emit 'room:members' { roomId, members } to everybody in the room.
  //
  // Use @SubscribeMessage('<event>'), @ConnectedSocket() and @MessageBody() from '@nestjs/websockets'.
}
