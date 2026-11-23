# Lesson guide

Do the pages in order. For each page: read the header comment of the files, follow the numbered TODO steps (on `main`), then try it in two browser windows.

## Before you start: how the two sides talk

```
browser (socket.io-client)  <---- one open connection ---->  NestJS gateway (socket.io)
   socket.emit('event', data)  ------------------------->  @SubscribeMessage('event')
   socket.on('event', fn)      <-------------------------  client.emit / server.emit(...)
```

A **gateway** in Nest is like a controller, but it handles events instead of URLs.

## Page 1: Connection

Files: `api/src/connection/connection.gateway.ts`, `api/src/socket/auth.middleware.ts`, `web/src/lib/socket.ts`, `web/src/app/connection/page.tsx`.

1. (TODO 1.1) Web: create the socket with `io(url, { auth })` and call `socket.connect()`.
2. (TODO 1.2) Web: listen to `connect`, `disconnect`, `connect_error`.
3. (TODO 1.3) API: the gateway lives on `namespace: 'connection'`.
4. (TODO 1.4) API: the handshake middleware reads `socket.handshake.auth.userId` and refuses unknown users with `next(new Error(...))`.
5. (TODO 1.5) API: `@SubscribeMessage('ping')` returns a value, which is the acknowledgement.
6. (TODO 1.6) Web: `socket.emitWithAck('ping')`.

Try it: connect, ping, press Disconnect, then press "Connect as a user that does not exist".

## Page 2: Broadcast

Files: `api/src/broadcast/broadcast.gateway.ts`, `web/src/app/broadcast/page.tsx`. Steps: TODO 2.1 (web: connect and listen), 2.2 (server: namespace, handshake, personal room), 2.3 self, 2.4 all, 2.5 others, 2.6 one user, 2.7 several users, 2.8 reply.

| Who receives | Server code |
| --- | --- |
| only the sender | `client.emit(...)` |
| everyone, sender included | `server.emit(...)` |
| everyone except the sender | `client.broadcast.emit(...)` |
| one user (all their tabs) | `server.to('user:1').emit(...)` |
| several users | `server.to(['user:1', 'user:2']).emit(...)` |
| only the sender, as a reply | `return { ... }` from the handler (acknowledgement) |

"User rooms": on connect, every socket joins the room `user:<id>`. That is why one user with two tabs receives events for both.

Try it: open three windows (Alice, Bob, Carol) and press each button.

## Page 3: Chat rooms

Files: `api/src/chat/chat.gateway.ts`, `web/src/app/chat/page.tsx`. Steps: TODO 3.1 (web listeners), 3.2 (server namespace/handshake), 3.3 join, 3.4 leave, 3.5 send message, 3.6 member list and disconnect.

1. API: `client.join('room:1')` / `client.leave('room:1')`.
2. API: `server.to('room:1').emit('message:new', ...)` reaches only people in that room.
3. API: save each message with Prisma so history can be loaded with REST (`GET /rooms/:id/messages`).
4. Web: join the room, load history, listen for `message:new` and `room:members`.

Try it: two users in General, one in Random. Messages stay inside their room.
