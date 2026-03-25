@AGENTS.md

# CrossCheck App — Claude Code Reference

## What This Is

CrossCheck serves AI-generated presentations and discussions (from the Polylogue 3 pipeline) to students, teachers, and researchers for evaluating critical thinking flaws. Built for the University Middle School (UMS) in Memphis.

## Tech Stack

- **Next.js 16.2.1** (App Router only). `params` and `searchParams` are Promises — must `await`. Middleware is `proxy.ts` not `middleware.ts`.
- **Prisma 6.19** — Client generated to `src/generated/prisma/client`. Import from `../src/generated/prisma/client` in scripts.
- **NextAuth v5 beta** — JWT strategy, credentials provider. Students log in by name only (no password). Teachers/researchers require password.
- **Socket.IO 4** — Custom server in `server.ts`. Auth via httpOnly cookie JWT decoding. Rooms: `session:{id}` + `group:{id}`.
- **PostgreSQL 15** — Database `crosscheck` on localhost:5432.

## Running

```bash
npm run dev          # Custom server with Socket.IO (tsx watch server.ts)
npm run dev:next     # Plain Next.js without Socket.IO (fallback)
```

## Key Architecture Patterns

- **Custom server** (`server.ts`): Wraps Next.js + Socket.IO on same port. `getIO()` singleton in `src/lib/socket-server.ts` lets API routes emit events.
- **Text selection**: `data-seg-start`/`data-seg-end` attributes on spans. Overlap rejection in `annotatable-text.tsx`. `useSelectionClear` hook clears stale pending state.
- **Matching engine** (`src/lib/matching.ts`): 3-pass algorithm (green exact → blue wrong-type → red unmatched). Supports `{ spotMode: true }` for Spot practice mode.
- **Dual annotation model**: `/api/annotations` creates solo session/group per user (Phase 1 individual practice). `/api/annotations/session` uses real session groups with membership + phase validation.
- **Group consensus**: `PATCH /api/annotations/[id]` with `{ action: "confirm" | "unconfirm" }`. Threshold: 2 confirmations. `isGroupAnswer` and `confirmedBy` fields.
- **Cascading deletes**: All child relations have `onDelete: Cascade`. Session delete is a single `prisma.session.delete()`.

## Session Phases

`setup` → `individual` → `group` → `reviewing` → `closed`

- `reviewing` → `group` allowed (reopen with confirmation)
- Delete allowed in `setup`/`closed` only
- Individual phase: API filters annotations to own userId for students

## Socket.IO Events

| Event | Emitted by | Rooms |
|-------|-----------|-------|
| `annotation:created` | POST /api/annotations/session | group + session (via .except) |
| `annotation:deleted` | DELETE /api/annotations/[id] | group + session (via .except) |
| `annotation:confirmed` | PATCH /api/annotations/[id] | group + session (via .except) |
| `scaffold:sent` | POST /api/scaffolds | group + session (via .except) |
| `scaffold:acknowledged` | PATCH /api/scaffolds/[id] | session only |
| `session:phase_changed` | PATCH /api/sessions/[id] | session only |

Room joins are validated against the database (teacher ownership / student group membership).

## Database Reset

```bash
npx prisma migrate reset
npx tsx scripts/seed-users.ts
npx tsx scripts/ingest-registry.ts --all
```

Test accounts: teacher1/teacher123, researcher1/researcher123. Students: enter name only (Alex, Jordan, Sam, Taylor).
