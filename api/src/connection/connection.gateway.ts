import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import { createAuthMiddleware } from '../socket/auth.middleware.js';

// PAGE 1: CONNECTION
//
// A "gateway" is to WebSockets what a "controller" is to REST:
// it is the class that receives events from browsers.
//
// GOAL: let browsers connect, check who they are, log connect/disconnect,
// and answer a "ping" event.
//
// Web side of this lesson: web/src/app/connection/page.tsx
//
// TODO(1.3): Give this gateway its own namespace so browsers connect to
//   http://localhost:3001/connection   (think of a namespace as a separate address for one feature).
//   hint: @WebSocketGateway({ namespace: 'connection', cors: { ... } })
@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class ConnectionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('ConnectionGateway');

  constructor(private readonly prisma: PrismaService) {}

  // Runs once when the gateway starts.
  afterInit(server: Server) {
    // TODO(1.4): plug in the handshake check (written in src/socket/auth.middleware.ts).
    //   hint: server.use(createAuthMiddleware(this.prisma))
    void server;
    void createAuthMiddleware;
  }

  // Runs every time a browser has connected successfully.
  handleConnection(client: Socket) {
    // TODO(1.3): log who connected.   hint: this.logger.log(`${client.data.user.name} connected (socket id: ${client.id})`)
    void client;
    void this.logger;
  }

  // Runs every time a browser disconnects (closed the tab, pressed Disconnect, lost internet...).
  handleDisconnect(client: Socket) {
    // TODO(1.3): log who disconnected. Careful: client.data.user may be missing if the handshake failed.
    void client;
  }

  // TODO(1.5): answer the browser's  socket.emit('ping', (reply) => ...)
  //   - hint: add a method with @SubscribeMessage('ping') and @ConnectedSocket() client: Socket
  //   - The value the method RETURNS is sent back to that browser as the reply (an "acknowledgement").
  //   - Return { pong: true, user: <the user's name>, socketId: client.id }
}
