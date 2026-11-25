import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';

type Body = { from: string; text: string }; // the data the browser sends in both events

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

  // TODO(7.1): 'send:others' { from, text }  -> send to everyone EXCEPT the sender.
  //   - import ConnectedSocket from '@nestjs/websockets' and  import type { Socket } from 'socket.io'  (the other imports are already there)
  //   - add a method with  @SubscribeMessage('send:others'),  @ConnectedSocket() client: Socket  and  @MessageBody() body: Body
  //   - hint: client.broadcast.emit('received', { pattern: 'others', from: body.from, text: body.text })
}
