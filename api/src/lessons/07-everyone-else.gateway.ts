import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

type Body = { from: string; text: string };

// LESSON 7: EVERYONE EXCEPT ME
//
// Compare the two patterns side by side (both send an event named 'received'):
//   server.emit(...)            -> everyone, the sender included   (lesson 6)
//   client.broadcast.emit(...)  -> everyone EXCEPT the sender      (this lesson)
//
// Web side of this lesson: web/src/app/lessons/07-everyone-else/page.tsx
@WebSocketGateway({
  namespace: 'lesson7',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson7Gateway {
  @WebSocketServer()
  server: Namespace;

  // Already written for you: lesson 6 again.
  @SubscribeMessage('send:all')
  onAll(@MessageBody() body: Body) {
    this.server.emit('received', { pattern: 'all', from: body.from, text: body.text });
  }

  @SubscribeMessage('send:others')
  onOthers(@ConnectedSocket() client: Socket, @MessageBody() body: Body) {
    client.broadcast.emit('received', { pattern: 'others', from: body.from, text: body.text });
  }
}
