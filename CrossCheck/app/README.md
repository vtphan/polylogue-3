# CrossCheck

**Evaluate AI team presentations and discussions.**

CrossCheck is a web app that serves AI-generated presentations and discussions (from the Polylogue 3 pipeline) to three user roles — students, teachers, and researchers — for evaluating critical thinking flaws in a middle school PBL classroom at the University Middle School (UMS) in Memphis.

---

## Quick Start

```bash
cd CrossCheck/app
npm install
npm run dev          # Custom server with Socket.IO (real-time)
# Visit http://localhost:3000
```

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally
- Database `crosscheck` created: `createdb crosscheck`

### First-time Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env with DATABASE_URL and NEXTAUTH_SECRET
#    See .env for the expected format

# 3. Run migrations
npx prisma migrate dev

# 4. Seed test users
npx tsx scripts/seed-users.ts

# 5. Ingest sample activities from registry
npx tsx scripts/ingest-registry.ts --all

# 6. Start the app
npm run dev
```

### Test Accounts

| Role | Name | Login |
|------|------|-------|
| Teacher | Ms. Johnson | `teacher1` + password `teacher123` |
| Student | Alex, Jordan, Sam, Taylor | Enter name only (no password) |
| Researcher | Dr. Chen | `researcher1` + password `researcher123` |

Students log in by entering their name — no password needed. Teachers and researchers require a password.

---

## What It Does

Teachers set up sessions around AI-generated content. Student groups read the content and annotate critical thinking flaws (reasoning, epistemic, completeness, coherence). Teachers monitor progress in real time, send scaffolds, and control session phases. After review, students see how their annotations compare to a reference evaluation.

### Classroom Flow

```
Teacher creates session → assigns groups → starts Individual phase
  Students annotate independently on their devices
Teacher advances to Group phase
  Students see each other's work, discuss physically, vote on group answers
Teacher releases evaluation (Reviewing phase)
  Students see feedback: green (correct), blue (wrong type), red (false positive)
```

### Three Roles

| Role | What They See |
|------|---------------|
| **Student** | Transcript content, annotation tools, scaffolds from teacher, feedback after review |
| **Teacher** | Live dashboard, annotation feed, connection status, evaluation answer key, scaffold tools |
| **Researcher** | Full pipeline (scenario → profiles → transcript → evaluation), session data, CSV exports |

---

## Features

### Student
- Read AI presentations (section-by-section) or discussions (chat-style turns)
- Highlight text and classify by flaw type (reasoning, epistemic, completeness, coherence)
- Three difficulty modes: Spot (highlight only), Classify (highlight + type), Full (+ severity + explanation)
- Receive scaffolds from teacher in real time
- Group consensus: confirm/reject annotations, 2+ votes = group answer
- Feedback view: side-by-side comparison with reference evaluation
- Progress dashboard: cross-session detection rates and per-type trends

### Teacher
- Create sessions, assign groups, manage students
- Live dashboard with real-time annotation feed and connection status
- Send scaffolds (6 levels, 12 pre-loaded templates, or free text)
- View evaluation answer key at any phase
- Annotations overlaid on transcript in group detail
- Session notes (auto-save on blur)
- Class projector view for whole-class debrief
- Bulk student creation (one name per line)
- Session delete (setup/closed phases only)
- Teacher comments on individual annotations (bonus find flags)
- Phase controls: Individual → Group → Reviewing → Closed (reopen supported)

### Researcher
- Full pipeline view: scenario, agent profiles, transcript with metadata, evaluation
- Session browser: all sessions across teachers with anonymized student data
- CSV exports: annotations, scaffolds, sessions (filtered by research consent)

### Real-time (Socket.IO)
- Live annotation feed on teacher dashboard
- Scaffold delivery to student devices
- Phase transition notifications
- Group connection status (green/orange/gray dots)
- Authorized room joins (DB membership verified)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Next.js API Routes + Custom Server |
| Real-time | Socket.IO 4 |
| Database | PostgreSQL 15 + Prisma 6 |
| Auth | NextAuth v5 (JWT, credentials provider) |

Single deployable unit. Self-hosted on a University of Memphis server. No external cloud dependencies.

---

## Project Structure

```
CrossCheck/
├── docs/
│   ├── app-concept.md         # Full concept document (design reference)
│   ├── implementation-plan.md  # Phase-by-phase implementation log
│   └── improvement-plan.md     # Post-v1 improvement tiers
└── app/                        # Next.js application
    ├── server.ts               # Custom server (Socket.IO + Next.js)
    ├── prisma/
    │   └── schema.prisma       # Database schema (8 models)
    ├── scripts/
    │   ├── seed-users.ts       # Create test accounts
    │   └── ingest-registry.ts  # Parse YAML → database
    └── src/
        ├── app/
        │   ├── api/            # REST endpoints
        │   ├── auth/login/     # Login page
        │   ├── student/        # Student views
        │   ├── teacher/        # Teacher views
        │   └── researcher/     # Researcher views
        ├── components/
        │   ├── annotation/     # FlawBottomBar, FlawPalette
        │   ├── evaluation/     # EvaluationPanel
        │   ├── feedback/       # FeedbackView (tabbed)
        │   └── transcript/     # PresentationView, DiscussionView, AnnotatableText
        ├── hooks/
        │   ├── useSocket.ts        # Socket.IO connection + room join
        │   ├── useSessionSocket.ts # Session-specific event handlers
        │   └── useSelectionClear.ts
        └── lib/
            ├── auth.ts             # NextAuth config (name-only for students)
            ├── db.ts               # Prisma singleton
            ├── matching.ts         # 3-pass annotation matching engine
            ├── socket-server.ts    # Server-side IO singleton
            ├── socket-client.ts    # Client-side socket singleton
            ├── scaffold-templates.ts
            ├── agent-colors.ts
            └── types.ts
```

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start custom server with Socket.IO (development) |
| `npm run dev:next` | Start plain Next.js without Socket.IO (fallback) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Database

PostgreSQL on `localhost:5432`, database `crosscheck`.

To reset and re-seed:
```bash
npx prisma migrate reset    # WARNING: drops all data
npx tsx scripts/seed-users.ts
npx tsx scripts/ingest-registry.ts --all
```

### Schema (8 models)

`User` → `Session` → `Group` → `GroupMember`, `Annotation` (→ `AnnotationComment`), `Scaffold`, `SessionEvent`

All child relations use `onDelete: Cascade` — deleting a session cascades to all its data.

---

## Auth Model

- **Students:** Enter their name to log in. No password.
- **Teachers/Researchers:** Name + password.
- JWT strategy (stateless). Roles: `student`, `teacher`, `researcher`.
- Route protection via `proxy.ts` middleware + per-route auth checks.
- Socket.IO auth: JWT decoded from httpOnly cookies during WebSocket handshake.
