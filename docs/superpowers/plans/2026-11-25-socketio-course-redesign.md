# Socket.IO Course Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3 big lesson pages with 12 small lessons (9 independent playground lessons, then a 3-lesson chat with rooms and persistent history), on both the `solution` and `main` (starter) branches.

**Architecture:** `solution` is built first and proven by one e2e test file per lesson (real socket.io clients against the real Nest app). `main` is then derived from it by replacing the lesson's Socket.IO code with numbered `TODO` comments. Lessons 1-9 keep state in memory (no DB); each has its own namespace, gateway and web page. Lessons 10-12 reuse Postgres/Prisma. Every web page shows an event-log panel.

**Tech Stack:** NestJS 12 (`@nestjs/websockets`, `@nestjs/platform-socket.io`), socket.io 4.8, Next.js 16 + React 19, socket.io-client, Prisma 7 + Postgres (Docker), Vitest e2e, pnpm.

**Spec:** `docs/superpowers/specs/2026-11-25-socketio-course-redesign-design.md`

## Global Constraints

- Two branches stay: `main` (exercise, TODOs) and `solution` (finished, commented). Work on `solution` first, then derive `main`.
- Each lesson adds at most 1-2 new Socket.IO commands and has 2-4 TODOs; lessons 1-9 need no Docker, no DB, no auth.
- A lesson's starter code on `main` must compile, lint, and not break any other lesson; unfinished = event silently unhandled.
- TODO format (grep-able): `// TODO(N.k): <what to write>` then `//   hint: <exact method>`; `N` = lesson number, `k` = step. Steps with the same number belong together across web and api.
- Code and comments in English. API is ESM: relative imports end in `.js`. Tests use Vitest (`vi`), not Jest.
- Web: `web/AGENTS.md` says this Next.js differs from training data: read the relevant guide in `web/node_modules/next/dist/docs/` before writing web code.
- Node 22.12+, pnpm 10+. Postgres only from lesson 10 on (`docker compose up -d`, port 5434).
- Existing conventions to keep: `cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000' }` on every gateway; `API_URL` from `web/src/lib/config.ts`.

## Working method (used by every lesson task)

Paths: `MAIN=/Users/non/Documents/JOB/TEACHER/SOCKET_IO_BASIC`, `SOL=/Users/non/Documents/JOB/TEACHER/SOCKET_IO_BASIC-solution` (a git worktree of branch `solution`, created in Task 0).

**Cycle A (solution, in `$SOL`):** write `api/test/lessonNN.e2e-spec.ts` → run `cd $SOL/api && pnpm test:e2e lessonNN` and see it FAIL (no gateway) → implement the gateway, register it in `LessonsModule`, write the web page → test PASSES → `cd $SOL/api && pnpm lint && pnpm build` and `cd $SOL/web && pnpm lint && pnpm build` → commit `feat(solution): lesson N <name>`.

**Cycle B (starter, in `$MAIN`):** copy the lesson's gateway/page from `$SOL`, replace the code listed under "Starter TODOs" with TODO comments (keep everything else working; use `void x;` for unused values so lint passes), register the module → `pnpm lint && pnpm build` in `api` and `web` → temporarily copy `$SOL/api/test/helpers.ts` and `lessonNN.e2e-spec.ts` into `$MAIN/api/test/`, run `pnpm test:e2e lessonNN`, expect FAIL, delete the copies (`git status` must show no test files) → commit `feat(starter): lesson N <name>`.

**Web smoke (manual, per lesson, on `solution`):** `pnpm dev` in `api` and `web`, open the lesson page in 2-3 tabs, do the "learner sees" action from the lesson table in the spec, and confirm both the on-page log and (where stated) the API terminal show it.

## Review Focus

