# Socket.IO Basics: Next.js + NestJS

A hands-on course for learning **Socket.IO** if you already know Next.js and NestJS (REST).
You do not read about sockets, you use them: three small pages, each teaching one idea.

| Page | You learn | Server file | Web file |
| --- | --- | --- | --- |
| 0. Pick a user | (setup) choose who you are, no password | `api/src/users` | `web/src/app/page.tsx` |
| 1. Connection | connect / disconnect, socket id, `connect_error`, handshake `auth`, ack | `api/src/connection` | `web/src/app/connection/page.tsx` |
| 2. Broadcast | every way to send an event: me, everyone, everyone-but-me, one user, many users, reply | `api/src/broadcast` | `web/src/app/broadcast/page.tsx` |
| 3. Chat rooms | `join` / `leave`, sending to a room, saving messages | `api/src/chat` | `web/src/app/chat/page.tsx` |

Each page uses its own Socket.IO **namespace** (`/connection`, `/broadcast`, `/chat`).

## How to work on this branch (`main`)

1. Do the pages in order. Search the project for `TODO(1.` to find every step of page 1, then `TODO(2.` and `TODO(3.`.
2. Each TODO says what to write and gives a hint (the Socket.IO method to use). Steps with the same number belong together: for example `TODO(2.3)` is both the web button and the server handler.
3. **Step `TODO(1.1)` (`web/src/lib/socket.ts`) is needed by every page**, so pages 2 and 3 show an error until you have done it.
4. Until you finish `TODO(1.4)` the server refuses every connection (you will see `connect_error` in the Connection page).
5. Stuck? Compare with the `solution` branch: `git diff main solution -- <file>`.

## Two branches

- **`main`**: the exercise. Everything works except the Socket.IO code, which is replaced by `// TODO(step N)` comments that guide you.
- **`solution`**: the finished code with comments. Stuck? Look here. `git diff main solution` shows exactly what you are asked to write.

## Setup

Requirements: Node.js 22.12+ (or 24), pnpm 10+, Docker.

```bash
# 1. Database (Postgres on port 5434)
docker compose up -d

# 2. API  (http://localhost:3001)
cd api
cp .env.example .env            # settings (database address, ports)
pnpm install
pnpm prisma generate            # only if `pnpm install` did not already do it
pnpm prisma migrate deploy      # create the tables
pnpm db:seed                    # create users Alice, Bob, Carol, Dave and 3 rooms
pnpm start:dev

# 3. Web  (http://localhost:3000)   -- in a second terminal
cd web
pnpm install
pnpm dev
```

`api/.env` is read by the API. If it is missing, copy `api/.env.example` to `api/.env`.

## How to practise

Open <http://localhost:3000> in **two or three browser windows or tabs**, pick a different user in each (the choice is remembered per tab), and try the pages side by side.

See [docs/lessons.md](docs/lessons.md) for a step-by-step guide per page.

## Tests (solution branch)

```bash
cd api && pnpm test:e2e   # real socket.io clients against the real server
```
