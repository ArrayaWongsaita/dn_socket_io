import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
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
    client.emit('welcome', { message: `Welcome! Your socket id is ${client.id}` });
  }

  // The browser says hello, the server answers only that browser.
  @SubscribeMessage('hello')
  onHello(@ConnectedSocket() client: Socket, @MessageBody() body: { name: string }) {
    client.emit('hello:reply', { message: `Hello, ${body.name}!` });
  }
}