1. **API without Postgres:** lessons 1-9 must work with the DB container stopped (spec: no Docker before lesson 10). Test: run `pnpm test:e2e lesson0` (all of 1-9) with `docker compose stop` → passes. (Task 1 owns the check; each lesson re-runs it.)
2. **Malformed payloads:** `socket.emit('note:send')` with no body, or `math:add` with strings, must not kill the server or the socket. Tests in Tasks 4 and 6: the next call on the same socket still works.
3. **Same user, two tabs (chat):** member list shows the user once; closing one tab keeps them listed. Test in Task 13.
4. **Messaging a room you have not joined, and empty text:** refused with `{ ok: false, error }`. Test in Task 12.
5. **React dev double-mount:** each lesson page load must produce exactly one connection on the server. Owned by Task 1 (`reactStrictMode: false` in `web/next.config.ts`) and checked in the Task 2 web smoke (one "connected" log line in the API terminal).

---

### Task 0: Workspace

**Files:** none changed in code; commits the spec and this plan.

- [ ] **Step 1:** In `$MAIN` on `main`, `git add docs/superpowers && git commit -m "docs: course redesign spec and plan"`.
- [ ] **Step 2:** `git worktree add ../SOCKET_IO_BASIC-solution solution`.
- [ ] **Step 3:** In both `api/` and `web/` of both worktrees run `pnpm install`; copy `api/.env.example` to `api/.env` in both; `docker compose up -d`; in `$SOL/api` run `pnpm prisma migrate deploy && pnpm db:seed`.
- [ ] **Step 4:** Baseline: in `$SOL/api` `pnpm test:e2e` passes (old tests); `pnpm build` passes in `api` and `web` of both worktrees. Record the result; if the baseline fails, stop and report.

### Task 1: Shared foundation (both branches)

**Files:**
- Create: `web/src/lib/use-socket-log.ts`, `web/src/lib/use-lesson-socket.ts`, `web/src/lib/nickname.ts`, `web/src/components/event-log.tsx`, `api/src/lessons/lessons.module.ts`
- Modify: `web/src/components/nav.tsx`, `web/src/app/page.tsx`, `web/next.config.ts`, `api/src/app.module.ts`, `api/test/helpers.ts` (solution only)
- Delete: `api/src/connection/`, `api/src/broadcast/`, `web/src/app/connection/`, `web/src/app/broadcast/`, `api/test/connection.e2e-spec.ts`, `api/test/broadcast.e2e-spec.ts` (solution)

**Interfaces — Produces:**
- `type LogEntry = { id: number; time: string; kind: 'sent' | 'received' | 'system'; text: string }` (in `use-socket-log.ts`)
- `useSocketLog(socket: Socket | null): { entries: LogEntry[]; clear: () => void }`: records `connect`, `disconnect`, `connect_error` as `system`, `onAny` as `received`, `onAnyOutgoing` as `sent`; newest first, max 200; text is `event` plus JSON of args.
- `useLessonSocket(namespace: string): { socket: Socket | null; connected: boolean; entries: LogEntry[]; clear: () => void }`: creates `io(API_URL + '/' + namespace)` in an effect, disconnects on cleanup, wraps `useSocketLog`. Used by lessons 3-9 pages.
- `EventLog({ entries }: { entries: LogEntry[] })`: dark panel with a colored arrow per kind (`→` sent, `←` received, `•` system).
- `useNickname(): [string, (name: string) => void]`: per-tab (sessionStorage key `socket-lesson-nickname`), default `Tab-` + 4 random chars, SSR-safe (`useSyncExternalStore` like `current-user.ts`).
- `LessonsModule` (Nest module, empty `providers` array that each lesson task extends), imported by `AppModule`.
- `connectTo(url: string, namespace: string, setup?: (socket: Socket) => void): Promise<Socket>` in test helpers: creates the socket with `autoConnect: false`, calls `setup` before `connect()` (so tests can attach listeners before the first server event), resolves on `connect`, rejects with the error on `connect_error`.

