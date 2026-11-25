import type { Socket } from 'socket.io-client';
import { startApp, connectTo, waitFor } from './helpers.js';

// Lesson 6: server.emit reaches every connected socket, the sender included.
describe('lesson 6: everyone', () => {
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

  it('delivers a shout to all three sockets, the sender included', async () => {
    const a = await connectTo(server.url, '/lesson6');
    const b = await connectTo(server.url, '/lesson6');
    const c = await connectTo(server.url, '/lesson6');
    sockets.push(a, b, c);
    const received = [a, b, c].map((s) => waitFor<{ from: string; text: string }>(s, 'shout'));
    a.emit('shout', { from: 'A', text: 'hi' });
    for (const payload of await Promise.all(received)) {
      expect(payload).toEqual({ from: 'A', text: 'hi' });
    }
  });

  it('does not deliver to a socket in another namespace', async () => {
    const a = await connectTo(server.url, '/lesson6');
    const other = await connectTo(server.url, '/lesson5');
    sockets.push(a, other);
    const got: unknown[] = [];
    other.on('shout', (d) => got.push(d));
    const own = waitFor(a, 'shout');
    a.emit('shout', { from: 'A', text: 'hi' });
    await own;
    await new Promise((r) => setTimeout(r, 200));
    expect(got).toHaveLength(0);
  });
});
