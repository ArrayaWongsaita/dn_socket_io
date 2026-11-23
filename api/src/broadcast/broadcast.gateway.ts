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

// PAGE 2: BROADCAST  (namespace: /broadcast)
//
// Socket.IO has a few different ways to say "who should receive this event?".
// Each handler below shows exactly ONE of them.
//
// Two objects do the sending:
//   `client` = the one socket that just sent us something   (this browser tab)
//   `server` = every socket connected to this namespace     (all browser tabs)
//
// Whatever the pattern, the browser receives the event named 'received'.

// What the browser sends to us
type TextMessage = { text: string };
type ToUserMessage = { text: string; toUserId: number };
type ToUsersMessage = { text: string; toUserIds: number[] };

// What the browser receives from us
type Received = { pattern: string; from: string; text: string };

@WebSocketGateway({
  namespace: 'broadcast',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class BroadcastGateway implements OnGatewayInit, OnGatewayConnection {
  // Nest gives us the namespace object: "everyone connected to /broadcast".
  @WebSocketServer()
  server: Namespace;

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Namespace) {
    server.use(createAuthMiddleware(this.prisma));
  }

  // When someone connects we put them in a personal "room" named after their user id.
  // A room is just a named group of sockets. Why do this?
  // The same person can open many tabs (many sockets). Sending to the room
  // `user:1` reaches ALL of Alice's tabs at once.
  handleConnection(client: Socket) {
    client.join(userRoom(client.data.user.id));
  }

  // 1) Send to ONLY the sender  ->  client.emit(...)
  @SubscribeMessage('send:self')
  sendToSelf(@ConnectedSocket() client: Socket, @MessageBody() body: TextMessage) {
    client.emit('received', makeReceived('self', client, body.text));
  }

  // 2) Send to EVERYONE, sender included  ->  server.emit(...)
  @SubscribeMessage('send:all')
  sendToAll(@ConnectedSocket() client: Socket, @MessageBody() body: TextMessage) {
    this.server.emit('received', makeReceived('all', client, body.text));
  }

  // 3) Send to everyone EXCEPT the sender  ->  client.broadcast.emit(...)
  @SubscribeMessage('send:others')
  sendToOthers(@ConnectedSocket() client: Socket, @MessageBody() body: TextMessage) {
    client.broadcast.emit('received', makeReceived('others', client, body.text));
  }

  // 4) Send to ONE user (all of their tabs)  ->  server.to(room).emit(...)
  // The returned object is the "acknowledgement": the browser's callback receives it.
  @SubscribeMessage('send:user')
  async sendToUser(@ConnectedSocket() client: Socket, @MessageBody() body: ToUserMessage) {
    const room = userRoom(body.toUserId);
    this.server.to(room).emit('received', makeReceived('user', client, body.text));

    // Ask Socket.IO who is in that room, so we can tell the sender how many tabs got it.
    const receivers = await this.server.in(room).fetchSockets();
    return { delivered: receivers.length };
  }

  // 5) Send to SEVERAL users  ->  server.to([room1, room2]).emit(...)
  @SubscribeMessage('send:users')
  async sendToUsers(@ConnectedSocket() client: Socket, @MessageBody() body: ToUsersMessage) {
    const rooms = body.toUserIds.map(userRoom);
    this.server.to(rooms).emit('received', makeReceived('users', client, body.text));

    const receivers = await this.server.in(rooms).fetchSockets();
    return { delivered: receivers.length };
  }

  // 6) Request and reply: nobody else is told, we simply answer the sender.
  // The browser asks and waits:  const reply = await socket.emitWithAck('send:ack', ...)
  @SubscribeMessage('send:ack')
  replyToSender(@MessageBody() body: TextMessage) {
    return { ok: true, echo: body.text, serverTime: new Date().toISOString() };
  }
}

// The name of the personal room of a user, e.g. user 1 -> "user:1".
function userRoom(userId: number) {
  return `user:${userId}`;
}

// Builds the message the browser will receive.
function makeReceived(pattern: string, sender: Socket, text: string): Received {
  return { pattern, from: sender.data.user.name, text };
}
