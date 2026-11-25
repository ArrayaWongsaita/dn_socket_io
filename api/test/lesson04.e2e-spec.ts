import type { Socket } from 'socket.io-client';
import { startApp, connectTo, collect, waitFor, sleep } from './helpers.js';

// Lesson 4: the server sends events to the browser (first, and as an answer).
describe('lesson 4: server to client', () => {
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

  it('sends "welcome" with the socket id as soon as a client connects', async () => {
    let welcome: { message: string }[] = [];
    const socket = await connectTo(server.url, '/lesson4', (s) => {
      welcome = collect<{ message: string }>(s, 'welcome');
    });
    sockets.push(socket);
    await vi.waitFor(() => expect(welcome).toHaveLength(1));
    expect(welcome[0].message).toBe(`Welcome! Your socket id is ${socket.id}`);
  });

  it('answers "hello" with "hello:reply" to the sender only', async () => {
    const a = await connectTo(server.url, '/lesson4');
    const b = await connectTo(server.url, '/lesson4');
    sockets.push(a, b);
    const bReplies = collect(b, 'hello:reply');
    const reply = waitFor<{ message: string }>(a, 'hello:reply');
    a.emit('hello', { name: 'Ann' });
    expect(await reply).toEqual({ message: 'Hello, Ann!' });
    await sleep(200);
    expect(bReplies).toHaveLength(0);
  });
});
