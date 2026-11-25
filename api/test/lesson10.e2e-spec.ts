import type { Socket } from 'socket.io-client';
import { startApp, connectAs, waitFor } from './helpers.js';

// Lesson 10: the handshake tells the server WHO is connecting. Needs the seeded database (Alice=1, Bob=2).
describe('lesson 10: who is connected (handshake auth)', () => {
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

  it('connects with the id of a seeded user', async () => {
    const socket = await connectAs(server.url, '/auth', 1);
    sockets.push(socket);
    expect(socket.connected).toBe(true);
  });

  it('refuses a handshake with no userId', async () => {
    await expect(connectAs(server.url, '/auth')).rejects.toThrow('userId missing');
  });

  it('refuses a handshake with a non-numeric userId', async () => {
    await expect(connectAs(server.url, '/auth', 'abc')).rejects.toThrow('userId missing');
  });

  it('refuses a handshake with an unknown userId', async () => {
    await expect(connectAs(server.url, '/auth', 9999)).rejects.toThrow('user not found');
  });

  it('refuses a userId too big for the database instead of crashing the server', async () => {
    await expect(connectAs(server.url, '/auth', 3_000_000_000)).rejects.toThrow('user not found');
    const socket = await connectAs(server.url, '/auth', 1); // the server is still alive
    sockets.push(socket);
    expect(socket.connected).toBe(true);
  });

  it('message:new carries the name from the handshake, even if the client claims to be someone else', async () => {
    const alice = await connectAs(server.url, '/auth', 1);
    const bob = await connectAs(server.url, '/auth', 2);
    sockets.push(alice, bob);
    const aliceGot = waitFor(alice, 'message:new');
    const bobGot = waitFor(bob, 'message:new');
    alice.emit('message:send', { text: 'hi', from: 'Mallory' });
    expect(await aliceGot).toEqual({ text: 'hi', from: 'Alice' });
    expect(await bobGot).toEqual({ text: 'hi', from: 'Alice' });
  });
});
