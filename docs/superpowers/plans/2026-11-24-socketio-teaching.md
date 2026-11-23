# Socket.IO Teaching Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Socket.IO teaching app (3 namespaced pages + user picker) on a `solution` branch, then derive a starter `main` branch with Socket.IO code replaced by guided TODO comments.

**Architecture:** Nest 12 api (`api/`) with one module+gateway per page, each on its own Socket.IO namespace, sharing one auth-middleware helper; Prisma 7 + Postgres (docker). Next 16 web (`web/`) with one page per namespace and a tiny `createSocket` helper. All code is beginner-readable and heavily commented.

**Tech Stack:** NestJS 12 (ESM, vitest, pnpm), `@nestjs/websockets` + `@nestjs/platform-socket.io` 12.6, `socket.io` / `socket.io-client` 4.8.4, Prisma 7.10 + `@prisma/adapter-pg`, Next 16.4 / React 19 / Tailwind 4, Postgres via docker compose.

**Spec:** `docs/superpowers/specs/2026-11-24-socketio-teaching-design.md`

## Global Constraints

- Work on branch `solution`; `main` becomes the starter in the last task. Remote is `origin` = `dn_socket_io` (single repo, two branches).
- api on :3001, web on :3000, Postgres :5432 (docker compose at repo root). CORS allows `http://localhost:3000`.
- Namespaces exactly: `/connection`, `/broadcast`, `/chat`. Handshake auth: `auth: { userId: number }`.
- Seed: users Alice, Bob, Carol, Dave; rooms General, Random, Tech.
- Prisma 7: `prisma.config.ts`, driver adapter `@prisma/adapter-pg`.
- api is ESM: relative imports end in `.js`; tests use vitest (`vi.fn()`), not jest. Read `api/AGENTS.md`; read `web/node_modules/next/dist/docs/` before writing Next code (Next 16 differs from training data).
- Code style for all teaching code: short functions, human-language names, a comment above every meaningful block saying what it is for. No clever abstractions.
- Event names (contract between api and web): `ping`; broadcast: `send:self`, `send:all`, `send:others`, `send:user`, `send:users`, `send:ack`, server→client `received`; chat: `room:join`, `room:leave`, `message:send`, server→client `message:new`, `room:members`.

## Review Focus

1. Handshake with missing/non-numeric/unknown `userId` → rejected with `connect_error` (not a crash).
2. Same user in two tabs: `send:user` reaches both tabs; room member list shows the user once and keeps them until the last tab leaves.
3. `send:user` / `send:users` to a nonexistent user id → ack reports `delivered: 0`, no error.
4. `message:send` for a room the socket has not joined → rejected, nothing saved or broadcast.
5. Empty/whitespace-only chat text → rejected, not saved.

---

### Task 1: Repo and database foundation

**Files:**
- Create: `docker-compose.yml`, `.gitignore` (root), `api/.env.example`, `api/.env`
- Remove: `web/.git`
- Modify: `README.md`

**Interfaces:**
- Produces: Postgres reachable at `postgresql://socket:socket@localhost:5432/socket_io_basic`; env var `DATABASE_URL`; git branch `solution`.

- [ ] **Step 1:** `git checkout -b solution`; delete `web/.git`; add root `.gitignore` (node_modules, .next, dist, .env, .DS_Store); also confirm `.DS_Store` files are not tracked.
- [ ] **Step 2:** Write `docker-compose.yml` with a `postgres:17` service (user/password `socket`, db `socket_io_basic`, port 5432, named volume). Add `api/.env.example` and `api/.env` with `DATABASE_URL`, `WEB_ORIGIN=http://localhost:3000`, `PORT=3001`.
- [ ] **Step 3:** Run `docker compose up -d` then `docker compose exec postgres pg_isready -U socket`. Expected: `accepting connections`.
- [ ] **Step 4:** Commit `chore: repo foundation (compose, gitignore, unify web into repo)`.

### Task 2: Prisma 7, seed, and REST read endpoints

**Files:**
- Create: `api/prisma/schema.prisma`, `api/prisma.config.ts`, `api/prisma/seed.ts`, `api/src/prisma/prisma.service.ts`, `api/src/prisma/prisma.module.ts`, `api/src/users/users.controller.ts`, `api/src/rooms/rooms.controller.ts`, `api/src/users/users.module.ts`, `api/src/rooms/rooms.module.ts`
- Modify: `api/src/main.ts` (CORS, port from env), `api/src/app.module.ts`, `api/package.json` (deps, `db:migrate`, `db:seed` scripts)
- Test: `api/test/rest.e2e-spec.ts`

