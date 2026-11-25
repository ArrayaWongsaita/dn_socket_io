import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuthMiddleware } from '../socket/auth.middleware.js';

// LESSONS 11 + 12: THE CHAT  (namespace: /chat)
//
// You know every command used here already:
//   lesson 8   client.join / client.leave / server.to(room).emit     (rooms)
//   lesson 5   returning { ok: ... } from a handler                  (acknowledgement)
//   lesson 10  the handshake middleware and client.data.user         (who is connected)
// New here: SAVING messages with Prisma, so people who join later (or come back) can read the history.
// The history itself is served by the plain REST endpoint GET /rooms/:id/messages (rooms.controller.ts).
//
// Events (ack = the value you return is sent back to the sender):
//   room:join    { roomId }        ack { ok: true } or { ok: false, error }
//   room:leave   { roomId }        ack { ok: true }
//   message:send { roomId, text }  ack { ok: true } or { ok: false, error }
//   -> to the room:  message:new { id, text, createdAt, roomId, user }   (lesson 11)
//   -> to the room:  room:members { roomId, members }                    (lesson 12)
//
// Web side: web/src/app/chat/page.tsx

// The data the browser sends:  room:join / room:leave { roomId },  message:send { roomId, text }
type RoomOnly = { roomId: number };
type NewMessage = { roomId: number; text: string };
void (null as RoomOnly | NewMessage | null);

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Namespace;

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Namespace) {
    server.use(createAuthMiddleware(this.prisma));
  }

  handleConnection(client: Socket) {
    // TODO(12.3): when this socket is about to disconnect, tell each room it was in.
    //   hint: client.on('disconnecting', () => { for (const room of client.rooms) { ... } })
    //   While 'disconnecting' the socket is still inside its rooms, so exclude it from the member list
    //   (second parameter of the helper from TODO 12.1). Only look at rooms that start with 'room:'.
    void client;
  }

  // For every handler below: a method with @SubscribeMessage('<event>'), @ConnectedSocket() client: Socket
  // and @MessageBody() body (import them from '@nestjs/websockets').
  // The Socket.IO room of a chat room with id 1 is named 'room:1'.

  // TODO(11.1): 'room:join' { roomId }
  //   1. Check the room exists in the database (this.prisma.room.findUnique). If not, return { ok: false, error: 'room not found' }.
  //   2. Put the socket in the room.   hint: await client.join(`room:${roomId}`)
  //   3. (Lesson 12, TODO 12.2) tell everybody in the room who is inside now.
  //   4. return { ok: true }
  //
  // TODO(11.2): 'room:leave' { roomId }
  //   client.leave(`room:${roomId}`), (TODO 12.2: tell the room the new member list), return { ok: true }
  //
  // TODO(11.3): 'message:send' { roomId, text }
  //   1. Refuse if the socket has not joined that room (hint: client.rooms.has(...)) -> { ok: false, error: 'join the room first' }
  //   2. Refuse if the text is empty after trim() -> { ok: false, error: 'message is empty' }
  //   3. Save it so people can read it later:
  //        this.prisma.message.create({ data: { text, roomId, userId: client.data.user.id }, include: { user: true } })
  //   4. Send it to the room only (lesson 8):
  //        this.server.to(`room:${roomId}`).emit('message:new', { id, text, createdAt, roomId, user: { id, name } })
  //   5. return { ok: true }
  //
  // TODO(12.1): write a helper  private async sendMemberList(room: string, leavingSocketId?: string)
  //   - hint: const sockets = await this.server.in(room).fetchSockets()
  //   - One person may have several tabs: list each user only once (hint: a Map keyed by user id; the user is socket.data.user).
  //   - Skip the socket whose id is leavingSocketId.
  //   - Emit 'room:members' { roomId: <number from 'room:1'>, members: { id, name }[] } to everybody in the room.
  //
  // TODO(12.2): call sendMemberList after a join and after a leave (see TODO 11.1 and 11.2).
}
