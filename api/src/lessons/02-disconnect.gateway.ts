import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

// LESSON 2: DISCONNECT
//
// A connection can end in many ways: you press Disconnect, you close the tab,
// the internet drops, the server stops. The server is told every time.
//
// Web side of this lesson: web/src/app/lessons/02-disconnect/page.tsx
@WebSocketGateway({
  namespace: 'lesson2',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson2Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('Lesson2');

  // Same as lesson 1 (already written for you).
  handleConnection(client: Socket) {
    this.logger.log(`connected: ${client.id}`);
  }

  // Nest calls this every time a browser has gone away, whatever the reason.
  handleDisconnect(client: Socket) {
    // TODO(2.3): print a line in the API terminal when someone leaves.
    //   hint: this.logger.log(`disconnected: ${client.id}`)
    void client;
  }
}
