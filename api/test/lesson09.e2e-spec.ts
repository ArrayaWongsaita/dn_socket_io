import type { Socket } from 'socket.io-client';
import { startApp, connectTo, waitFor, collect, sleep } from './helpers.js';

// Lesson 9: a namespace is a separate channel on the same server.
describe('lesson 9: namespaces', () => {
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

  it('a headline published on /news reaches /news and not /sports', async () => {
    const news = await connectTo(server.url, '/news');
    const sports = await connectTo(server.url, '/sports');
    sockets.push(news, sports);
    const sportsGot = collect(sports, 'headline');
    const newsGot = waitFor(news, 'headline');
    news.emit('headline', { text: 'Election day' });
    expect(await newsGot).toEqual({ text: 'Election day' });
    await sleep(300);
    expect(sportsGot).toHaveLength(0);
  });

  it('a headline published on /sports reaches /sports and not /news', async () => {
    const news = await connectTo(server.url, '/news');
    const sports = await connectTo(server.url, '/sports');
    sockets.push(news, sports);
    const newsGot = collect(news, 'headline');
    const sportsGot = waitFor(sports, 'headline');
    sports.emit('headline', { text: 'Final tonight' });
    expect(await sportsGot).toEqual({ text: 'Final tonight' });
    await sleep(300);
    expect(newsGot).toHaveLength(0);
  });

  it('connecting to a namespace nobody created is refused with "Invalid namespace"', async () => {
    await expect(connectTo(server.url, '/nope')).rejects.toThrow('Invalid namespace');
  });
});