- [ ] **Step 1 (solution):** Write the API pieces (`LessonsModule`, AppModule imports, deletions) and `connectTo`. Run `cd $SOL/api && pnpm build && pnpm test:e2e` → remaining tests (`rest`, `chat`) pass.
- [ ] **Step 2 (solution):** Write the web pieces. `nav.tsx`: links grouped A-E to `/lessons/01-connect` … `/lessons/10-auth`, `/chat`; shows nickname with an edit input; shows the picked DB user only when set. Home page lists the 5 stages and 12 lessons from the spec table. `next.config.ts`: `reactStrictMode: false` with a comment saying why (one connection per page load). The chat page and `RequireUser` stay unchanged until Task 11.
- [ ] **Step 3:** `cd $SOL/web && pnpm lint && pnpm build`; commit `feat(solution): shared log panel, hooks, nickname, lesson index`.
- [ ] **Step 4:** On `main`: `git checkout solution -- api/src/lessons api/src/app.module.ts web/src/lib web/src/components web/src/app/page.tsx web/next.config.ts` and `git rm -r` the deleted dirs; build and lint both apps; commit `feat(starter): shared foundation`.

### Task 2: Lesson 1 — Connect

**Files:** Create `api/src/lessons/01-connect.gateway.ts` (`Lesson1Gateway`, namespace `lesson1`), `web/src/app/lessons/01-connect/page.tsx`, `api/test/lesson01.e2e-spec.ts`; modify `lessons.module.ts`.

**Interfaces:** Consumes `connectTo`, `useSocketLog`, `EventLog`. Gateway implements `OnGatewayConnection`, has `private readonly logger = new Logger('Lesson1')`.

- [ ] **Step 1:** Test `lesson01.e2e-spec.ts`: spy `vi.spyOn(Logger.prototype, 'log')`; `connectTo(url, '/lesson1')`; `await vi.waitFor(...)` that some `log` call contains `socket.id`. Second test: connecting to `/lesson1` needs no `auth` (resolves without userId).
- [ ] **Step 2:** Run it → FAIL. Implement `handleConnection(client: Socket)` logging `` `connected: ${client.id}` ``; page keeps `socket` in `useState`, `connected`/`socketId` in state, panel via `useSocketLog(socket)`, shows status badge and socket id.
- [ ] **Step 3:** Run it → PASS. Run it again with `docker compose stop` → PASS (Review Focus 1). `docker compose start` afterwards.
- [ ] **Step 4:** Web smoke: open `/lessons/01-connect`: badge turns "connected", socket id shows, API terminal shows exactly one `connected:` line (Review Focus 5). Commit (Cycle A).
- [ ] **Step 5 (Cycle B):** Starter TODOs. `TODO(1.1)` web: `const socket = io(API_URL + "/lesson1")` (hint: import `io` from `socket.io-client`) and `setSocket(socket)`. `TODO(1.2)` web: `socket.on("connect", ...)` → `setConnected(true)`, `setSocketId(socket.id ?? null)`. `TODO(1.3)` api: log the id in `handleConnection`. Starter page shows "not connected yet" while TODO(1.1) is undone.

### Task 3: Lesson 2 — Disconnect

**Files:** Create `api/src/lessons/02-disconnect.gateway.ts` (`Lesson2Gateway`, ns `lesson2`, `OnGatewayDisconnect`), `web/src/app/lessons/02-disconnect/page.tsx`, `api/test/lesson02.e2e-spec.ts`.

- [ ] **Step 1:** Test: spy on `Logger.prototype.log`; connect then `socket.disconnect()`; `vi.waitFor` a log call containing `disconnected:` and the socket id.
- [ ] **Step 2:** Implement `handleDisconnect(client: Socket)` logging `` `disconnected: ${client.id}` ``. Page uses `io` + `connect` handler (pre-written, learned in lesson 1), Connect/Disconnect buttons, panel; the `disconnect` handler stores and shows the `reason` string.
- [ ] **Step 3:** Run tests, Cycle A checks. Smoke: press Disconnect → reason `io client disconnect`; stop the API → reason `transport close`.
- [ ] **Step 4 (Cycle B):** Starter TODOs. `TODO(2.1)` web: `socket.on("disconnect", (reason) => ...)`. `TODO(2.2)` web: Disconnect button calls `socket.disconnect()`. `TODO(2.3)` api: log in `handleDisconnect`.

### Task 4: Lesson 3 — Client to server

