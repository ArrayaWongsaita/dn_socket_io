import type { Socket } from 'socket.io-client';
import { startApp, connectAs, collect, waitFor, sleep } from './helpers.js';

// Lesson 12: everybody in a room sees who is inside, also when people leave or close tabs.
// Users: 1 Alice, 2 Bob, 3 Carol. Rooms: 1 General. Needs the seeded database.
describe('lesson 12: members and clean-up', () => {
  let server: Awaited<ReturnType<typeof startApp>>;
  const open: Socket[] = [];

  const connect = async (userId: number) => {
    const s = await connectAs(server.url, '/chat', userId);
    open.push(s);
    return s;
  };
  const namesIn = (payload: { members: { name: string }[] }) => payload.members.map((m) => m.name).sort();

  beforeAll(async () => {
    server = await startApp();
  });
  afterEach(() => {
    open.splice(0).forEach((s) => s.close());
  });
  afterAll(async () => {
    await server.close();
  });

  it('join: the joiner gets ok and everyone in the room sees the new member list', async () => {
    const alice = await connect(1);
    const bob = await connect(2);
    expect(await alice.emitWithAck('room:join', { roomId: 1 })).toEqual({ ok: true });

    const aliceSees = waitFor(alice, 'room:members');
    expect(await bob.emitWithAck('room:join', { roomId: 1 })).toEqual({ ok: true });
    const update = await aliceSees;
    expect(update.roomId).toBe(1);
    expect(namesIn(update)).toEqual(['Alice', 'Bob']);
  });


  it('leaving updates the member list for those who stay', async () => {
    const alice = await connect(1);
    const bob = await connect(2);
    await alice.emitWithAck('room:join', { roomId: 1 });
    await bob.emitWithAck('room:join', { roomId: 1 });

    const aliceSees = waitFor(alice, 'room:members');
    await bob.emitWithAck('room:leave', { roomId: 1 });
    expect(namesIn(await aliceSees)).toEqual(['Alice']);
  });


  it('disconnecting updates the member list for those who stay', async () => {
    const alice = await connect(1);
    const bob = await connect(2);
    await alice.emitWithAck('room:join', { roomId: 1 });
    await bob.emitWithAck('room:join', { roomId: 1 });

    const aliceSees = waitFor(alice, 'room:members');
    bob.disconnect();
    expect(namesIn(await aliceSees)).toEqual(['Alice']);
  });


  it('a user with two tabs appears once, and stays until the last tab leaves', async () => {
    const watcher = await connect(2);
    const tab1 = await connect(1);
    const tab2 = await connect(1);
    await watcher.emitWithAck('room:join', { roomId: 1 });
    await tab1.emitWithAck('room:join', { roomId: 1 });

    const seen = collect(watcher, 'room:members');
    await tab2.emitWithAck('room:join', { roomId: 1 });
    await sleep(200);
    expect(namesIn(seen.at(-1))).toEqual(['Alice', 'Bob']);

    tab1.disconnect();
    await sleep(200);
    expect(namesIn(seen.at(-1))).toEqual(['Alice', 'Bob']); // tab2 still there

    tab2.disconnect();
    await sleep(200);
    expect(namesIn(seen.at(-1))).toEqual(['Bob']);
  });

});
