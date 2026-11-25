# Socket.IO course redesign: from 3 big pages to 12 small lessons

Date: 2026-11-25. Status: draft for approval.

## Intent and why

The repo teaches Socket.IO to people who already write Next.js, NestJS (REST) and TypeScript but have never used sockets. It currently has 3 pages with about 20 TODO steps. Page 1 alone mixes namespace, handshake auth middleware, Prisma lookup, connect/disconnect logging and acknowledgements, and every page depends on `TODO(1.1)`. The course owner judges this too hard for a first contact. Nobody has used it with learners yet; this judgement is theirs, not data.

The redesigned course must make a learner write one or two commands, then immediately see the result, and repeat. The goal is confidence: the learner finishes able to build, and keep learning, on their own.

Reference style: three sibling repos by the same author (`DN_T_REACT_VITEST`, `DN_T_PLAYWRIGHT`, `DN_JEST_SUPERTEST`): numbered lesson folders, one idea per lesson, three or four stages from easy to hard, a cheatsheet, unfinished exercises that do not break the run.

## Goals

- A learner with Next/Nest/TS skills and zero Socket.IO knowledge reaches a working chat with rooms and persistent history, by their own code.
- Each lesson adds at most 1-2 new Socket.IO commands and shows its effect within 2-3 TODOs.
- Lessons 1-9 need no database, no Docker, no auth.
- A lesson that is unfinished or wrong must not break any other lesson.
- Every lesson shows its effect visibly in the browser (event log panel) and in the server terminal.

## Non-goals

- Teaching Next.js, NestJS, Prisma or TypeScript.
- Scaling topics: Redis adapter, clustering, sticky sessions, reconnection recovery, binary events, volatile events.
- Production auth. Users are picked from a list, as today.
- Automated grading of the learner's code (see "Left to the builder").

## Anti-goals (failure even if it technically works)

- A lesson that needs the learner to write code unrelated to the lesson's idea.
- A learner stuck on lesson N being blocked from lesson N+1 (lessons 1-9).
- Hidden magic: the learner sees an event happen but cannot find the line of their own code that caused it.

## Constraints

- Keep the existing stack: `api/` NestJS 12 + `@nestjs/platform-socket.io` + socket.io 4.8, `web/` Next.js + socket.io-client, Postgres via Docker + Prisma (only needed from lesson 10).
- Keep two branches: `main` (exercise, with TODOs) and `solution` (finished, commented).
- Repo documents in English (Thai-speaking course owner; learner language is not decided, see open points).

## Approaches considered

| | Approach | Trade-off |
| --- | --- | --- |
| A | Independent page per lesson, extending today's repo | Failure isolated; but no sense of building one thing, and the chat at the end feels like a jump |
| B | One chat app that grows each lesson | Motivating; but one broken lesson breaks all later ones, and demos like "everyone except me" are unnatural in a chat |
| **C (chosen)** | Lessons 1-9 are independent playground pages (A); lessons 10-12 build the chat as one continuing app (B) | Safe while learning commands, rewarding at the end; two content styles to write |

Chosen by the course owner on 2026-11-25. Reason: confidence comes from not being able to break the earlier lessons, and from finishing a real chat at the end.

## Lesson sequence (decided: shape; names and exact split are the builder's)

| Stage | # | Idea | New commands | What the learner sees |
| --- | --- | --- | --- | --- |
| A. Connect | 1 | Connect | `io()`, `handleConnection` | "connected" + socket id in log panel and server terminal |
| | 2 | Disconnect | `disconnect`, `handleDisconnect` | closing a tab logs on the server |
| B. Send messages | 3 | Client to server | `socket.emit`, `@SubscribeMessage` | text typed in the page shows in the server terminal |
| | 4 | Server to client | `client.emit`, `socket.on` | server's reply appears in the page |
| | 5 | Acknowledgement | return a value, `emitWithAck` | answer to that one question |
| C. Send to many | 6 | Everyone | `server.emit` | 3 tabs all receive |
| | 7 | Everyone except me | `client.broadcast.emit` | sender does not receive, others do |
| D. Group | 8 | Rooms | `client.join`, `client.leave`, `server.to(room).emit` | two rooms do not mix |
| | 9 | Namespaces | `namespace:` option, connecting to `/name` | separate channels per feature |
| E. Chat | 10 | Who is connected | handshake `auth`, `server.use` middleware, `socket.data` | connection refused for unknown user; names on messages |
| | 11 | Chat rooms with history | Prisma `Message`, REST `GET /rooms/:id/messages`, then join | leave and rejoin a room, earlier messages are still there |
| | 12 | Polish | room member list, disconnect cleanup | the finished chat |

Lessons 1-9 keep state in server memory only. Lesson 10 is the first to need Postgres/Prisma; Docker setup instructions appear at the start of stage E, not in the top-level quick start.

Final target (decided): a chat where a user picks a room, sees the messages sent earlier in that room when they come back, and receives new ones live.

## Cross-cutting design points

- **Event log panel**: a shared web component used by every lesson page, listing each event sent and received with time, direction and payload. This is how the learner "sees the result".
- **Playground pages**: each lesson has its own page, its own gateway (own namespace where it makes sense) and TODOs numbered per lesson (`TODO(3.1)`, ...). Everything not belonging to the lesson's idea is already written on `main`.
- **Shared socket helper** `web/src/lib/socket.ts` is pre-written on `main` (today it is a TODO that blocks every page). The learner first meets `io()` in lesson 1 on the page itself.
- **Cheatsheet** `docs/cheatsheet.md` mirroring the reference repos: one table of "who receives" for lessons 3-8, plus event names and handshake.
- **Tests on `solution`**: e2e per lesson with real socket.io clients (extend `api/test/rest.e2e-spec.ts` pattern) to prove each solution works; learners are not required to run them.
- Existing `docs/lessons.md` and README are rewritten around the new sequence.

## What is decided and what is left to the builder

Decided by the course owner: audience, goal (confidence), start simple, see results immediately, end at chat with rooms and history, approach C.

My calls (owner may overturn):
- 12 lessons and the table above, including that namespaces come after rooms.
- Event log panel as the way to show results.
- No Docker/DB until lesson 10; memory storage before that.
- Shared `socket.ts` pre-written.
- Rewrite in place in this repo rather than a new repo.

Left to the builder: exact file layout and route names for lessons; log panel design; wording and hints of each TODO; whether any lesson needs splitting; reworking `api/prisma` seed and moving existing code into lessons 10-12; solution-branch tests.

## Open points

- Language of lesson text for learners: English comments (current) or Thai. Not decided; default is to keep English in code and add Thai only if the owner asks.
- Whether to add a lightweight "check" script per lesson (like the `test.todo` approach in the reference repos). Not decided; out of scope for the first version.
