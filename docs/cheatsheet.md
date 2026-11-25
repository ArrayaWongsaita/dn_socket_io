# Socket.IO cheatsheet

## Who receives what? (lessons 3-8)

| You write (server) | Who receives | Lesson |
| --- | --- | --- |
| `client.emit('x', data)` | only the sender | 4 |
| `server.emit('x', data)` | everyone in the namespace, sender included | 6 |
| `client.broadcast.emit('x', data)` | everyone except the sender | 7 |
| `server.to('red').emit('x', data)` | everyone in room `red` | 8 |
| `return { ... }` from a handler | only the sender, as the answer (acknowledgement) | 5 |

## Browser (`socket.io-client`)

```ts
const socket = io("http://localhost:3001/lesson1");        // connect (a namespace is part of the address)
const socket = io(url, { auth: { userId } });              // say who you are in the handshake (lesson 10)
socket.on("connect", () => { socket.id });                 // connected
socket.on("disconnect", (reason) => {});                   // connection ended
socket.on("connect_error", (error) => { error.message });  // the server refused us
socket.emit("event", data);                                // send, no answer expected
const reply = await socket.emitWithAck("event", data);     // send and wait for the server's answer
socket.on("event", (data) => {});                          // listen
socket.disconnect(); socket.connect();
```

## Server (NestJS gateway)

```ts
@WebSocketGateway({ namespace: 'lesson3', cors: { origin: ... } })
export class MyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Namespace;                    // everyone in this namespace
  afterInit(server: Namespace) { server.use(middleware); } // runs once; middleware runs before every connection
  handleConnection(client: Socket) {}                      // someone connected
  handleDisconnect(client: Socket) {}                      // someone left
  @SubscribeMessage('event')                               // like @Post: run this when 'event' arrives
  onEvent(@ConnectedSocket() client: Socket, @MessageBody() body: T) { return { ok: true }; }
}
```

## Rooms, namespaces, handshake

- Room: `await client.join('red')`, `await client.leave('red')`, `client.rooms` (a `Set`, includes the socket's own id).
- Everyone in a room: `await server.in('red').fetchSockets()`.
- Namespace: `namespace: 'news'` on the gateway, `io(API_URL + '/news')` in the browser. Unknown namespace gives `Invalid namespace`.
- Handshake: browser `auth: { userId }` becomes `socket.handshake.auth.userId` on the server; a middleware calls `next(new Error('...'))` to refuse, or sets `socket.data.user` and calls `next()`.
- Just before a socket leaves: `client.on('disconnecting', () => { /* client.rooms is still filled */ })`.

## Reading the event log

`→ event {...}` sent by this tab · `← event {...}` received · `• connect / disconnect / connect_error` connection events.
