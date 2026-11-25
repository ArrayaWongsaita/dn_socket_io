import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';

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

  // For all three handlers: add a method with @SubscribeMessage('<event>'),
  // @ConnectedSocket() client: Socket  and  @MessageBody() body.  (Lesson 3 showed you how.)
  // Rooms are plain strings, for example 'red' or 'blue'.

  // TODO(8.1): 'room:join' { room }  -> put this socket in the room.
  //   - hint: await client.join(body.room)   (join returns a promise, so make the method async)
  //   - RETURN { ok: true, rooms: [...client.rooms] }  (the rooms this socket is in now: the page shows them)

  // TODO(8.2): 'room:leave' { room }  -> take this socket out of the room.
  //   - hint: await client.leave(body.room)     - RETURN { ok: true }

  // TODO(8.3): 'room:say' { room, from, text }  -> send to everybody in that room, and ONLY them.
  //   - hint: this.server.to(body.room).emit('room:message', { room: body.room, from: body.from, text: body.text })
}