**Files:** `api/src/lessons/03-send-to-server.gateway.ts` (`Lesson3Gateway`, ns `lesson3`), `web/src/app/lessons/03-send-to-server/page.tsx`, `api/test/lesson03.e2e-spec.ts`.

**Event:** `note:send` body `{ text: string }`.

- [ ] **Step 1:** Tests: (a) after `socket.emit('note:send', { text: 'hello' })` a `Logger.prototype.log` call contains `hello`; (b) Review Focus 2: `socket.emit('note:send')` with no body does not stop the server: a fresh `connectTo` still works and the first socket is still `connected`.
- [ ] **Step 2:** Implement `@SubscribeMessage('note:send') onNote(@ConnectedSocket() client: Socket, @MessageBody() body: { text: string })` logging `` `note from ${client.id}: ${body.text}` ``; page uses `useLessonSocket('lesson3')`, text input + Send button.
- [ ] **Step 3:** Cycle A checks. Smoke: the typed text appears in the API terminal and as `→ note:send` in the panel.
- [ ] **Step 4 (Cycle B):** `TODO(3.1)` web: `socket.emit("note:send", { text })`. `TODO(3.2)` api: the handler above.

### Task 5: Lesson 4 — Server to client

**Files:** `api/src/lessons/04-send-to-client.gateway.ts` (`Lesson4Gateway`, ns `lesson4`), page `04-send-to-client`, `api/test/lesson04.e2e-spec.ts`.

**Events:** server → client `welcome` `{ message: string }` on connect; client → server `hello` `{ name: string }`; server → client `hello:reply` `{ message: string }`.

- [ ] **Step 1:** Tests: `connectTo(url, '/lesson4', s => welcome = collect(s, 'welcome'))` → one `welcome` whose message contains the socket id; `emit('hello', { name: 'Ann' })` → `hello:reply` with `message === 'Hello, Ann!'`; a second socket receives no `hello:reply` (reply goes to the sender only).
- [ ] **Step 2:** Implement `handleConnection` emitting `welcome` with `` `Welcome! Your socket id is ${client.id}` `` and `@SubscribeMessage('hello')` emitting `hello:reply` via `client.emit`. Page: name input, Say hello button (pre-written `socket.emit('hello', …)`), shows the latest welcome and reply.
- [ ] **Step 3:** Cycle A checks and smoke.
- [ ] **Step 4 (Cycle B):** `TODO(4.1)` api: `client.emit('welcome', …)` in `handleConnection`. `TODO(4.2)` api: the `hello` handler. `TODO(4.3)` web: `socket.on("welcome", …)`. `TODO(4.4)` web: `socket.on("hello:reply", …)`.

### Task 6: Lesson 5 — Acknowledgement

**Files:** `api/src/lessons/05-acknowledgement.gateway.ts` (`Lesson5Gateway`, ns `lesson5`), page `05-acknowledgement`, `api/test/lesson05.e2e-spec.ts`.

**Event:** `math:add` body `{ a: number; b: number }` → returns `{ ok: true; result: number } | { ok: false; error: 'a and b must be numbers' }`.

- [ ] **Step 1:** Tests: `await socket.emitWithAck('math:add', { a: 2, b: 3 })` equals `{ ok: true, result: 5 }`; with `{ a: 'x', b: 1 }` equals the error object; Review Focus 2: emitting with no body then `emitWithAck` again with valid numbers still returns `{ ok: true, result: … }`.
- [ ] **Step 2:** Implement `@SubscribeMessage('math:add')` returning those objects (guard with `typeof`; for a missing body treat as not numbers). Page: two number inputs, Add button, shows the reply.
- [ ] **Step 3:** Cycle A checks and smoke.
- [ ] **Step 4 (Cycle B):** `TODO(5.1)` api: the handler returning the value ("the returned value is the acknowledgement"). `TODO(5.2)` web: `const reply = await socket.emitWithAck("math:add", { a, b })` then show it.

### Task 7: Lesson 6 — Everyone

**Files:** `api/src/lessons/06-everyone.gateway.ts` (`Lesson6Gateway`, ns `lesson6`, `@WebSocketServer() server: Namespace`), page `06-everyone`, `api/test/lesson06.e2e-spec.ts`.

