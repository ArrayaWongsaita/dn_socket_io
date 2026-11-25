import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';

// LESSON 6: EVERYONE
//
// Two objects can send:
//   `client` = the one socket that just sent us something   (lesson 4: client.emit)
//   `server` = every socket connected to this namespace     (this lesson: server.emit)
// `server.emit(...)` reaches EVERYONE, the sender included.
//
// Web side of this lesson: web/src/app/lessons/06-everyone/page.tsx
@WebSocketGateway({
  namespace: 'lesson6',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson6Gateway {
  // Nest gives us the namespace object: "everyone connected to /lesson6".
  @WebSocketServer()
  server: Namespace;

  // TODO(6.3): the browser sends 'shout' with { from, text }. Pass it on to EVERYONE.
  //   - import MessageBody and SubscribeMessage from '@nestjs/websockets'
  //   - add a method with  @SubscribeMessage('shout')  and  @MessageBody() body: { from: string; text: string }
  //   - hint: this.server.emit('shout', { from: body.from, text: body.text })
}
