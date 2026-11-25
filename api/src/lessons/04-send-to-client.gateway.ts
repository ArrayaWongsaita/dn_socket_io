import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

// LESSON 4: SERVER TO CLIENT
//
// Sending works in both directions. The server can:
//   - speak first, with no question asked   (the 'welcome' below)
//   - answer one browser                    (the 'hello:reply' below)
// Both use  client.emit('event', data):  "send this event to THIS one browser".
// The browser listens with  socket.on('event', callback).
//
// Web side of this lesson: web/src/app/lessons/04-send-to-client/page.tsx
@WebSocketGateway({
  namespace: 'lesson4',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson4Gateway implements OnGatewayConnection {
  // The server speaks first: this runs as soon as a browser connects.
  handleConnection(client: Socket) {
    // TODO(4.1): send the event 'welcome' to this browser.
    //   hint: client.emit('welcome', { message: `Welcome! Your socket id is ${client.id}` })
    void client;
  }

  // TODO(4.2): the browser says hello (event 'hello', data { name }); answer ONLY that browser.
  //   - import ConnectedSocket, MessageBody and SubscribeMessage from '@nestjs/websockets' (like in lesson 3)
  //   - add a method with  @SubscribeMessage('hello')  (you wrote one in lesson 3)
  //   - parameters:  @ConnectedSocket() client: Socket   and   @MessageBody() body: { name: string }
  //   - hint: client.emit('hello:reply', { message: `Hello, ${body.name}!` })
}
