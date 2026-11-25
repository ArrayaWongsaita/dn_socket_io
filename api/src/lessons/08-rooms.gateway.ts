import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

// LESSON 8: ROOMS
//
// A ROOM is a named group of sockets. Socket.IO does the bookkeeping for us:
//   client.join('red')            put this socket in the group
//   client.leave('red')           take it out
//   server.to('red').emit(...)    send an event to everybody in the group
// Sockets also leave their rooms automatically when they disconnect.
// Every socket is also alone in a room named after its own id (that is how client.emit works).
//
// Web side of this lesson: web/src/app/lessons/08-rooms/page.tsx (already written for you)
@WebSocketGateway({
  namespace: 'lesson8',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson8Gateway {
  @WebSocketServer()
  server: Namespace;

  @SubscribeMessage('room:join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { room: string }) {
    await client.join(body.room); // join() returns a promise: await it
    return { ok: true, rooms: [...client.rooms] }; // the rooms this socket is in now
  }

  @SubscribeMessage('room:leave')
  async onLeave(@ConnectedSocket() client: Socket, @MessageBody() body: { room: string }) {
    await client.leave(body.room);
    return { ok: true };
  }

  @SubscribeMessage('room:say')
  onSay(@MessageBody() body: { room: string; from: string; text: string }) {
    // Only the sockets inside body.room receive this.
    this.server.to(body.room).emit('room:message', { room: body.room, from: body.from, text: body.text });
  }
}
