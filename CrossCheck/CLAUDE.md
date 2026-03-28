# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

CrossCheck is a Next.js web app that serves AI-generated presentations and discussions (from the Polylogue 3 pipeline) to students, teachers, and researchers for evaluating critical thinking flaws. Built for University Middle School (UMS) in Memphis.

## Commands

All commands run from `CrossCheck/app/`:

```bash
npm run dev          # Custom server with Socket.IO (tsx watch server.ts)
npm run dev:next     # Plain Next.js without Socket.IO (fallback)
npm run build        # Production build
npm run lint         # ESLint
npm run db:reset     # Drop all tables, re-migrate, seed users, ingest activities
```

Database management:
```bash
npx prisma migrate dev              # Apply pending migrations
npx prisma generate                 # Regenerate Prisma client
npx prisma migrate reset --force    # Full reset (destructive)
npx tsx scripts/seed-users.ts       # Seed teacher/researcher accounts from seed.yaml
npx tsx scripts/ingest-registry.ts --all  # Ingest YAML activities from registry/
```

Prerequisites: Node.js 20+, PostgreSQL 15+ with database `crosscheck` on localhost:5432. Copy `.env.example` to `.env`.

## Tech Stack

- **Next.js 16.2.1** (App Router). `params` and `searchParams` are Promises — must `await`.
- **Prisma 6.19** — Client generated to `src/generated/prisma/client`. Scripts import from `../src/generated/prisma/client`.
- **NextAuth v5 beta** — JWT strategy, credentials provider. Login by display name (case-insensitive `findFirst`). Students need no password.
- **Socket.IO 4** — Custom server in `server.ts`. Auth via httpOnly cookie JWT decoding.
- **Tailwind CSS 4** — PostCSS plugin (`@tailwindcss/postcss`).
- **React 19** with TypeScript.

## Architecture

### Custom Server (`server.ts`)
Wraps Next.js + Socket.IO on the same port. `getIO()` singleton in `src/lib/socket-server.ts` lets API routes emit real-time events. Middleware is `src/proxy.ts` (not the default `middleware.ts`).

### Three User Roles
- **Student** (`/student/*`): Read transcripts, annotate flaws, receive scaffolds, view feedback
- **Teacher** (`/teacher/*`): Create sessions, manage classes/groups, live dashboard, send scaffolds
- **Researcher** (`/researcher/*`): Full pipeline view, session browser, CSV exports

### Session Flow
Sessions use a three-stage progression per group: **Recognize → Explain → Locate → Results**. Stage is stored on `Group.stage` (not session-level). Each group also has independent learning phases: `individual → group → reviewing`. Teachers advance phases/stages per group.

### Annotation Matching Engine (`src/lib/matching.ts`)
3-pass algorithm comparing student annotations to reference evaluation: green (exact match) → blue (wrong flaw type) → red (unmatched false positive).

### Data Flow
Activities are ingested from Polylogue 3 registry YAML files into PostgreSQL. Teachers create sessions around activities. Students create annotations within groups. Real-time updates via Socket.IO rooms (`session:{id}`, `group:{id}`).

### Key Socket.IO Events
`annotation:created/deleted/confirmed`, `scaffold:sent/acknowledged`, `group:phase_changed/ready_changed`, `group:stage_changed`. Room joins are DB-validated (teacher ownership / student group membership).

### Dual Annotation Model
- `/api/annotations` — solo practice (creates solo session/group per user)
- `/api/annotations/session` — real session groups with membership + phase validation

### Cascading Deletes
All child relations use `onDelete: Cascade`. Session delete is a single `prisma.session.delete()`.

## Data Model Hierarchy

Teacher → Classes → Sessions → Groups → (Members, Annotations, FlawResponses, Scaffolds, HintUsages, Explanations)

`Session.classId` is nullable (null for solo practice, required for teacher-created sessions).

## Test Accounts

Defined in `seed.yaml`. After `npm run db:reset` or `npx tsx scripts/seed-users.ts`:
- Ms. Johnson / teacher123
- Mr. Davis / teacher123
- Dr. Chen / researcher123
- Students: created via teacher UI (name only, no password)

## Important Patterns

- Flaw types: `reasoning`, `epistemic`, `completeness`, `coherence` (defined in `src/lib/types.ts`)
- Text selection uses `data-seg-start`/`data-seg-end` attributes on spans with overlap rejection in `annotatable-text.tsx`
- `useSelectionClear` hook clears stale pending annotation state
- Group consensus: 2 confirmations via `confirmedBy` array → `isGroupAnswer = true`
- Hint system: per-stage delays and progressive reveal (Recognize: eliminate choices; Explain: reveal type/template; Locate: confirm section/turn/type)
- Legacy mode types (`DifficultyMode`, `SessionMode`) still exist in `types.ts` for old sessions; new sessions use `SessionStage`

## AGENTS.md Note

`app/CLAUDE.md` redirects to `app/AGENTS.md` which contains additional detail on API routes, socket events, and session lifecycle. Read that file for comprehensive API-level reference.
