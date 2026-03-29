# CrossCheck

**Evaluate AI team presentations and discussions.**

CrossCheck is a web app that serves AI-generated presentations and discussions (from the Polylogue 3 pipeline) to three user roles — students, teachers, and researchers — for evaluating critical thinking flaws in a middle school PBL classroom at the University Middle School (UMS) in Memphis.

---

## Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** running locally

---

## Installation

```bash
# 1. Clone the repo and navigate to the app
cd CrossCheck/app

# 2. Install dependencies
npm install

# 3. Create the database
createdb crosscheck

# 4. Configure environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
#   DATABASE_URL="postgresql://YOUR_USER@localhost:5432/crosscheck"

# 5. Run migrations and generate the Prisma client
npx prisma migrate dev

# 6. Generate the Prisma client (if not done by migrate)
npx prisma generate

# 7. Seed test users and ingest sample activities
npm run db:reset
```

> `npm run db:reset` runs `prisma migrate reset`, seeds users/classes from `seed.yaml`, and ingests activities from the registry. It is destructive — it drops and recreates all tables.

---

## Running

```bash
npm run dev          # Custom server with Socket.IO (real-time)
# Visit http://localhost:3000
```

For development without Socket.IO (faster restarts, no real-time):

```bash
npm run dev:next
```

---

## Test Accounts

Defined in `seed.yaml`. After `npm run db:reset`:

| Role | Name | Password |
|------|------|----------|
| Teacher | Ms. Johnson | `teacher123` |
| Teacher | Mr. Davis | `teacher123` |
| Researcher | Dr. Chen | `researcher123` |
| Students | (see seed.yaml) | none — name only |

Students log in by entering their display name. Teachers and researchers require a password.

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
├── docs/                           # Design reference documents
└── app/                            # Next.js application
    ├── server.ts                   # Custom server (Socket.IO + Next.js)
    ├── seed.yaml                   # Test users, classes, student rosters
    ├── prisma/
    │   └── schema.prisma           # Database schema
    ├── scripts/
    │   ├── seed-users.ts           # Create test accounts from seed.yaml
    │   ├── ingest-registry.ts      # Parse YAML activities → database
    │   └── db-reset.ts             # Full reset (migrate + seed + ingest)
    └── src/
        ├── app/
        │   ├── api/                # REST endpoints
        │   ├── auth/login/         # Login page
        │   ├── student/            # Student views
        │   ├── teacher/            # Teacher views
        │   └── researcher/         # Researcher views
        ├── components/
        │   ├── stages/             # RecognizeStage, ExplainStage, etc.
        │   ├── feedback/           # FeedbackView
        │   └── transcript/         # PresentationView, DiscussionView
        ├── hooks/                  # useSocket, useSessionSocket, etc.
        └── lib/
            ├── auth.ts             # NextAuth config
            ├── db.ts               # Prisma singleton
            ├── matching.ts         # 3-pass annotation matching engine
            ├── socket-server.ts    # Server-side IO singleton
            ├── socket-client.ts    # Client-side socket singleton
            └── types.ts            # Shared types and constants
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
| `npm run db:reset` | Drop all tables, re-migrate, seed users, ingest activities |

---

## Database

PostgreSQL on `localhost:5432`, database `crosscheck`.

### Common Commands

```bash
npx prisma migrate dev      # Apply pending migrations + regenerate client
npx prisma generate         # Regenerate Prisma client (after schema changes)
npm run db:reset             # Full destructive reset (drop → migrate → seed → ingest)
```

### Manual Seeding (without full reset)

```bash
npx tsx scripts/seed-users.ts          # Seed users/classes from seed.yaml
npx tsx scripts/ingest-registry.ts --all  # Ingest YAML activities from registry/
```

All child relations use `onDelete: Cascade` — deleting a session cascades to all its data.

---

## Auth Model

- **Students:** Enter their name to log in. No password.
- **Teachers/Researchers:** Name + password.
- JWT strategy (stateless). Roles: `student`, `teacher`, `researcher`.
- Route protection via `proxy.ts` middleware + per-route auth checks.
- Socket.IO auth: JWT decoded from httpOnly cookies during WebSocket handshake.
