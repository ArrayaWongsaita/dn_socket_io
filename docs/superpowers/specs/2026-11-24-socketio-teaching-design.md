# Socket.IO Teaching Repo — Design

Date: 2026-11-24 · Status: draft for approval

## Intent and why

A hands-on teaching repo (Next.js 16 + NestJS 12 + Socket.IO 4.8 + Postgres/Prisma 7) for learners who know REST in Next/Nest but have **never used Socket.IO**. Learners do not read explanations of what a connection is; they use working demo pages, then re-implement the Socket.IO parts themselves from guided comments, peeking at the solution when stuck.

Code must be complete, simple, "reads like human language", and heavily commented about what each part does.

## Goals

- Three focused pages, each teaching one idea, in order: **Connection → Broadcast → Chat rooms**.
- Plus a user-picker page (no login form): click a seeded user to "be" that user.
- Learners can open several browser windows as different users to see events flow.
- Two branches in one repo (existing remote `dn_socket_io`): `solution` (full code, tested) and `main` (starter: Socket.IO code removed, replaced by `// TODO(step N)` comments with hints).

## Non-goals / anti-goals

- No real authentication (passwords, JWT, sessions). Picking a user is the "login".
- No scaling topics (Redis adapter, multi-node), no ws-vs-socket.io comparison, no 4th page (typing/presence is a possible later add-on).
- Anti-goal: the setup code (Prisma, seed, UI, layout) must never be what learners get stuck on. It is fully provided on both branches.
- Anti-goal: clever abstractions. A learner must be able to read one file per page and see everything.

## Approaches considered

1. One module/gateway per page, single default namespace — simplest, but teaches no namespaces.
2. **One module/gateway *and one namespace* per page (`/connection`, `/broadcast`, `/chat`) — chosen by the user.** Cleanest separation per page and teaches namespaces; cost: one more concept up front (introduced in page 1 as "the address you connect to") and auth middleware must be applied per namespace (solved with one shared helper).
3. One gateway for everything — least code, but mixes all three pages' events; rejected.

## Architecture

Monorepo-style folders `api/` (Nest) and `web/` (Next), pnpm each. Postgres via `docker compose` at repo root. api on :3001 (CORS allows web origin), web on :3000.

**Data (Prisma 7, driver adapter `@prisma/adapter-pg`, `prisma.config.ts`):** `User(id, name)`, `Room(id, name)`, `Message(id, text, userId, roomId, createdAt)`. Seed: 4 users (Alice, Bob, Carol, Dave) and 3 rooms (General, Random, Tech).

**Server (per page a folder with module + gateway):**
- `connection/` namespace `/connection`: auth middleware (reads `socket.handshake.auth.userId`, looks up the user via Prisma, rejects with an Error → client `connect_error`, else stores user in `socket.data.user`), `handleConnection`/`handleDisconnect` logs, one `ping` event with acknowledgement.
- `broadcast/` namespace `/broadcast`: same auth; on connect each socket joins personal room `user:<id>` (works with multiple tabs). Events cover every send pattern: to self (`client.emit`), to everyone (`server.emit`), everyone except sender (`client.broadcast.emit`), to one user (`server.to('user:<id>')`), to several users (`server.to([...])`), and request/reply with acknowledgement. Each received event carries who sent it and which pattern was used.
- `chat/` namespace `/chat`: same auth; `joinRoom`/`leaveRoom`, `sendMessage` (saves to Postgres, emits to room only), `roomMembers` list updates. REST `GET /rooms` and `GET /rooms/:id/messages` for history (links to learners' REST knowledge).
- Shared `auth.middleware.ts` helper applied to each namespace in `afterInit`.

**Client (Next App Router):** `/` user picker (choice kept in `localStorage`, user list from REST `GET /users`), `/connection`, `/broadcast`, `/chat`. One tiny `createSocket(namespace, userId)` helper; each page owns its socket logic in a clearly commented section, no global state library. UI uses Tailwind (already installed), simple and readable.

## Teaching layout

- `main` branch: each Socket.IO spot is `// TODO(step N): <what to do>  // hint: <method name>` and where a spot is needed the file already exists. A top-of-file comment states the page's goal and the order of steps. Solution branch contains the same file/line positions, so `git diff main solution` is a learning aid.
- README: setup in a few commands (`docker compose up -d`, migrate, seed, two dev servers), then a per-page lesson guide pointing to the files and TODO steps.

## Verification

- vitest e2e on `solution`: start Nest, connect with `socket.io-client`, assert auth accept/reject, every broadcast pattern (who receives, who doesn't), room isolation and message persistence.
- Manual check in the browser with multiple tabs/users on all three pages (chrome devtools).
- Starter branch: builds and runs (pages load, user picker works); the Socket.IO features are the intentionally missing part. The e2e tests live on `solution` only.

## My calls (not discussed; change if you disagree)

- Remove `web/.git` (a leftover from create-next-app) so web is tracked by the root repo.
- Names, seed counts, ports, Tailwind UI, `localStorage` for the picked user.
- Persisting chat messages and loading history via REST.
- Starter branch keeps tests off; solution branch holds the e2e tests.

## Left to the builder

Exact TODO wording/hints, UI details, file naming inside each page folder, test structure.
