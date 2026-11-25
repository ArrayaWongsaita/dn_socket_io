import { WebSocketGateway } from '@nestjs/websockets';

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
  // TODO(5.1): answer the 'math:add' event. Data from the browser:  { a, b }
  //   - add a method with  @SubscribeMessage('math:add')  and a  @MessageBody() body  parameter
  //   - RETURN { ok: true, result: a + b }   (the returned value is the acknowledgement)
  //   - if a or b is not a number, RETURN { ok: false, error: 'a and b must be numbers' } instead.
  //     Never trust what a browser sends! hint: typeof body?.a !== 'number'
  //     (The browser may even send no data at all, so body can be undefined.)
}
