import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
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

type RoomOnly = { roomId: number };
type NewMessage = { roomId: number; text: string };

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

  // LESSON 12: Socket.IO tells us "this socket is about to disconnect" with the 'disconnecting' event.
  // At that moment it is still inside its rooms, so this is our chance to tell
  // each room that this person is leaving.
  handleConnection(client: Socket) {
    client.on('disconnecting', () => {
      for (const room of client.rooms) {
        if (room.startsWith('room:')) {
          void this.sendMemberList(room, client.id);
        }
      }
    });
  }

  // LESSON 11: the browser asks to enter a room.
  @SubscribeMessage('room:join')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() body: RoomOnly) {
    const room = await this.prisma.room.findUnique({ where: { id: Number(body.roomId) } });
    if (!room) {
      return { ok: false, error: 'room not found' };
    }

    await client.join(roomName(room.id)); // <- the actual "enter the room"
    await this.sendMemberList(roomName(room.id)); // lesson 12: tell everyone in the room who is there now
    return { ok: true };
  }

  // LESSON 11: the browser asks to leave a room.
  @SubscribeMessage('room:leave')
  async leaveRoom(@ConnectedSocket() client: Socket, @MessageBody() body: RoomOnly) {
    await client.leave(roomName(Number(body.roomId)));
    await this.sendMemberList(roomName(Number(body.roomId)));
    return { ok: true };
  }

  // LESSON 11: the browser sends a chat message to a room.
  @SubscribeMessage('message:send')
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() body: NewMessage) {
    const room = roomName(Number(body.roomId));
    const text = String(body.text ?? '').trim();

    // Rule 1: you can only talk in rooms you have joined.
    if (!client.rooms.has(room)) {
      return { ok: false, error: 'join the room first' };
    }
    // Rule 2: no empty messages.
    if (text === '') {
      return { ok: false, error: 'message is empty' };
    }

    // Save it in Postgres so people who join later can read the history.
    const saved = await this.prisma.message.create({
      data: { text, roomId: Number(body.roomId), userId: client.data.user.id },
      include: { user: true },
    });

    // Send it to everybody in the room (the sender too, so everyone sees the same list).
    this.server.to(room).emit('message:new', {
      id: saved.id,
      text: saved.text,
      createdAt: saved.createdAt,
      roomId: saved.roomId,
      user: { id: saved.user.id, name: saved.user.name },
    });
    return { ok: true };
  }

  // LESSON 12: tells everybody in a room who is inside it. `leavingSocketId` lets us skip
  // a socket that is in the middle of disconnecting.
  private async sendMemberList(room: string, leavingSocketId?: string) {
    const sockets = await this.server.in(room).fetchSockets();

    // One person may have several tabs open, so we list each user only once.
    const members = new Map<number, { id: number; name: string }>();
    for (const socket of sockets) {
      if (socket.id !== leavingSocketId) {
        members.set(socket.data.user.id, socket.data.user);
      }
    }

    this.server.to(room).emit('room:members', {
      roomId: Number(room.replace('room:', '')),
      members: [...members.values()],
    });
  }
}

// The name of the Socket.IO room for a chat room, e.g. 1 -> "room:1".
function roomName(roomId: number) {
  return `room:${roomId}`;
}
