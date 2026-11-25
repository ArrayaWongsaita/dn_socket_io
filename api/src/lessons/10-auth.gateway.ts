import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuthMiddleware } from '../socket/auth.middleware.js';

// LESSON 10: WHO IS CONNECTED
//
// In lessons 6-9 a message said who sent it ({ from: 'Tab-4F2K' }), but the browser decided that name:
// anybody could write anything. Now the SERVER decides.
//   1. The browser sends its user id once, in the handshake:  io(url, { auth: { userId } })
//   2. A middleware (src/socket/auth.middleware.ts) looks the user up and stores them in `socket.data.user`.
//   3. Every handler can now read `client.data.user`: trusted, because the server put it there.
//
// Needs the database: run `docker compose up -d` first (see the README).
// Web side of this lesson: web/src/app/lessons/10-auth/page.tsx
@WebSocketGateway({
  namespace: 'auth',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson10Gateway implements OnGatewayInit {
  @WebSocketServer()
  server: Namespace;

  constructor(private readonly prisma: PrismaService) {}

  // Runs once when the gateway starts. A middleware runs for every new connection BEFORE it is accepted.
  afterInit(server: Namespace) {
    server.use(createAuthMiddleware(this.prisma));
  }

  @SubscribeMessage('message:send')
  onMessage(@ConnectedSocket() client: Socket, @MessageBody() body: { text: string }) {
    // The name comes from the handshake, NOT from what the browser sent in this message.
    this.server.emit('message:new', { text: body.text, from: client.data.user.name });
  }
}
