import type { Socket } from 'socket.io-client';
import { startApp, connectTo } from './helpers.js';

// Lesson 5: the server's return value comes back to the sender as an acknowledgement.
describe('lesson 5: acknowledgement', () => {
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

  it('answers math:add with the sum', async () => {
    const socket = await connectTo(server.url, '/lesson5');
    sockets.push(socket);
    expect(await socket.emitWithAck('math:add', { a: 2, b: 3 })).toEqual({ ok: true, result: 5 });
  });

  it('answers with an error when a or b is not a number', async () => {
    const socket = await connectTo(server.url, '/lesson5');
    sockets.push(socket);
    expect(await socket.emitWithAck('math:add', { a: 'x', b: 1 })).toEqual({
      ok: false,
      error: 'a and b must be numbers',
    });
  });

  it('still answers after an emit with no body at all', async () => {
    const socket = await connectTo(server.url, '/lesson5');
    sockets.push(socket);
    expect(await socket.emitWithAck('math:add')).toEqual({ ok: false, error: 'a and b must be numbers' });
    expect(await socket.emitWithAck('math:add', { a: 1, b: 1 })).toEqual({ ok: true, result: 2 });
  });
});
