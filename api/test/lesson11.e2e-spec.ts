import request from 'supertest';
import type { Socket } from 'socket.io-client';
import { startApp, connectAs, collect, sleep } from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Lesson 11: join a room, talk in it, and read the history after coming back.
// Users: 1 Alice, 2 Bob, 3 Carol. Rooms: 1 General, 2 Random, 3 Tech. Needs the seeded database.
describe('lesson 11: chat rooms with history', () => {
  let server: Awaited<ReturnType<typeof startApp>>;
  let prisma: PrismaService;
  const open: Socket[] = [];

  const connect = async (userId: number) => {
    const s = await connectAs(server.url, '/chat', userId);
    open.push(s);
    return s;
  };

  beforeAll(async () => {
    server = await startApp();
    prisma = server.app.get(PrismaService);
  });
  beforeEach(async () => {
    await prisma.message.deleteMany();
  });
  afterEach(() => {
    open.splice(0).forEach((s) => s.close());
  });
  afterAll(async () => {
    await server.close();
  });

  it('join: an existing room is acknowledged, an unknown room is refused', async () => {
    const alice = await connect(1);
    expect(await alice.emitWithAck('room:join', { roomId: 1 })).toEqual({ ok: true });
    const ack = await alice.emitWithAck('room:join', { roomId: 999 });
    expect(ack.ok).toBe(false);
  });

  it('a message reaches the room only, and is saved and served by REST', async () => {
    const alice = await connect(1);
    const bob = await connect(2);
    const carol = await connect(3);
    await alice.emitWithAck('room:join', { roomId: 1 });
    await bob.emitWithAck('room:join', { roomId: 1 });
    await carol.emitWithAck('room:join', { roomId: 2 });
    const bobGot = collect(bob, 'message:new');
    const carolGot = collect(carol, 'message:new');

    expect(await alice.emitWithAck('message:send', { roomId: 1, text: 'hello room' })).toEqual({ ok: true });
    await sleep(200);

    expect(bobGot).toHaveLength(1);
    expect(bobGot[0]).toMatchObject({ text: 'hello room', roomId: 1, user: { id: 1, name: 'Alice' } });
    expect(carolGot).toHaveLength(0);

    const res = await request(server.url).get('/rooms/1/messages').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ text: 'hello room', user: { id: 1, name: 'Alice' } });
  });


  it('sending to a room you have not joined is refused: nothing saved or delivered', async () => {
    const alice = await connect(1);
    const bob = await connect(2);
    await bob.emitWithAck('room:join', { roomId: 1 });
    const bobGot = collect(bob, 'message:new');

    const ack = await alice.emitWithAck('message:send', { roomId: 1, text: 'sneaky' });
    await sleep(200);
    expect(ack.ok).toBe(false);
    expect(bobGot).toHaveLength(0);
    expect(await prisma.message.count()).toBe(0);
  });


  it('blank text is refused and not saved', async () => {
    const alice = await connect(1);
    await alice.emitWithAck('room:join', { roomId: 1 });
    const ack = await alice.emitWithAck('message:send', { roomId: 1, text: '   ' });
    expect(ack.ok).toBe(false);
    expect(await prisma.message.count()).toBe(0);
  });


  it('REST history for an unknown room is 404', async () => {
    await request(server.url).get('/rooms/999/messages').expect(404);
  });


  it('history: after leaving and coming back, the earlier messages are still served', async () => {
    const alice = await connect(1);
    await alice.emitWithAck('room:join', { roomId: 1 });
    await alice.emitWithAck('message:send', { roomId: 1, text: 'first' });
    await alice.emitWithAck('message:send', { roomId: 1, text: 'second' });
    expect(await alice.emitWithAck('room:leave', { roomId: 1 })).toEqual({ ok: true });
    await alice.emitWithAck('room:join', { roomId: 1 });
    const res = await request(server.url).get('/rooms/1/messages').expect(200);
    expect(res.body.map((m: { text: string }) => m.text)).toEqual(['first', 'second']);
  });

  it('history: someone who joins later can read what was said before', async () => {
    const alice = await connect(1);
    await alice.emitWithAck('room:join', { roomId: 1 });
    await alice.emitWithAck('message:send', { roomId: 1, text: 'before bob' });
    const bob = await connect(2);
    await bob.emitWithAck('room:join', { roomId: 1 });
    const res = await request(server.url).get('/rooms/1/messages').expect(200);
    expect(res.body[0]).toMatchObject({ text: 'before bob', user: { name: 'Alice' } });
  });
});
