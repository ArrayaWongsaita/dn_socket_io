import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuthMiddleware } from '../socket/auth.middleware.js';

// PAGE 2: BROADCAST
//
// Socket.IO has a few different ways to say "who should receive this event?".
// Each handler you write below shows exactly ONE of them.
//
// Two objects do the sending:
//   `client` = the one socket that just sent us something   (this browser tab)
//   `server` = every socket connected to this namespace     (all browser tabs)
//
// Whatever the pattern, the browser receives an event named 'received' with this shape:
//   { pattern: string, from: string, text: string }      e.g. { pattern: 'all', from: 'Alice', text: 'Hi' }
//
// Web side of this lesson: web/src/app/broadcast/page.tsx
//
// TODO(2.2): give this gateway the namespace 'broadcast' (see how the connection gateway does it).
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class BroadcastGateway implements OnGatewayInit, OnGatewayConnection {
  // Nest gives us the namespace object: "everyone connected to this namespace".
  @WebSocketServer()
  server: Namespace;

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Namespace) {
    // TODO(2.2): apply the handshake check, like in the connection gateway.
    void server;
    void createAuthMiddleware;
    void this.prisma;
  }

  // When someone connects, put them in a personal "room" named after their user id.
  // A room is just a named group of sockets. The same person can open many tabs (many sockets),
  // and sending to the room `user:1` reaches ALL of Alice's tabs at once.
  handleConnection(client: Socket) {
    // TODO(2.2): hint: client.join(`user:${client.data.user.id}`)   (join returns a promise: await it)
    void client;
  }

  // TODO(2.3): 'send:self' { text }  -> send ONLY to the sender.      hint: client.emit('received', ...)
  //
  // TODO(2.4): 'send:all' { text }  -> send to EVERYONE, sender included.  hint: this.server.emit('received', ...)
  //
  // TODO(2.5): 'send:others' { text }  -> send to everyone EXCEPT the sender.  hint: client.broadcast.emit('received', ...)
  //
  // TODO(2.6): 'send:user' { text, toUserId }  -> send to ONE user (all of their tabs).
  //   hint: this.server.to(`user:${toUserId}`).emit('received', ...)
  //   Return { delivered: <number of sockets that got it> } as the acknowledgement.
  //   hint: (await this.server.in(room).fetchSockets()).length
  //
  // TODO(2.7): 'send:users' { text, toUserIds: number[] } -> send to SEVERAL users.
  //   hint: this.server.to([room1, room2]).emit('received', ...)   Return { delivered } too.
  //
  // TODO(2.8): 'send:ack' { text }  -> tell nobody, just reply to the sender.
  //   Return { ok: true, echo: text, serverTime: new Date().toISOString() }
  //
  // For each one add a method with @SubscribeMessage('<event name>'),
  // @ConnectedSocket() client: Socket and @MessageBody() body.
  // (import them from '@nestjs/websockets'). The sender's name is client.data.user.name.
}
