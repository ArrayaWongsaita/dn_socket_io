import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
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
// `namespace: 'connection'` means browsers connect to  http://localhost:3001/connection
// (think of a namespace as a separate address for one feature).
@WebSocketGateway({
  namespace: 'connection',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class ConnectionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('ConnectionGateway');

  constructor(private readonly prisma: PrismaService) {}

  // Runs once when the gateway starts. We plug in the handshake check here.
  afterInit(server: Server) {
    server.use(createAuthMiddleware(this.prisma));
  }

  // Runs every time a browser has connected successfully.
  handleConnection(client: Socket) {
    this.logger.log(`${client.data.user.name} connected (socket id: ${client.id})`);
  }

  // Runs every time a browser disconnects (closed the tab, pressed Disconnect, lost internet...).
  handleDisconnect(client: Socket) {
    this.logger.log(`${client.data.user?.name} disconnected (socket id: ${client.id})`);
  }

  // The browser does:  socket.emit('ping', (reply) => ...)
  // The value we return is sent back to that browser as the reply (called an "acknowledgement").
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { pong: true, user: client.data.user.name as string, socketId: client.id };
  }
}