**Events:** `shout` `{ from: string; text: string }` both directions.

- [ ] **Step 1:** Test with 3 sockets: A emits `shout` `{ from: 'A', text: 'hi' }` → A, B and C each receive it (`waitFor`), payload equal.
- [ ] **Step 2:** Implement `this.server.emit('shout', { from, text })`. Page: sends with the nickname from `useNickname()`, shows received shouts.
- [ ] **Step 3:** Cycle A checks; smoke with 3 tabs.
- [ ] **Step 4 (Cycle B):** `TODO(6.1)` web emit. `TODO(6.2)` web `socket.on("shout", …)`. `TODO(6.3)` api handler with `server.emit`.

### Task 8: Lesson 7 — Everyone except me

**Files:** `api/src/lessons/07-everyone-else.gateway.ts` (`Lesson7Gateway`, ns `lesson7`), page `07-everyone-else`, `api/test/lesson07.e2e-spec.ts`.

**Events:** client → server `send:all` and `send:others`, body `{ from: string; text: string }`; server → client `received` `{ pattern: 'all' | 'others'; from: string; text: string }`.

- [ ] **Step 1:** Tests: `send:all` reaches sender and others (`pattern: 'all'`); `send:others` reaches B and C but the sender receives nothing within 300 ms (use `collect` + `sleep`).
- [ ] **Step 2:** Implement `send:all` (`server.emit`, pre-written in starter too) and `send:others` (`client.broadcast.emit`). Page has two buttons, one per event, so learners compare.
- [ ] **Step 3:** Cycle A checks; smoke.
- [ ] **Step 4 (Cycle B):** `TODO(7.1)` api `send:others` handler. `TODO(7.2)` web `socket.on("received", …)` (the `send:all` handler and both buttons are pre-written).

### Task 9: Lesson 8 — Rooms

**Files:** `api/src/lessons/08-rooms.gateway.ts` (`Lesson8Gateway`, ns `lesson8`), page `08-rooms` (two rooms `red`, `blue`, join/leave/say controls), `api/test/lesson08.e2e-spec.ts`.

**Events:** `room:join` `{ room }` → ack `{ ok: true; rooms: string[] }` (`[...client.rooms]`); `room:leave` `{ room }` → ack `{ ok: true }`; `room:say` `{ room, from, text }`; server → client `room:message` `{ room, from, text }`.

- [ ] **Step 1:** Tests: A and C join `red`, B joins `blue`; the join ack's `rooms` contains `red` and the socket's own id; A says in `red` → A and C receive, B receives nothing; after C leaves `red`, a later `red` message no longer reaches C.
- [ ] **Step 2:** Implement the three handlers with `await client.join(room)`, `await client.leave(room)`, `this.server.to(room).emit('room:message', …)`. Page is fully pre-written on the web side (emit and listener already known).
- [ ] **Step 3:** Cycle A checks; smoke (two rooms never mix).
- [ ] **Step 4 (Cycle B):** `TODO(8.1)` join, `TODO(8.2)` leave, `TODO(8.3)` say — all api only; hints name `client.join`, `client.leave`, `server.to(room).emit`.

### Task 10: Lesson 9 — Namespaces

**Files:** `api/src/lessons/09-namespaces.gateway.ts` (`Lesson9NewsGateway` ns `news`, `Lesson9SportsGateway` ns `sports`), page `09-namespaces` (two sockets on one page, two panels), `api/test/lesson09.e2e-spec.ts`.

**Event:** `headline` `{ text: string }` → `this.server.emit('headline', { text })` (pre-written in both gateways).

- [ ] **Step 1:** Tests: sockets on `/news` and `/sports`; a headline emitted on news reaches the news socket and not the sports socket (300 ms window); connecting to `/nope` rejects with an error mentioning `Invalid namespace`.
- [ ] **Step 2:** Implement both gateways with the `namespace` option. Page connects to `/news` and `/sports`, one panel each, a Publish button per socket.
- [ ] **Step 3:** Cycle A checks; smoke.
- [ ] **Step 4 (Cycle B):** `TODO(9.1)` api `namespace: 'news'`, `TODO(9.2)` api `namespace: 'sports'`, `TODO(9.3)` web `io(API_URL + "/news")` and `io(API_URL + "/sports")`. Verify on the starter that the page shows a namespace error in the panel (note in the PR/commit message), and tell the learner that in the page header comment.

