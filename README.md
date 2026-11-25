# Socket.IO, one command at a time: Next.js + NestJS

A hands-on course for people who already write **Next.js, NestJS and TypeScript** but have never used sockets.
You do not read about Socket.IO: you write one or two commands, then **see the result right away** in the browser and in the API terminal.
It ends with a real chat: rooms, live messages, and the old messages when you come back.

## The 12 lessons

| Stage | # | You learn | New commands | You see |
| --- | --- | --- | --- | --- |
| A. Connect | 1 | Connect | `io()`, `connect` event, `handleConnection` | "connected" + your socket id |
| | 2 | Disconnect | `disconnect` event, `handleDisconnect` | why the connection ended |
| B. Send messages | 3 | Client to server | `socket.emit`, `@SubscribeMessage` | your text in the API terminal |
| | 4 | Server to client | `client.emit`, `socket.on` | the server's welcome and reply |
| | 5 | Acknowledgement | return a value, `emitWithAck` | the answer to one question |
| C. Send to many | 6 | Everyone | `server.emit` | 3 tabs all receive |
| | 7 | Everyone except me | `client.broadcast.emit` | everyone but the sender receives |
| D. Groups | 8 | Rooms | `client.join`, `client.leave`, `server.to(room).emit` | two rooms never mix |
| | 9 | Namespaces | the `namespace` option | separate channels on one server |
| E. Chat | 10 | Who is connected | handshake `auth`, `server.use`, `socket.data` | unknown users are refused |
| | 11 | Chat rooms with history | rooms + Prisma + REST history | leave, come back, old messages are there |
| | 12 | Members and clean-up | `fetchSockets`, `disconnecting`, rejoin | who is in the room, live |

Every lesson page has an **event log** (black panel): `→` what this tab sent, `←` what it received, `•` connection events.
A one-page summary of all commands is in [docs/cheatsheet.md](docs/cheatsheet.md); a short guide per lesson is in [docs/lessons.md](docs/lessons.md).

## How to work on this branch (`main`)

1. Do the lessons in order. Search the project for `TODO(1.` to find every step of lesson 1, then `TODO(2.`, and so on.
2. Each TODO says what to write and gives a hint (the Socket.IO method to use). Steps with the same number belong together: for example `TODO(4.1)` to `TODO(4.4)` are the server and web halves of lesson 4.
3. Everything that is not the lesson's idea is already written. Lessons 1-9 never touch the database, so a mistake in one lesson cannot break another.
4. Stuck? Compare with the `solution` branch: `git diff main solution -- <file>`.

## Two branches

- **`main`**: the exercise. Everything works except the Socket.IO code, which is replaced by `// TODO(N.k)` comments.
- **`solution`**: the finished code with comments, and one test file per lesson.

## Setup

Requirements: Node.js 22.12+ (or 24) and pnpm 10+. **Docker is only needed from lesson 10.**

```bash
# API  (http://localhost:3001)
cd api
cp .env.example .env
pnpm install
pnpm start:dev

# Web  (http://localhost:3000)   -- in a second terminal
cd web
pnpm install
pnpm dev
```

Open <http://localhost:3000> and start with lesson 1. Open **two or three browser tabs** for the lessons: each tab is a different client (lessons 1-9 give every tab a nickname).

### Before lesson 10: the database

```bash
docker compose up -d                 # Postgres on port 5434
cd api
pnpm prisma migrate deploy           # create the tables
pnpm db:seed                         # users Alice, Bob, Carol, Dave and rooms General, Random, Tech
```

## Tests (solution branch)

```bash
cd api && pnpm test:e2e   # real socket.io clients against the real server, one file per lesson
```

Lessons 1-9 pass without Docker; lessons 10-12 need the database from the step above.
