import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';

// LESSON 9: NAMESPACES
//
// A NAMESPACE is a separate channel on the same server, with its own address:
//   http://localhost:3001/news     and     http://localhost:3001/sports
// Events, rooms and connections in one namespace never mix with another one.
// (Every lesson so far used one without you noticing: /lesson1, /lesson2, ...)
// Think of it as one controller prefix per feature, like @Controller('news').
//
// Both gateways below do the same thing: publish a 'headline' to everyone in THEIR namespace.
//
// Web side of this lesson: web/src/app/lessons/09-namespaces/page.tsx
@WebSocketGateway({
  namespace: 'news',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson9NewsGateway {
  @WebSocketServer()
  server: Namespace;

  @SubscribeMessage('headline')
  onHeadline(@MessageBody() body: { text: string }) {
    this.server.emit('headline', { text: body.text });
  }
}

@WebSocketGateway({
  namespace: 'sports',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson9SportsGateway {
  @WebSocketServer()
  server: Namespace;

  @SubscribeMessage('headline')
  onHeadline(@MessageBody() body: { text: string }) {
    this.server.emit('headline', { text: body.text });
  }
}