**Interfaces:**
- Produces: `PrismaService extends PrismaClient` (global module, Prisma 7 with `PrismaPg` adapter); `GET /users` → `{id:number,name:string}[]`; `GET /rooms` → `{id:number,name:string}[]`; `GET /rooms/:id/messages` → `{id,text,createdAt,user:{id,name}}[]` oldest first, 404 for unknown room (implemented in Task 5 but route lives in rooms controller; leave it out here).

- [ ] **Step 1:** Write failing e2e test: after seeding, `GET /users` returns exactly the 4 seeded names; `GET /rooms` returns 3 room names.
- [ ] **Step 2:** Run `pnpm test:e2e` in `api/`. Expected: FAIL (404).
- [ ] **Step 3:** Install `prisma @prisma/client @prisma/adapter-pg pg`. Define models `User(id Int @id @default(autoincrement()), name String @unique, messages)`, `Room(id, name @unique, messages)`, `Message(id, text, createdAt @default(now()), userId, roomId)`. Use the Prisma 7 generator/config layout from the Prisma 7 docs (check them; ESM output location and `prisma.config.ts` datasource url). Seed script upserts users and rooms.
- [ ] **Step 4:** `pnpm prisma migrate dev --name init` and `pnpm db:seed`; implement `PrismaService`, the two controllers, CORS in `main.ts`.
- [ ] **Step 5:** Run `pnpm test:e2e`. Expected: PASS. Run `pnpm build`. Expected: success.
- [ ] **Step 6:** Commit `feat(api): prisma 7 schema, seed, users/rooms endpoints`.

### Task 3: Auth middleware and Connection page (server)

**Files:**
- Create: `api/src/socket/auth.middleware.ts`, `api/src/connection/connection.gateway.ts`, `api/src/connection/connection.module.ts`
- Modify: `api/src/app.module.ts`
- Test: `api/test/connection.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`.
- Produces: `createAuthMiddleware(prisma: PrismaService): (socket: Socket, next: (err?: Error) => void) => Promise<void>` — reads `socket.handshake.auth.userId`, loads user, sets `socket.data.user = {id,name}`, otherwise `next(new Error('...'))` with a human message ("userId missing", "user not found"). `ConnectionGateway` on namespace `/connection`: `afterInit(server)` applies middleware; `handleConnection` / `handleDisconnect` log; `@SubscribeMessage('ping')` returns `{ pong: true, user: string, socketId: string }` as ack.
- Test helper: `api/test/helpers.ts` exports `startApp(): Promise<{url:string, close():Promise<void>}>` (listens on a random port) and `connectAs(url, namespace, userId?)` returning a `socket.io-client` socket (resolves on `connect` or rejects with `connect_error`). Later tasks reuse it.

- [ ] **Step 1:** Write failing tests: connects with seeded user id and gets `socket.id`; `ping` ack has `pong:true` and the user's name; missing `userId`, non-numeric `userId` and unknown `userId` each reject with a `connect_error` message; disconnect works.
- [ ] **Step 2:** Run `pnpm test:e2e -t connection`. Expected: FAIL.
- [ ] **Step 3:** Install `@nestjs/websockets @nestjs/platform-socket.io socket.io socket.io-client`; implement files per Interfaces, with `@WebSocketGateway({ namespace: 'connection', cors: { origin: process.env.WEB_ORIGIN } })`. Check Nest 12 docs for ESM/adapter specifics (`https://docs.nestjs.com/websockets/gateways.md`).
- [ ] **Step 4:** Run `pnpm test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(api): auth handshake middleware and /connection gateway`.

### Task 4: Broadcast gateway

**Files:**
- Create: `api/src/broadcast/broadcast.gateway.ts`, `api/src/broadcast/broadcast.module.ts`
- Modify: `api/src/app.module.ts`
- Test: `api/test/broadcast.e2e-spec.ts`

**Interfaces:**
- Consumes: `createAuthMiddleware`, test helpers.
- Produces: namespace `/broadcast`; on connect socket joins room `user:<id>`. Client events and what each does, all delivering server→client event `received` with payload `{ pattern: string, from: string, text: string }`:
  - `send:self` `{text}` → only the sender socket
  - `send:all` `{text}` → everyone including sender
  - `send:others` `{text}` → everyone except sender
  - `send:user` `{text, toUserId:number}` → all sockets of that user; ack `{ delivered: number }` (count of sockets reached, via `fetchSockets()` on the room)
  - `send:users` `{text, toUserIds:number[]}` → all sockets of those users; ack `{ delivered }`
  - `send:ack` `{text}` → no broadcast; returns ack `{ ok: true, echo: text, serverTime: string }`