### Task 11: Lesson 10 — Who is connected (handshake auth)

**Files:** `api/src/lessons/10-auth.gateway.ts` (`Lesson10Gateway`, ns `auth`), modify `api/src/socket/auth.middleware.ts` (existing `createAuthMiddleware(prisma: PrismaService)`), `web/src/app/lessons/10-auth/page.tsx` (user picker moved from the old home page, connect, connect-as-9999, send message), `web/src/components/require-user.tsx` (link text/target → `/lessons/10-auth`), `api/test/lesson10.e2e-spec.ts`. Requires Postgres.

**Events:** client → server `message:send` `{ text }`; server → client `message:new` `{ text, from: string }`.

- [ ] **Step 1:** Port the five refusal tests from the old `connection.e2e-spec.ts` (`git show solution~N:api/test/connection.e2e-spec.ts` via `git log`) to `/auth` with the same messages (`userId missing`, `user not found`, big id does not crash the server). Add: `message:new` carries `from` equal to the handshake user's name even when the client sends `{ text, from: 'Mallory' }`; everyone connected receives it.
- [ ] **Step 2:** Run → FAIL. Implement: `afterInit(server)` → `server.use(createAuthMiddleware(this.prisma))`; handler emits `this.server.emit('message:new', { text, from: client.data.user.name })`. Middleware sets `socket.data.user = { id, name }`.
- [ ] **Step 3:** Cycle A checks; smoke with Alice and Bob tabs plus the unknown-user button.
- [ ] **Step 4 (Cycle B):** `TODO(10.1)` api `server.use(...)`; `TODO(10.2)` middleware reads `socket.handshake.auth.userId`; `TODO(10.3)` middleware looks up the user inside try/catch; `TODO(10.4)` sets `socket.data.user`; `TODO(10.5)` api uses `client.data.user.name`; `TODO(10.6)` web `io(url, { auth: { userId } })` and `socket.on("connect_error", …)`. Keep the existing explanatory comments of the middleware.

### Task 12: Lesson 11 — Chat rooms with history

**Files:** rewrite `api/src/chat/chat.gateway.ts` (`ChatGateway`, ns `chat`, uses `createAuthMiddleware` pre-written), keep `rooms.controller.ts` (`GET /rooms`, `GET /rooms/:id/messages`), rewrite `web/src/app/chat/page.tsx`, delete `web/src/lib/socket.ts`, `api/test/lesson11.e2e-spec.ts`. Requires Postgres.

**Events:** `room:join` `{ roomId }` → `{ ok: true } | { ok: false; error: 'room not found' }`; `room:leave` `{ roomId }` → `{ ok: true }`; `message:send` `{ roomId, text }` → `{ ok: true } | { ok: false; error: 'join the room first' | 'message is empty' }`; server → room `message:new` `{ id, text, createdAt, roomId, user: { id, name } }`. Socket room names are `room:<id>`.

- [ ] **Step 1:** Port the matching cases of the old `chat.e2e-spec.ts` (join unknown room, messages only inside a room, saved messages come back from `GET /rooms/:id/messages` after leaving and rejoining). Add Review Focus 4: sending without joining and empty/whitespace text are refused and nothing is saved.
- [ ] **Step 2:** Run → FAIL; implement the three handlers with Prisma as in the old solution gateway (`roomName(id)` helper, `client.rooms.has`, `prisma.message.create`, `server.to(room).emit`).
- [ ] **Step 3:** Web page: room list (REST), on enter → leave old room, `emitWithAck('room:join')`, then fetch history, then live `message:new`. Cycle A checks; smoke: Alice sends in General, leaves for Random, returns to General → earlier messages are shown; Bob in General receives live.
- [ ] **Step 4 (Cycle B):** `TODO(11.1)` api `room:join`; `TODO(11.2)` api `room:leave`; `TODO(11.3)` api `message:send`; `TODO(11.4)` web join then load history (`GET /rooms/:id/messages`); `TODO(11.5)` web `socket.on("message:new", …)` and `emitWithAck("message:send", …)`. The old TODO(3.x) text is removed.

