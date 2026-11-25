import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

// LESSON 1: CONNECT
//
// A "gateway" is to WebSockets what a "controller" is to REST:
// it is the class that receives events from browsers.
//
// `namespace: 'lesson1'` means browsers connect to  http://localhost:3001/lesson1
// (namespaces are explained in lesson 9; for now it just keeps the lessons apart).
//
// Web side of this lesson: web/src/app/lessons/01-connect/page.tsx
@WebSocketGateway({
  namespace: 'lesson1',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson1Gateway implements OnGatewayConnection {
  private readonly logger = new Logger('Lesson1');

  // Nest calls this every time a browser has connected successfully.
  handleConnection(client: Socket) {
    // TODO(1.3): print a line in the API terminal when someone connects.
    //   hint: this.logger.log(`connected: ${client.id}`)
    //   client.id is the socket id: one id per browser tab, new on every connection.
    void client;
    void this.logger;
  }
}
