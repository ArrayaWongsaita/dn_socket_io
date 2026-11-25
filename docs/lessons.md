# Lesson guide

Do the lessons in order. For each one: read the header comment of the files, follow the numbered `TODO(N.k)` steps (on `main`), then try it in two or three browser tabs and compare with "You should see". Page: `http://localhost:3000/lessons/<folder>`; files: `api/src/lessons/<NN>-<name>.gateway.ts` and `web/src/app/lessons/<NN>-<name>/page.tsx`.

## Before you start: how the two sides talk

```
browser (socket.io-client)  <---- one open connection ---->  NestJS gateway (socket.io)
   socket.emit('event', data)  ------------------------->  @SubscribeMessage('event')
   socket.on('event', fn)      <-------------------------  client.emit / server.emit(...)
```

A **gateway** in Nest is like a controller, but it handles events instead of URLs. Every lesson has its own **namespace** (`/lesson1`, `/lesson2`, ...), so lessons never disturb each other. Lesson 9 explains what that is.

## Stage A: Connect

1. **Connect** (`01-connect`). TODO 1.1 `io(url)`, 1.2 `socket.on("connect")`, 1.3 log in `handleConnection`. You should see: status "connected", a socket id, and the same id in the API terminal.
2. **Disconnect** (`02-disconnect`). TODO 2.1 `socket.on("disconnect", reason)`, 2.2 `socket.disconnect()`, 2.3 log in `handleDisconnect`. Try: press Disconnect (`io client disconnect`), then stop the API (`transport close`).

## Stage B: Send messages

3. **Client to server** (`03-send-to-server`). TODO 3.1 `socket.emit('note:send', { text })`, 3.2 `@SubscribeMessage('note:send')`. You should see your text in the API terminal.
4. **Server to client** (`04-send-to-client`). TODO 4.1 `client.emit('welcome')` on connect, 4.2 answer `hello` with `hello:reply`, 4.3 and 4.4 `socket.on` for both.
5. **Acknowledgement** (`05-acknowledgement`). TODO 5.1 return `{ ok, result }` from the handler, 5.2 `await socket.emitWithAck(...)`. Try a letter instead of a number.

## Stage C: Send to many (open 3 tabs)

6. **Everyone** (`06-everyone`). TODO 6.1 emit, 6.2 `socket.on('shout')`, 6.3 `server.emit`. All three tabs receive, the sender too.
7. **Everyone except me** (`07-everyone-else`). TODO 7.1 `client.broadcast.emit`, 7.2 `socket.on('received')`. Compare the two buttons.

## Stage D: Groups

8. **Rooms** (`08-rooms`). TODO 8.1 `client.join`, 8.2 `client.leave`, 8.3 `server.to(room).emit`. Two tabs in `red`, one in `blue`: `blue` never hears `red`.
9. **Namespaces** (`09-namespaces`). TODO 9.1 and 9.2 add `namespace: 'news'` and `'sports'`. Before you do, the page shows `Invalid namespace`; after, a headline in `/news` never reaches `/sports`.

## Stage E: The chat (needs Docker, see README)

10. **Who is connected** (`10-auth`). TODO 10.1 `server.use(...)`, 10.2-10.4 the handshake check in `api/src/socket/auth.middleware.ts`, 10.5 read the name from `client.data.user`, 10.6 `auth: { userId }`, 10.7 `connect_error`. Try "Connect as a user that does not exist".
11. **Chat rooms with history** (`/chat`). TODO 11.1 `room:join`, 11.2 `room:leave`, 11.3 `message:send` (checks, save with Prisma, `server.to(room).emit`), 11.4 join then load history from `GET /rooms/:id/messages`, 11.5 listen to `message:new` and send. Try: write in General, go to Random, come back: your messages are still there.
12. **Members and clean-up** (`/chat`, same files). TODO 12.1 `sendMemberList`, 12.2 call it on join/leave, 12.3 `disconnecting`, 12.4 `room:members` listener, 12.5 rejoin after reconnect. Try: close a tab and watch the member list change; restart the API and see the chat come back by itself.