- [ ] **Step 1:** Write failing tests with 3 users online (Alice has 2 tabs): assert exactly who gets `received` for each of `send:self/all/others/user/users`, that `send:user` reaches both of Alice's tabs with `delivered: 2`, nonexistent target → `delivered: 0` and nobody receives, `send:ack` returns the echo. Use short waits to assert non-delivery.
- [ ] **Step 2:** Run `pnpm test:e2e -t broadcast`. Expected: FAIL.
- [ ] **Step 3:** Implement gateway; each handler has a comment naming the Socket.IO API it demonstrates (`client.emit`, `server.emit`, `client.broadcast.emit`, `server.to(room)`).
- [ ] **Step 4:** Run `pnpm test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(api): /broadcast gateway covering every send pattern`.

### Task 5: Chat gateway and message history

**Files:**
- Create: `api/src/chat/chat.gateway.ts`, `api/src/chat/chat.module.ts`
- Modify: `api/src/rooms/rooms.controller.ts` (add `GET /rooms/:id/messages`), `api/src/app.module.ts`
- Test: `api/test/chat.e2e-spec.ts`

**Interfaces:**
- Consumes: `createAuthMiddleware`, `PrismaService`, test helpers.
- Produces: namespace `/chat` events:
  - `room:join` `{roomId:number}` → socket joins Socket.IO room `room:<id>`; ack `{ ok: true }` or `{ ok:false, error }` for unknown room; broadcast `room:members` `{ roomId, members: {id,name}[] }` (unique users) to the room
  - `room:leave` `{roomId}` → leaves, same members broadcast
  - `message:send` `{roomId, text}` → rejects (ack `{ok:false,error}`) if socket not in room or text blank after trim; else saves `Message`, emits `message:new` `{id,text,createdAt,user:{id,name},roomId}` to the room only; ack `{ ok: true }`
  - on `disconnecting`, broadcast updated `room:members` for each joined room.
  - `GET /rooms/:id/messages` as stated in Task 2.

