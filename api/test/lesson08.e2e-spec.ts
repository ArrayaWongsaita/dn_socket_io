import type { Socket } from 'socket.io-client';
import { startApp, connectTo, waitFor, collect, sleep } from './helpers.js';

type RoomMessage = { room: string; from: string; text: string };

// Lesson 8: rooms are named groups; server.to(room).emit reaches only that group.
describe('lesson 8: rooms', () => {
  let server: Awaited<ReturnType<typeof startApp>>;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    server = await startApp();
  });
  afterEach(() => {
    sockets.splice(0).forEach((s) => s.close());
  });
  afterAll(async () => {
    await server.close();
  });

  async function connect(n: number) {
    const list: Socket[] = [];
    for (let i = 0; i < n; i++) list.push(await connectTo(server.url, '/lesson8'));
    sockets.push(...list);
    return list;
  }

  it('room:join acknowledges with the rooms the socket is in (its own id room included)', async () => {
    const [a] = await connect(1);
    const reply = await a.emitWithAck('room:join', { room: 'red' });
    expect(reply.ok).toBe(true);
    expect(reply.rooms).toEqual(expect.arrayContaining(['red', a.id]));
  });

  it('a message to "red" reaches only the sockets in red', async () => {
    const [a, b, c] = await connect(3);
    await a.emitWithAck('room:join', { room: 'red' });
    await b.emitWithAck('room:join', { room: 'blue' });
    await c.emitWithAck('room:join', { room: 'red' });
    const bGot = collect<RoomMessage>(b, 'room:message');
    const redGot = [a, c].map((s) => waitFor<RoomMessage>(s, 'room:message'));
    a.emit('room:say', { room: 'red', from: 'A', text: 'hi red' });
    for (const payload of await Promise.all(redGot)) {
      expect(payload).toEqual({ room: 'red', from: 'A', text: 'hi red' });
    }
    await sleep(300);
    expect(bGot).toHaveLength(0);
  });

  it('after room:leave the socket no longer receives that room', async () => {
    const [a, c] = await connect(2);
    await a.emitWithAck('room:join', { room: 'red' });
    await c.emitWithAck('room:join', { room: 'red' });
    expect(await c.emitWithAck('room:leave', { room: 'red' })).toEqual({ ok: true });
    const cGot = collect<RoomMessage>(c, 'room:message');
    const aGot = waitFor<RoomMessage>(a, 'room:message');
    a.emit('room:say', { room: 'red', from: 'A', text: 'again' });
    await aGot;
    await sleep(300);
    expect(cGot).toHaveLength(0);
  });
});
