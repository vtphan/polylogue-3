@AGENTS.md

# CrossCheck App — Claude Code Reference

## What This Is

CrossCheck serves AI-generated presentations and discussions (from the Polylogue 3 pipeline) to students, teachers, and researchers for evaluating critical thinking flaws. Built for the University Middle School (UMS) in Memphis.

## Tech Stack

- **Next.js 16.2.1** (App Router only). `params` and `searchParams` are Promises — must `await`. Middleware is `proxy.ts` not `middleware.ts`.
- **Prisma 6.19** — Client generated to `src/generated/prisma/client`. Import from `../src/generated/prisma/client` in scripts.
- **NextAuth v5 beta** — JWT strategy, credentials provider. All users log in by display name (case-insensitive). Single `findFirst` by `displayName` with mode `insensitive`. Students need no password; teachers/researchers require password.
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
- **Matching engine** (`src/lib/matching.ts`): 3-pass algorithm (green exact → blue wrong-type → red unmatched). Supports `{ locationOnly: true }` for Locate mode and Classify detect-only sub-mode.
- **Practice modes**: 4 session modes ordered by independence gradient: Recognize → Locate → Classify → Explain. Learn is a standalone page (not a session mode). Each mode has 1 granularity knob stored in `group.config` JSONB. Mode values: `"recognize"`, `"locate"`, `"classify"`, `"explain"`. Defined in `src/lib/types.ts`.
- **Dual annotation model**: `/api/annotations` creates solo session/group per user (Phase 1 individual practice). `/api/annotations/session` uses real session groups with membership + phase validation.
- **Group consensus**: `PATCH /api/annotations/[id]` with `{ action: "confirm" | "unconfirm" }`. Threshold: 2 confirmations. `isGroupAnswer` and `confirmedBy` fields.
- **Cascading deletes**: All child relations have `onDelete: Cascade`. Session delete is a single `prisma.session.delete()`.
- **Data model hierarchy**: Teacher → Classes → Sessions → Groups. `Class` and `ClassStudent` models manage rosters. `Session.classId` is nullable (null for solo practice, required for teacher-created sessions).
- **Teacher nav**: `Classes | Transcripts | Guide`. "Transcripts" was formerly "Activities".
- **Teacher routes**: `/teacher` shows class grid. `/teacher/classes/new` creates a class. `/teacher/classes/[classId]` shows class detail (roster + sessions). `/teacher/classes/[classId]/sessions/new` creates a session scoped to a class. `/teacher/sessions/[id]` is the session dashboard.

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
npm run db:reset    # migrate reset + seed from seed.yaml + ingest registry activities
```

Seed data is configured in `seed.yaml` at the app root. Contains teacher/researcher names + passwords. No students (teachers add those via UI). Test accounts: Ms. Johnson / teacher123, Mr. Davis / teacher123, Dr. Chen / researcher123.

## API Routes

- `GET/POST /api/classes` — list / create classes
- `GET/PATCH/DELETE /api/classes/[id]` — class detail / update / delete
- `POST/DELETE /api/classes/[id]/students` — add / remove students from a class
- `POST /api/sessions` — create session (accepts `classId`)
- `POST /api/users` — create user (only needs `displayName`, username auto-derived)
