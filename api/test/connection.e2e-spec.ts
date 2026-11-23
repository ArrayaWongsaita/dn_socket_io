import type { Socket } from 'socket.io-client';
import { startApp, connectAs } from './helpers.js';

// Page 1: connecting, the handshake check, and one ping/pong round trip.
describe('/connection namespace', () => {
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

  it('connects with a seeded user id and gets a socket id', async () => {
    const socket = await connectAs(server.url, '/connection', 1);
    sockets.push(socket);
    expect(socket.connected).toBe(true);
    expect(typeof socket.id).toBe('string');
  });

  it('answers ping with pong, the user name and the socket id', async () => {
    const socket = await connectAs(server.url, '/connection', 2);
    sockets.push(socket);
    const reply = await socket.emitWithAck('ping');
    expect(reply).toEqual({ pong: true, user: 'Bob', socketId: socket.id });
  });

  it('refuses a handshake with no userId', async () => {
    await expect(connectAs(server.url, '/connection')).rejects.toThrow('userId missing');
  });

  it('refuses a handshake with a non-numeric userId', async () => {
    await expect(connectAs(server.url, '/connection', 'abc')).rejects.toThrow('userId missing');
  });

  it('refuses a handshake with an unknown userId', async () => {
    await expect(connectAs(server.url, '/connection', 9999)).rejects.toThrow('user not found');
  });

  it('can disconnect', async () => {
    const socket = await connectAs(server.url, '/connection', 1);
    socket.disconnect();
    expect(socket.connected).toBe(false);
  });
});