### Task 13: Lesson 12 — Members and clean-up

**Files:** modify `api/src/chat/chat.gateway.ts`, `web/src/app/chat/page.tsx`, `api/test/lesson12.e2e-spec.ts`. Requires Postgres.

**Event:** server → room `room:members` `{ roomId: number; members: { id: number; name: string }[] }`; private `sendMemberList(room: string, leavingSocketId?: string): Promise<void>`.

- [ ] **Step 1:** Port the member-list cases from the old chat tests: join/leave updates the list; two tabs of one user list the user once (Review Focus 3); closing one tab keeps the user while the other tab is open; closing the last tab removes them for the others.
- [ ] **Step 2:** Run → FAIL; implement `sendMemberList` (`fetchSockets`, `Map` keyed by user id), call it after join and leave, and from a `client.on('disconnecting', …)` registered in `handleConnection`. Web: show members; on `connect`, if a room is selected re-emit `room:join` (rejoin after reconnect).
- [ ] **Step 3:** Cycle A checks; smoke: stop and restart the API with a tab open → after reconnect the member list returns without clicking.
- [ ] **Step 4 (Cycle B):** `TODO(12.1)` api helper; `TODO(12.2)` api call it in join/leave; `TODO(12.3)` api `disconnecting`; `TODO(12.4)` web `room:members` listener; `TODO(12.5)` web rejoin on reconnect.

### Task 14: Docs and final verification

**Files:** rewrite `README.md`, `docs/lessons.md`; create `docs/cheatsheet.md` (both branches); `api/README.md`/`web/README.md` only if they mention removed pages.

- [ ] **Step 1:** README: course intro, stage/lesson table, run instructions with Docker marked "only from lesson 10", the two-branch explanation, `grep -rn "TODO(3\."` style tip, link to cheatsheet. `docs/lessons.md`: one short section per lesson (goal, files, TODOs, what to try, what you should see). Cheatsheet: the "who receives" table (lessons 3-8), handshake `auth`, ack, rooms, namespaces.
- [ ] **Step 2 (final checks):** On `solution`: `cd api && pnpm lint && pnpm build && pnpm test:e2e` (all lesson tests and `rest` pass); `cd web && pnpm lint && pnpm build`. Also run `pnpm test:e2e lesson0` with the DB stopped (Review Focus 1). On `main`: `pnpm lint && pnpm build` in both apps; `git ls-files | grep -c 'e2e-spec'` shows only `rest.e2e-spec.ts`; `grep -rn "TODO(" api/src web/src | wc -l` is non-zero and every lesson number 1-12 appears at least once.
- [ ] **Step 3:** `git diff main solution --stat` touches only lesson code, tests and the docs differences (no stray edits). Commit docs on both branches; `git worktree remove ../SOCKET_IO_BASIC-solution` after confirming nothing is uncommitted.

---

## Self-review

- **Spec coverage:** 12 lessons (Tasks 2-13) with the spec's commands and results; no DB before lesson 10 (Task 1 module split, Review Focus 1); event log panel (Task 1); pre-written shared helpers (hooks replace `createSocket`; lesson 1 writes `io()` itself); chat with rooms and history (Tasks 12-13); cheatsheet, README, lessons guide (Task 14); e2e tests on `solution` (every lesson task); rewrite in place (no new repo). Open points in the spec (learner language, check scripts) are intentionally not built: English stays, no per-lesson check script.
- **Type consistency:** `LogEntry`, `useSocketLog`, `useLessonSocket`, `connectTo`, `Lesson<N>Gateway`, event names and ack shapes are the same in every task that uses them; lesson 12 reuses `ChatGateway` from lesson 11.
- **Proportion:** tasks give signatures, events, test assertions and TODO lists; gateway/page bodies are left to the implementer.
