import { Logger } from '@nestjs/common';
import type { Socket } from 'socket.io-client';
import { startApp, connectTo } from './helpers.js';

// Lesson 1: a browser connects to /lesson1 and the server notices.
describe('lesson 1: connect', () => {
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

  it('logs "connected: <socket id>" on the server when a client connects', async () => {
    const log = vi.spyOn(Logger.prototype, 'log');
    const socket = await connectTo(server.url, '/lesson1');
    sockets.push(socket);
    await vi.waitFor(() => {
      expect(log.mock.calls.some(([message]) => String(message) === `connected: ${socket.id}`)).toBe(true);
    });
  });

  it('needs no login: connecting without any auth works', async () => {
    const socket = await connectTo(server.url, '/lesson1');
    sockets.push(socket);
    expect(socket.connected).toBe(true);
  });
});
