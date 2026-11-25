import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

// LESSON 5: ACKNOWLEDGEMENT
//
// An "acknowledgement" is the server's answer to ONE specific question.
// Think of it like a REST response:
//   browser:  const reply = await socket.emitWithAck('math:add', { a: 2, b: 3 })
//   server:   whatever the handler RETURNS is sent back as that reply.
// Nothing else is sent: no other browser sees it, and no separate event is needed.
//
// Web side of this lesson: web/src/app/lessons/05-acknowledgement/page.tsx
@WebSocketGateway({
  namespace: 'lesson5',
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' },
})
export class Lesson5Gateway {
  @SubscribeMessage('math:add')
  onAdd(@MessageBody() body?: { a: unknown; b: unknown }) {
    // Never trust what a browser sends: check it, and answer with an error when it is wrong.
    if (typeof body?.a !== 'number' || typeof body?.b !== 'number') {
      return { ok: false, error: 'a and b must be numbers' };
    }
    return { ok: true, result: body.a + body.b };
  }
}