- [ ] **Step 1:** Write failing tests: join → members list updates for existing members; message reaches room members only (a third user in another room gets nothing); message persisted and returned by REST; sending without joining → `ok:false`, nothing saved; blank text → `ok:false`; same user in two tabs appears once in members and stays until the last tab leaves/disconnects; disconnect updates members; unknown room join → `ok:false`.
- [ ] **Step 2:** Run `pnpm test:e2e -t chat`. Expected: FAIL.
- [ ] **Step 3:** Implement. Compute members by `fetchSockets()` on `room:<id>` deduplicated by `socket.data.user.id`; on `disconnecting` the leaving socket is still in rooms, so exclude it when computing.
- [ ] **Step 4:** Run the whole suite and `pnpm build`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(api): /chat gateway with rooms and persisted messages`.

### Task 6: Web foundation and user picker

**Files:**
- Create: `web/src/lib/config.ts` (`API_URL`), `web/src/lib/socket.ts` (`createSocket(namespace: string, userId: number): Socket`), `web/src/lib/current-user.ts` (`useCurrentUser(): { user: {id,name}|null, setUser, ready: boolean }` backed by try/catch-wrapped `localStorage`), `web/src/components/nav.tsx`, `web/src/app/page.tsx` (picker)
- Modify: `web/src/app/layout.tsx`, `web/package.json` (add `socket.io-client`), `web/.env.example`

**Interfaces:**
- Produces: the three symbols above. `createSocket` uses `io(API_URL + namespace, { auth: { userId }, autoConnect: false })`. Pages without a chosen user redirect to `/`.

- [ ] **Step 1:** Read `web/node_modules/next/dist/docs/` for App Router client-component and routing conventions in this Next version.
- [ ] **Step 2:** Implement picker: fetch `GET /users`, show one button per user, click saves choice and links on to `/connection`; nav shows the four pages and the current user with a "switch user" link.
- [ ] **Step 3:** Run `pnpm build` in `web/`; then `pnpm dev`, open `/` and verify with chrome devtools that 4 users render and choice survives reload. Expected: works, no console errors.
- [ ] **Step 4:** Commit `feat(web): user picker, nav, socket helper`.

### Task 7: Connection page (web)

**Files:**
- Create: `web/src/app/connection/page.tsx`

**Interfaces:**
- Consumes: `createSocket`, `useCurrentUser`.

- [ ] **Step 1:** Implement: Connect and Disconnect buttons, status badge, socket ID, a "Ping server" button that shows the ack, and an event log listing `connect`, `disconnect`, `connect_error` with timestamps. A "Connect with a wrong user id" button demonstrates `connect_error`. Comments mark each Socket.IO call (`socket.connect()`, `socket.on('connect')`, `socket.emit('ping', cb)`), and cleanup on unmount.
- [ ] **Step 2:** Verify in browser: connect shows an ID, disconnect clears it, wrong-id button logs the server's error message, two tabs show different IDs.
- [ ] **Step 3:** Commit `feat(web): connection page`.

### Task 8: Broadcast page (web)

**Files:**
- Create: `web/src/app/broadcast/page.tsx`

- [ ] **Step 1:** Implement: auto-connect to `/broadcast`; a text input; one button per pattern (self, all, others, one user with a user dropdown, several users with checkboxes, with-ack) each labeled with the plain-language meaning; a log of `received` events showing pattern, sender and text; ack results for `send:user`/`send:users`/`send:ack`.
- [ ] **Step 2:** Verify in browser with 3 windows (Alice, Bob, Carol) plus a second Alice tab: each button reaches exactly the expected windows.
- [ ] **Step 3:** Commit `feat(web): broadcast page`.

### Task 9: Chat page (web)

**Files:**
- Create: `web/src/app/chat/page.tsx`

- [ ] **Step 1:** Implement: room list from `GET /rooms`; selecting a room emits `room:leave` for the old and `room:join` for the new, loads `GET /rooms/:id/messages`, then appends `message:new`; member list from `room:members`; message form calling `message:send` and showing ack errors.
- [ ] **Step 2:** Verify in browser: two users in General see each other's messages and member list; a third user in Random sees none; reload shows history.
- [ ] **Step 3:** Commit `feat(web): chat page`.

### Task 10: Solution docs, full verification, push `solution`

**Files:**
- Modify: `README.md`
- Create: `docs/lessons.md` (per-page lesson guide for the solution)

- [ ] **Step 1:** Write README: prerequisites, setup (`docker compose up -d`, `cd api && pnpm i && pnpm prisma migrate deploy && pnpm db:seed && pnpm start:dev`, `cd web && pnpm i && pnpm dev`), repo layout, branch explanation (`main` = exercise, `solution` = answers, `git diff main solution`).
- [ ] **Step 2:** Run from clean: `pnpm test:e2e` and `pnpm build` in `api/`, `pnpm build` and `pnpm lint` in `web/`. Expected: all pass.
- [ ] **Step 3:** Commit; `git push -u origin solution` (ask the user before pushing).

### Task 11: Derive the starter on `main`

**Files:** modify on branch `main` (created from `solution` state, then stripped): the gateways, auth middleware body, `socket.ts`, and the three web pages' socket logic; `README.md`; remove `api/test/*.e2e-spec.ts` socket tests (keep REST test).

**Interfaces:**
- Produces: same file paths and line anchors as `solution`. Each removed spot is `// TODO(step N): <what to do in plain words>` plus `// hint: <API name>`; each file keeps its header comment (page goal, step order). Page UI, REST, Prisma, seed remain intact.

- [ ] **Step 1:** `git checkout main && git checkout solution -- . ` then strip Socket.IO logic per Interfaces, keeping gateways compiling (empty handlers with TODOs) and pages rendering (buttons present, handlers TODO).
- [ ] **Step 2:** Verify starter: `pnpm build` passes in both apps; `/`, `/connection`, `/broadcast`, `/chat` load in browser; connecting does nothing yet. Confirm `git diff main solution --stat` shows changes only in the intended Socket.IO spots.
- [ ] **Step 3:** Update README with the learner workflow (follow TODO steps in order; compare with `solution` when stuck).
- [ ] **Step 4:** Commit on `main`; ask the user before `git push origin main`.

---

## Self-review notes

- Spec coverage: picker (T6), 3 namespaces/pages (T3–T9), every send pattern (T4), rooms + persistence + REST history (T5), Prisma 7 + seed (T2), docker (T1), solution/starter branches (T10–11), e2e on solution only (T3–5, removed in T11), `web/.git` removal (T1).
- Names used across tasks match the Global Constraints event list and Interfaces blocks.
