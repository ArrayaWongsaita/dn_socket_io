import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

// LESSON 3: CLIENT TO SERVER
//
// The browser sends an event with  socket.emit('note:send', { text })
// and the server listens for it with  @SubscribeMessage('note:send').
// An event is just a name plus some data. You choose the name.
// (Think of @SubscribeMessage like @Post in a controller: "run this method when this arrives".)
//
// Web side of this lesson: web/src/app/lessons/03-send-to-server/page.tsx
@WebSocketGateway({
  namespace: 'lesson3',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson3Gateway {
  private readonly logger = new Logger('Lesson3');

  @SubscribeMessage('note:send')
  onNote(@ConnectedSocket() client: Socket, @MessageBody() body: { text: string }) {
    this.logger.log(`note from ${client.id}: ${body.text}`);
  }
}
