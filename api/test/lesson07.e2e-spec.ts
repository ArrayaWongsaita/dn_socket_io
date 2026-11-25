import type { Socket } from 'socket.io-client';
import { startApp, connectTo, waitFor, collect, sleep } from './helpers.js';

type Received = { pattern: 'all' | 'others'; from: string; text: string };

// Lesson 7: client.broadcast.emit reaches everyone EXCEPT the sender.
describe('lesson 7: everyone except me', () => {
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

  async function three() {
    const a = await connectTo(server.url, '/lesson7');
    const b = await connectTo(server.url, '/lesson7');
    const c = await connectTo(server.url, '/lesson7');
    sockets.push(a, b, c);
    return { a, b, c };
  }

  it('send:all reaches the sender and the others (pattern "all")', async () => {
    const { a, b, c } = await three();
    const got = [a, b, c].map((s) => waitFor<Received>(s, 'received'));
    a.emit('send:all', { from: 'A', text: 'hi' });
    for (const payload of await Promise.all(got)) {
      expect(payload).toEqual({ pattern: 'all', from: 'A', text: 'hi' });
    }
  });

  it('send:others reaches the others but NOT the sender (pattern "others")', async () => {
    const { a, b, c } = await three();
    const senderGot = collect<Received>(a, 'received');
    const got = [b, c].map((s) => waitFor<Received>(s, 'received'));
    a.emit('send:others', { from: 'A', text: 'psst' });
    for (const payload of await Promise.all(got)) {
      expect(payload).toEqual({ pattern: 'others', from: 'A', text: 'psst' });
    }
    await sleep(300);
    expect(senderGot).toHaveLength(0);
  });
});
