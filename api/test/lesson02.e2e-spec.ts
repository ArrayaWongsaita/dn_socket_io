import { Logger } from '@nestjs/common';
import type { Socket } from 'socket.io-client';
import { startApp, connectTo } from './helpers.js';

// Lesson 2: the server notices when a client goes away.
describe('lesson 2: disconnect', () => {
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

  it('logs "disconnected: <socket id>" when the client disconnects', async () => {
    const log = vi.spyOn(Logger.prototype, 'log');
    const socket = await connectTo(server.url, '/lesson2');
    sockets.push(socket);
    const id = socket.id;
    socket.disconnect();
    await vi.waitFor(() => {
      expect(log.mock.calls.some(([message]) => String(message) === `disconnected: ${id}`)).toBe(true);
    });
  });

  it('a client can connect again after disconnecting and gets a new socket id', async () => {
    const socket = await connectTo(server.url, '/lesson2');
    sockets.push(socket);
    const firstId = socket.id;
    socket.disconnect();
    await new Promise<void>((resolve) => {
      socket.once('connect', () => resolve());
      socket.connect();
    });
    expect(socket.connected).toBe(true);
    expect(socket.id).not.toBe(firstId);
  });
});
