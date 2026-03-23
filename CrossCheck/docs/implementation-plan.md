# CrossCheck — Implementation Plan

## Status

**Current phase:** Phase 2 — Teacher Core (in progress)
**Next action:** Session management + live dashboard + scaffold sending
**Blocked by:** Nothing
**Environment:** macOS, Node 23.11.0, npm 11.3.0, Next.js 16.2.1, Prisma 6.19.2, PostgreSQL 15.13

---

## Phase 0: Foundation

Goal: A running app that ingests YAML from `registry/`, authenticates users by role, and serves a skeleton page per role. No real UI yet — just the plumbing.

### 0a. Install PostgreSQL

- Install via Homebrew: `brew install postgresql@17`
- Start service: `brew services start postgresql@17`
- Create database: `createdb crosscheck`
- Create dev user or use default `postgres` role

### 0b. Initialize Next.js Project

Location: `CrossCheck/app/`

```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
```

Choices:
- App Router (not Pages Router) — role-based layouts map cleanly to route groups
- `src/` directory — keeps config files at root, source code nested
- npm (not yarn/pnpm) — simplest, already installed

**Files created by this step:**
```
CrossCheck/app/
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout
│       ├── page.tsx          # Landing / redirect to login
│       └── globals.css       # Tailwind base styles
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

### 0c. Prisma + Database Schema

Install: `npm install prisma @prisma/client` then `npx prisma init`

**Schema file:** `CrossCheck/app/prisma/schema.prisma`

Tables to define:

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| username | String | Unique, used for login |
| password_hash | String | bcrypt hash |
| display_name | String | Shown in UI (real name for teacher view, can be alias) |
| role | Enum (student, teacher, researcher) | |
| research_consent | Boolean | Default false, set by teacher |
| created_by | UUID? | FK to users (teacher who created this student) |
| created_at | DateTime | |

**activities**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| scenario_id | String | Unique, from YAML (e.g., "plastic-pollution-mississippi-river") |
| type | Enum (presentation, discussion) | |
| topic | String | Driving question |
| agents | JSONB | Array of {agent_id, name, role} |
| transcript | JSONB | Full transcript with metadata (sections or turns) |
| transcript_content | JSONB | Content only — metadata stripped. What students see. |
| evaluation | JSONB | Full evaluation with all flaws |
| flaw_index | JSONB | Denormalized array for annotation matching: [{flaw_id, locations, flaw_type, severity}] |
| metadata | JSONB | Scenario design + agent profiles (researcher only) |
| created_at | DateTime | |

**sessions**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| teacher_id | UUID | FK to users |
| activity_id | UUID | FK to activities |
| status | Enum (setup, active, individual, group, reviewing, closed) | Tracks session phase |
| config | JSONB | {difficulty_mode, phase_timer, etc.} |
| created_at | DateTime | |
| closed_at | DateTime? | |

**groups**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| session_id | UUID | FK to sessions |
| name | String | e.g., "Group A" |

**group_members**
| Column | Type | Notes |
|--------|------|-------|
| group_id | UUID | FK to groups |
| user_id | UUID | FK to users |
| (composite PK) | | |

**annotations**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| group_id | UUID | FK to groups |
| user_id | UUID | FK to users (who created it) |
| location | JSONB | {section_id or turn_id, start_offset, end_offset, highlighted_text} |
| flaw_type | Enum (reasoning, epistemic, completeness, coherence) | |
| severity | Enum (minor, moderate, major)? | Nullable — only used in Full mode |
| explanation | Text? | Nullable — only used in Full mode |
| is_group_answer | Boolean | Default false. True = finalized by group consensus. |
| confirmed_by | JSONB | Array of user_ids who confirmed (for group answers) |
| created_at | DateTime | |

**scaffolds**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| session_id | UUID | FK to sessions |
| group_id | UUID | FK to groups |
| teacher_id | UUID | FK to users |
| level | Int | 1-6 scaffold intensity |
| type | String | attention_redirect, comparison_prompt, category_nudge, question_prompt, flaw_type_hint, metacognitive_prompt |
| text | Text | The scaffold message |
| target_location | JSONB? | {references: [section_ids/turn_ids]} or null for general scaffolds |
| context_at_send | JSONB | {annotations_count, sections_touched, time_in_session_minutes} |
| outcome | JSONB? | Null in v1. Populated by post-session analysis in v2. |
| created_at | DateTime | |
| delivered_at | DateTime? | Null until student device receives it |
| acknowledged_at | DateTime? | Null until student taps acknowledge |

**session_events**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| session_id | UUID | FK to sessions |
| event_type | String | phase_changed, scaffold_sent, annotation_created, feedback_released, etc. |
| actor_id | UUID? | FK to users (who triggered the event) |
| payload | JSONB | Event-specific data |
| created_at | DateTime | |

**Indexes to add:**
- `annotations(group_id, created_at)` — fast lookup for teacher dashboard
- `annotations(group_id, is_group_answer)` — fast lookup for feedback matching
- `scaffolds(session_id, group_id)` — scaffold history per group
- `session_events(session_id, created_at)` — event timeline
- `activities(scenario_id)` — unique, lookup by scenario name

### 0d. YAML Ingestion Script

Location: `CrossCheck/app/scripts/ingest-registry.ts`

**Input:** A scenario_id (e.g., `plastic-pollution-mississippi-river`)

**Process:**

1. Read `registry/{scenario_id}/config.yaml` — extract activity type, agents
2. Read transcript file:
   - If presentation: `registry/{scenario_id}/presentation.yaml`
   - If discussion: `registry/{scenario_id}/discussion.yaml`
3. Build `transcript_content` by deep-cloning transcript and stripping `metadata` from each section/turn
4. Read evaluation file:
   - `registry/{scenario_id}/presentation_evaluation.yaml` or `discussion_evaluation.yaml`
5. Build `flaw_index` from evaluation flaws:
   ```json
   [
     {"flaw_id": "flaw_001", "locations": ["section_01"], "flaw_type": "reasoning", "severity": "major"},
     ...
   ]
   ```
6. Read scenario YAML: `configs/scenarios/{scenario_id}.yaml`
7. Read all profile YAMLs: `configs/profiles/{scenario_id}/*.yaml`
8. Combine scenario + profiles into `metadata` JSONB
9. Upsert into `activities` table (idempotent by scenario_id)
10. Report: activity created, N flaws indexed, N sections/turns parsed

**Dependencies:** `js-yaml`, `@prisma/client`

**Usage:** `npx ts-node scripts/ingest-registry.ts --scenario plastic-pollution-mississippi-river`

Or ingest all: `npx ts-node scripts/ingest-registry.ts --all`

### 0e. NextAuth Setup

Install: `npm install next-auth bcryptjs` + `npm install -D @types/bcryptjs`

**Auth configuration:** `CrossCheck/app/src/lib/auth.ts`

- Credentials provider: username + password
- Session strategy: JWT (stateless, no session table needed)
- JWT contains: user_id, role, display_name
- Login page: `/auth/login`

**Middleware:** `CrossCheck/app/src/middleware.ts`

Route protection:
- `/student/*` → requires role = student
- `/teacher/*` → requires role = teacher
- `/researcher/*` → requires role = researcher
- `/api/*` → role checked per endpoint
- `/auth/*` → public

**Seed script:** Create an initial teacher account for development:
```
username: teacher1
password: (set via env var or CLI prompt)
role: teacher
```

Teachers create student accounts through the app. For Phase 0, a seed script creates test accounts.

### 0f. Role-Based Route Shells

Create skeleton layouts that confirm auth and routing work:

```
src/app/
├── auth/
│   └── login/
│       └── page.tsx          # Login form
├── student/
│   ├── layout.tsx            # Student layout (nav, session context)
│   └── page.tsx              # Student home: "Your assigned activities"
├── teacher/
│   ├── layout.tsx            # Teacher layout (nav, dashboard link)
│   └── page.tsx              # Teacher home: "Your sessions"
└── researcher/
    ├── layout.tsx            # Researcher layout
    └── page.tsx              # Researcher home: "Activity library" (v2, placeholder for now)
```

Each page just shows:
- The user's display name and role
- A placeholder message ("Student dashboard coming in Phase 1")
- A logout button

This confirms the full auth → role → routing pipeline works end to end.

### Phase 0 Verification Checklist

- [x] PostgreSQL running, `crosscheck` database created
- [x] Next.js dev server starts (`npm run dev`)
- [x] Prisma migrations applied, all tables exist
- [x] Ingestion script imports both existing scenarios (plastic-pollution, urban-heat-islands)
- [x] Can log in as teacher, student, researcher with test accounts
- [x] Each role sees their own layout at the correct URL
- [x] Accessing `/teacher` as a student redirects (307)
- [x] Database contains 2 activities with transcript, evaluation, flaw_index, and metadata

---

## Phase 1: Student Core

Goal: A student can view a transcript (presentation or discussion), highlight passages, classify them by flaw type, and submit their annotations. No sessions or groups yet — students access activities directly. Group/session context comes in Phase 2.

### 1a. Activity API Routes

**`GET /api/activities`** — List available activities (student view: id, scenario_id, type, topic, agents only).

**`GET /api/activities/[id]`** — Single activity. Returns `transcript_content` (metadata-stripped) for students. Teachers/researchers get full `transcript`.

### 1b. Student Activity List Page

**`/student`** — Shows cards for all available activities. Each card: topic, activity type badge (presentation/discussion), agent names.

### 1c. Transcript Renderer

**`/student/activity/[id]`** — The core page.

Shared `<TranscriptRenderer>` component that handles both types:
- **Presentation**: Sections displayed as cards, one per section. Section label + speaker name + role + content.
- **Discussion**: Turns displayed as chat bubbles, grouped by stage. Speaker name + role + stage badge + content.

Agent avatars: colored circle with initials, consistent per agent (derived from agent_id hash).

### 1d. Text Selection & Annotation

When student selects text in the transcript:
1. A floating toolbar appears near the selection
2. Toolbar shows 4 flaw type buttons (color-coded): Reasoning, Epistemic, Completeness, Coherence
3. Student taps one → annotation is created and persisted
4. Highlighted text remains visible with a colored underline matching the flaw type

Annotation stored as: `{ section_id/turn_id, start_offset, end_offset, highlighted_text, flaw_type }`

### 1e. Flaw Palette Sidebar

Fixed sidebar showing:
- The 4 flaw types with colors, names, and one-line middle-school-friendly definitions
- Count of annotations per type the student has made
- List of their annotations (click to scroll to that location in transcript)

### 1f. Annotation API

**`POST /api/annotations`** — Create annotation. Body: `{ activity_id, location, flaw_type }`. For Phase 1, `group_id` is a placeholder (no groups yet).

**`GET /api/annotations?activity_id=X`** — Get current user's annotations for an activity.

**`DELETE /api/annotations/[id]`** — Remove an annotation.

### 1g. Submit & Review

Submit button locks annotations (no further edits). For Phase 1, the feedback comparison view (side-by-side with reference evaluation) is deferred to Phase 4. Submit just saves a "submitted" state.

### Phase 1 Verification Checklist

- [ ] Student sees activity list with both scenarios
- [ ] Clicking an activity shows the full transcript (presentation sections or discussion turns)
- [ ] Can select text and tag it with a flaw type
- [ ] Annotations persist across page reloads
- [ ] Can delete an annotation
- [ ] Flaw palette shows annotation counts and list
- [ ] Presentation and discussion renderers both work correctly
- [ ] No metadata (knowledge areas, rationale) visible to students

---

## Phase 2-5: Not Yet Detailed

Will be expanded one phase at a time. See `app-concept.md` for the high-level breakdown.

---

## Decisions Log

Decisions made during implementation that aren't covered in `app-concept.md`.

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2026-03-23 | Used Prisma 6 with `prisma-client` generator (output to `src/generated/prisma`) | Default for Prisma 6.19. Import path is `../src/generated/prisma/client` from scripts, `../generated/prisma/client` from src. |
| 2026-03-23 | Used Next.js 16 `proxy.ts` instead of `middleware.ts` | `middleware.ts` is deprecated in Next.js 16. Function renamed from `middleware()` to `proxy()`. |
| 2026-03-23 | Kept existing PostgreSQL 15 instead of switching to 17 | Already had PG 15 running. Both work fine for development. |
| 2026-03-23 | NextAuth v5 beta (Auth.js) | Latest version with App Router support. JWT strategy, credentials provider. |
| 2026-03-23 | `params` and `searchParams` are Promises in Next.js 16 | Must `await` them in page/layout components. Used `async` server components throughout. |
