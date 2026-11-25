import { Logger } from '@nestjs/common';
import type { Socket } from 'socket.io-client';
import { startApp, connectTo, sleep } from './helpers.js';

// Lesson 3: the browser sends an event to the server.
describe('lesson 3: client to server', () => {
  let server: Awaited<ReturnType<typeof startApp>>;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    server = await startApp();
  });
  afterEach(() => {
    sockets.splice(0).forEach((s) => s.close());
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await server.close();
  });

  it('logs the text of a "note:send" event on the server', async () => {
    const log = vi.spyOn(Logger.prototype, 'log');
    const socket = await connectTo(server.url, '/lesson3');
    sockets.push(socket);
    socket.emit('note:send', { text: 'hello' });
    await vi.waitFor(() => {
      expect(log.mock.calls.some(([message]) => String(message) === `note from ${socket.id}: hello`)).toBe(true);
    });
  });

  it('survives a "note:send" without a body: the same socket and new sockets still work', async () => {
    const socket = await connectTo(server.url, '/lesson3');
    sockets.push(socket);
    socket.emit('note:send');
    await sleep(200);
    expect(socket.connected).toBe(true);
    const other = await connectTo(server.url, '/lesson3');
    sockets.push(other);
    expect(other.connected).toBe(true);
  });
});
