import { Logger } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';

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
  // You will use this logger in TODO(3.2).
  readonly logger = new Logger('Lesson3');

  // TODO(3.2): listen for the 'note:send' event and print what arrived in the API terminal.
  //   - add to the import from '@nestjs/websockets':  ConnectedSocket, MessageBody, SubscribeMessage
  //     and add  import type { Socket } from 'socket.io'
  //   - add a method decorated with  @SubscribeMessage('note:send')
  //   - its parameters:  @ConnectedSocket() client: Socket   and   @MessageBody() body: { text: string }
  //   - hint: this.logger.log(`note from ${client.id}: ${body.text}`)
}
