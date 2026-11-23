import type { Socket } from 'socket.io-client';
import { startApp, connectAs, collect, sleep } from './helpers.js';

// Page 2: every way of sending an event. Users: 1 Alice, 2 Bob, 3 Carol.
// Alice has TWO tabs (alice1, alice2) to prove "send to a user" reaches every tab.
describe('/broadcast namespace', () => {
  let server: Awaited<ReturnType<typeof startApp>>;
  let alice1: Socket, alice2: Socket, bob: Socket, carol: Socket;
  let got: Record<string, any[]>;

  beforeAll(async () => {
    server = await startApp();
  });
  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    alice1 = await connectAs(server.url, '/broadcast', 1);
    alice2 = await connectAs(server.url, '/broadcast', 1);
    bob = await connectAs(server.url, '/broadcast', 2);
    carol = await connectAs(server.url, '/broadcast', 3);
    got = {
      alice1: collect(alice1, 'received'),
      alice2: collect(alice2, 'received'),
      bob: collect(bob, 'received'),
      carol: collect(carol, 'received'),
    };
  });
  afterEach(() => {
    [alice1, alice2, bob, carol].forEach((s) => s.close());
  });

  // Returns the names of the sockets that received at least one event.
  const receivers = () => Object.keys(got).filter((k) => got[k].length > 0).sort();

  it('send:self reaches only the sender', async () => {
    alice1.emit('send:self', { text: 'hi' });
    await sleep(200);
    expect(receivers()).toEqual(['alice1']);
    expect(got.alice1[0]).toEqual({ pattern: 'self', from: 'Alice', text: 'hi' });
  });

  it('send:all reaches everyone including the sender', async () => {
    bob.emit('send:all', { text: 'hello all' });
    await sleep(200);
    expect(receivers()).toEqual(['alice1', 'alice2', 'bob', 'carol']);
    expect(got.carol[0]).toEqual({ pattern: 'all', from: 'Bob', text: 'hello all' });
  });

  it('send:others reaches everyone except the sending socket', async () => {
    alice1.emit('send:others', { text: 'psst' });
    await sleep(200);
    expect(receivers()).toEqual(['alice2', 'bob', 'carol']);
  });

  it('send:user reaches every tab of that user and reports delivered count', async () => {
    const ack = await bob.emitWithAck('send:user', { text: 'to alice', toUserId: 1 });
    expect(ack).toEqual({ delivered: 2 });
    await sleep(200);
    expect(receivers()).toEqual(['alice1', 'alice2']);
    expect(got.alice1[0]).toEqual({ pattern: 'user', from: 'Bob', text: 'to alice' });
  });

  it('send:user to a user who does not exist delivers to nobody', async () => {
    const ack = await bob.emitWithAck('send:user', { text: 'x', toUserId: 999 });
    expect(ack).toEqual({ delivered: 0 });
    await sleep(200);
    expect(receivers()).toEqual([]);
  });

  it('send:user to a user who is not online delivers to nobody', async () => {
    const ack = await bob.emitWithAck('send:user', { text: 'x', toUserId: 4 });
    expect(ack).toEqual({ delivered: 0 });
  });

  it('send:users reaches every tab of several users, not the others', async () => {
    const ack = await carol.emitWithAck('send:users', { text: 'team', toUserIds: [1, 2] });
    expect(ack).toEqual({ delivered: 3 });
    await sleep(200);
    expect(receivers()).toEqual(['alice1', 'alice2', 'bob']);
    expect(got.bob[0].pattern).toBe('users');
  });

  it('send:ack replies only to the sender, with an echo, and broadcasts nothing', async () => {
    const ack = await alice1.emitWithAck('send:ack', { text: 'echo me' });
    expect(ack.ok).toBe(true);
    expect(ack.echo).toBe('echo me');
    expect(typeof ack.serverTime).toBe('string');
    await sleep(200);
    expect(receivers()).toEqual([]);
  });
});
