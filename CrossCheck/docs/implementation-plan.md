# CrossCheck — Implementation Plan

## Status

**All phases complete. All improvement tiers (1-3) complete. Code review fixes applied.**

| Phase | Status |
|-------|--------|
| Phase 0: Foundation | Complete |
| Phase 1: Student Core | Complete |
| Phase 2: Teacher Core | Complete |
| Phase 3: Real-time (Socket.IO) | Complete |
| Phase 4: Feedback Loop | Complete |
| Phase 5: Teacher Tools | Complete |
| Phase 6: Researcher | Complete |
| Tier 1: Classroom Readiness | Complete |
| Tier 2: Quality-of-Life | Complete |
| Tier 3: Learning Enhancements | Complete |
| Code Review Fixes | Complete (auth simplification, security fixes, data integrity, client fixes) |

**Next action:** Manual classroom testing, then Tier 4 improvements (see improvement-plan.md).
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
| display_name | String | Unique per role, used for login (e.g., "Ms. Johnson" for teachers, "Maya" for students) |
| password_hash | String? | bcrypt hash. Nullable — students log in by name only, teachers/researchers require password |
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
| class_id | UUID | FK to classes |
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

**Database reset:** `npm run db:reset` — single command that drops/recreates the database, runs migrations, and seeds test data.

**Seed data:** Configured via `seed.yaml`. Test accounts:
- Ms. Johnson / teacher123 (teacher)
- Mr. Davis / teacher123 (teacher)
- Dr. Chen / researcher123 (researcher)
- No pre-seeded students — teachers create students within classes.

All users log in by display name. Teachers and researchers require a password; students do not.

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

Fixed bottom bar always visible at the bottom of the screen with 4 flaw type buttons (color-coded) + Undo + annotation count.

When student selects text in the transcript:
1. Browser highlight stays visible (selection not cleared)
2. Bottom bar buttons activate (grayed out → colored)
3. Student taps a flaw type button → annotation is created and persisted
4. Annotated text renders with a colored underline matching the flaw type
5. Undo button removes the most recent annotation

**Offset calculation:** Each text `<span>` carries `data-seg-start`/`data-seg-end` attributes. On selection, the system finds the parent segment span, reads its offset, and adds the character position within the span. This avoids DOM-to-string mapping issues with TreeWalker or Range.toString().

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

## Phase 2: Teacher Core

Goal: A teacher can create a session, assign students to groups, monitor annotation progress in real time, send scaffolds to groups, and release the reference evaluation. This replaces the Phase 1 solo-session scaffolding with real sessions.

### 2a. Session Management APIs

**`POST /api/sessions`** — Create session. Body: `{ classId, activityId, groups: [{name, studentIds}] }`. Creates session + groups + group members. Students in groups must belong to the class roster.

**`GET /api/sessions`** — List teacher's sessions with status and activity info.

**`GET /api/sessions/[id]`** — Session detail: groups, members, annotation counts, status.

**`PATCH /api/sessions/[id]`** — Update session status (setup → active → individual → group → reviewing → closed).

### 2b. Teacher Session List Page

**`/teacher`** — Shows session cards (active sessions first) and a "New Session" button. Each card: activity topic, status badge, group count, created date.

### 2c. Create Session Page

**`/teacher/classes/[classId]/sessions/new`** — Pick an activity from the library, create groups, assign students from the class roster. Simple form: activity dropdown, group name + student multi-select for each group.

### 2d. Live Dashboard

**`/teacher/sessions/[id]`** — The core teacher screen during class.

**Group overview grid:** Each group shows:
- Group name
- Annotation count (total and by flaw type)
- Sections/turns touched (progress bar)
- Status indicator (based on recent activity)

**Group detail panel:** Click a group to see:
- Their annotations overlaid on the transcript (read-only view reusing TranscriptRenderer)
- What they've found vs. what they've missed (compared to flaw_index)

**Session controls:**
- Phase transition buttons (Individual → Group → Reviewing)
- Release evaluation button

### 2e. Scaffold Sending

**`POST /api/scaffolds`** — Create scaffold. Body: `{ sessionId, groupId, level, type, text, targetLocation? }`.

**`GET /api/scaffolds?session_id=X&group_id=Y`** — Scaffolds sent to a group.

On the dashboard, each group card has a "Send scaffold" button that opens a form (free text + optional target section/turn).

### 2f. Student Session Integration

Update student flow to work with real sessions:
- **`/student`** — Shows sessions the student is assigned to (not raw activities)
- **`/student/session/[id]`** — Activity viewer within a session context, using the real group
- Student sees scaffolds sent by teacher (notification card at top)
- Scaffold acknowledgment (`PATCH /api/scaffolds/[id]`)

### 2g. Evaluation Release

When teacher sets session status to "reviewing":
- Students see a read-only view of their annotations
- Reference evaluation becomes available via API
- Side-by-side comparison view (deferred to Phase 4 for full implementation, but basic reveal here)

### Phase 2 Verification Checklist

- [ ] Teacher can create a session with groups and assigned students
- [ ] Teacher sees session list with status badges
- [ ] Live dashboard shows annotation counts per group
- [ ] Teacher can click into a group to see their annotations on the transcript
- [ ] Teacher can send a scaffold to a group
- [ ] Student sees sessions they're assigned to
- [ ] Student can annotate within a session context (real group, not solo)
- [ ] Student sees scaffolds from teacher
- [ ] Teacher can transition session phases and release evaluation

---

## Phase 3: Real-time

Goal: Live updates via Socket.IO so teachers see student activity in real time and students receive scaffolds and phase transitions instantly.

### 3a. Custom Server + Socket.IO

**`server.ts`** — Custom Node.js server wrapping Next.js + Socket.IO on the same port (3000). Socket.IO auth middleware decodes the NextAuth JWT from httpOnly cookies. Room structure: `session:{id}` (teachers) + `group:{id}` (students).

**`src/lib/socket-server.ts`** — Singleton `getIO()` accessor using `globalThis` (survives hot-reloads). API routes call this to emit events after DB writes.

**`src/lib/socket-client.ts`** — Client-side singleton Socket.IO connection with auto-reconnection.

### 3b. Hooks

**`src/hooks/useSocket.ts`** — Base hook: connects, joins rooms, sends heartbeat every 30s.

**`src/hooks/useSessionSocket.ts`** — Higher-level hook with typed event handlers for all session events.

### 3c. Events

| Event | Emitted by | Rooms |
|-------|-----------|-------|
| `annotation:created` | `POST /api/annotations/session` | group + session |
| `annotation:deleted` | `DELETE /api/annotations/[id]` | group + session |
| `annotation:confirmed` | `PATCH /api/annotations/[id]` | group + session |
| `scaffold:sent` | `POST /api/scaffolds` | group + session |
| `scaffold:acknowledged` | `PATCH /api/scaffolds/[id]` | session |
| `session:phase_changed` | `PATCH /api/sessions/[id]` | session |
| `user:connected` / `user:disconnected` | Socket.IO connect/disconnect | session |
| `connection:roster` | On teacher join | Direct to socket |

### 3d. Teacher Dashboard Integration

- Live annotation feed (last 20 events with timestamp, group, flaw type, text)
- Group cards show connection status dots (green/orange/gray)
- Scaffold acknowledgments update in real time
- `router.refresh()` removed — Socket.IO events update local state directly

### 3e. Student View Integration

- Scaffolds appear immediately when teacher sends them
- Phase transition notifications with auto-refresh
- Other group members' annotations appear live in group phase
- Connection status indicator when disconnected

### 3f. Connection Tracking

In-memory `Map<socketId, ConnectedUser>` on the server. Teacher receives a roster on join, then incremental connect/disconnect events. Per-group status derived on the client: active (all connected) / partial (some) / disconnected (none).

### Phase 3 Verification Checklist

- [x] Custom server starts with Socket.IO attached
- [x] Auth middleware verifies NextAuth JWT from cookies
- [x] Room join/leave works for teachers and students
- [ ] Teacher sends scaffold → student sees it without refresh
- [ ] Student creates annotation → teacher dashboard updates live
- [ ] Teacher advances phase → students see notification
- [ ] Connection status dots reflect student connectivity
- [ ] Scaffold acknowledgment updates teacher dashboard

### Deferred (Phase 3b)

- **Offline annotation queue (IndexedDB):** Socket.IO handles brief drops automatically. HTTP fetch still works when WebSocket is down. Full IndexedDB queue deferred until classroom WiFi proves unreliable.
- **Idle detection:** Currently only active vs. disconnected. Adding idle (connected but no events in N minutes) requires polling `lastActivity` timestamps — low priority.

---

## Phase 4: Feedback Loop

Goal: When the teacher releases the evaluation (session status = "reviewing"), students see a side-by-side comparison of their annotations against the reference evaluation. This is the pedagogical payoff — where students learn what they found, missed, and misclassified.

### 4a. Annotation Matching Engine

Server-side function that compares group annotations against the activity's `flaw_index`.

**Matching rules** (from app-concept.md Design Clarifications):

| Match | Rule |
|-------|------|
| **Green (correct)** | Annotation in same section/turn as a reference flaw AND same flaw type |
| **Yellow (missed)** | Reference flaw with no matching annotation |
| **Red (false positive)** | Annotation at a location/type that doesn't match any reference flaw |
| **Blue (partial)** | Annotation in same section/turn as a reference flaw but different type |

Cross-section/cross-turn flaws: annotation matches if it tags **either** referenced location with the correct type.

**API:** `GET /api/sessions/[id]/feedback` — returns match results for each group. Only available when session status is "reviewing" or "closed".

### 4b. Student Feedback View

**`/student/session/[id]/feedback`** — or integrated into the existing session page when status = "reviewing".

Two panels:
- **Left: Their annotations on the transcript** — colored underlines as before, but now with match indicators (green check, red X, blue ~)
- **Right: Reference flaws** — list of all flaws from the evaluation, each showing: flaw type badge, severity, evidence quote, explanation. Matched flaws highlighted green, missed flaws highlighted yellow.

Summary stats at top:
- "Your group found X of Y flaws"
- Detection rate by flaw type
- Precision (correct / total annotations)

### 4c. Teacher Class View

On the teacher dashboard, when session is in "reviewing":
- Per-group match stats visible on group cards (found/missed/false positives)
- The existing group detail panel already shows flaws found vs missed — enhance with the full match breakdown

### 4d. Reference Evaluation API

**`GET /api/activities/[id]/evaluation`** — returns the full evaluation (flaws with descriptions, evidence, explanations). Only available to teachers and researchers, OR to students in a reviewing/closed session.

### Phase 4 Verification Checklist

- [ ] Matching engine correctly categorizes annotations as green/yellow/red/blue
- [ ] Cross-section flaws match when student tags either location
- [ ] Student sees feedback view when session is in reviewing phase
- [ ] Feedback view shows their annotations with match indicators
- [ ] Reference flaws listed with descriptions and evidence
- [ ] Summary stats (found/missed/precision) displayed
- [ ] Teacher dashboard shows match stats per group
- [ ] Evaluation API blocked for students outside reviewing sessions

---

## Phase 5: Polish

Goal: Make the app classroom-ready. Fix UX gaps, add teacher quality-of-life features, and support tablets.

### 5a. Mobile/Tablet Bottom Bar

The flaw palette sidebar is `hidden lg:block` — invisible on tablets. The bottom bar works on mobile but buttons may be cramped. Fix:
- Bottom bar: smaller padding, responsive button sizing
- Flaw palette: show as a collapsible panel above the bottom bar on mobile (tap to expand)

### 5b. Teacher Student Management

Teachers need to create student accounts (COPPA — no email signup). Add:
- **`/teacher/students`** — list all students the teacher has created
- **`/teacher/students/new`** — create student accounts (username + display name, auto-generate password)
- Show generated credentials so teacher can distribute to students

### 5c. Class Projector View

When session is in reviewing, teacher can project aggregate results for whole-class debrief:
- **`/teacher/sessions/[id]/class-view`** — full-screen, large text, designed for projection
- Shows: which flaws were found by most/fewest groups, which flaw types were hardest
- Bar chart or summary table of all groups' detection rates

### 5d. Practice Modes

Teacher-configurable per session:
- **Spot** — highlight only, no flaw type classification
- **Spot + Classify** — highlight + pick flaw type (current default)
- **Full** — highlight + classify + severity + explanation

Store in session.config, bottom bar adapts based on mode.

### 5e. Session Cleanup

- Delete session button (with confirmation)
- Reopen session (reviewing → group) for when teacher advances too early
- Clear all annotations for a group (teacher action)

### Phase 5 Verification Checklist

- [ ] Bottom bar usable on tablet-sized screens
- [ ] Teacher can create student accounts
- [ ] Class projector view shows aggregate results
- [ ] Practice modes change the bottom bar behavior
- [ ] Teacher can delete sessions and reopen reviewing sessions

---

## Phase 6: Researcher

Goal: Researchers can browse all activities with full metadata, view the pipeline (scenario → profiles → transcript → evaluation), examine session data (annotations, scaffolds, match results), and export datasets for external analysis.

### 6a. Researcher Activity Browser

**`/researcher`** — Browse all activities with full metadata visible:
- Scenario design (driving question, domain, agent sketches, expected flaws)
- Agent profiles (knowledge profiles, dispositions)
- Flaw index with type/severity distribution
- Link to full transcript (with metadata — knowledge areas, rationale)

### 6b. Researcher Pipeline View

**`/researcher/activity/[id]`** — Single activity with all layers:
- **Scenario tab**: scenario YAML data (design intent, expected flaws)
- **Profiles tab**: each agent's knowledge profile and disposition
- **Transcript tab**: full transcript with metadata visible (knowledge areas engaged, rationale, reactive tendency)
- **Evaluation tab**: all flaws with descriptions, evidence, explanations
- Knowledge-to-flaw tracing: click a flaw → see which agent's knowledge gap produced it

### 6c. Session Data Browser

**`/researcher/sessions`** — Browse all sessions across all teachers:
- Session status, activity, group count, annotation counts
- Per-group: annotations, match results, scaffold events
- Anonymized student IDs (display opaque IDs, not names)

### 6d. Data Export

**`GET /api/export/annotations?session_id=X`** — CSV/JSON export of annotations with match results
**`GET /api/export/scaffolds?session_id=X`** — CSV/JSON export of scaffold events with context
**`GET /api/export/sessions`** — CSV/JSON export of all session summaries

All exports anonymized (opaque student IDs, no names).

### Phase 6 Verification Checklist

- [ ] Researcher sees all activities with full metadata
- [ ] Pipeline view shows scenario, profiles, transcript with metadata, evaluation
- [ ] Session browser shows all sessions with anonymized student data
- [ ] Export endpoints return valid CSV/JSON
- [ ] Student names never appear in researcher views or exports

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
| 2026-03-23 | Text selection uses data-attribute offsets, not TreeWalker or Range.toString() | TreeWalker failed on cross-segment selections. Range.toString() had whitespace normalization mismatches. Each `<span>` gets `data-seg-start`; offset = segment start + position within span. |
| 2026-03-23 | Fixed bottom bar replaces floating toolbar for flaw type selection | Floating toolbar had positioning bugs (off-screen, instant dismissal from event bubbling). Bottom bar is always visible, includes Undo button. |
| 2026-03-23 | Browser selection not cleared on mouseUp | Keeps the blue highlight visible until user clicks a flaw type button. Selection clears naturally when annotation renders and replaces the text spans. |
| 2026-03-23 | Authorization fixes on 5 API endpoints | All endpoints now check ownership/membership, not just authentication. Session status checked on annotation delete. |
| 2026-03-23 | Dual annotation model: solo (Phase 1) vs session (Phase 2) | `/api/annotations` creates solo session/group per user. `/api/annotations/session` uses real session groups with membership validation. Solo mode preserved for independent practice. |
| 2026-03-24 | Socket.IO auth via httpOnly cookie parsing, not separate token endpoint | Browser sends cookies automatically during WebSocket handshake. Server parses `authjs.session-token` cookie and decodes with `@auth/core/jwt`. No extra API route needed. |
| 2026-03-24 | Custom server (`server.ts`) with `tsx watch` for dev | `tsx` was already a devDependency. `tsx watch` gives hot-reload on server changes. Next.js HMR still works because `next({ dev: true })`. |
| 2026-03-24 | In-memory connection tracking, not database | 30 concurrent users max. Map<socketId, ConnectedUser> is negligible memory. No persistence needed — connection state is ephemeral. |
| 2026-03-24 | Deferred IndexedDB offline queue | Socket.IO auto-reconnection handles brief drops. HTTP fetch for annotations still works when WebSocket is down. Classroom WiFi is reliable enough. |
| 2026-03-24 | Multiple teachers supported via session rooms | Teachers join `session:{id}` room. Each teacher sees all groups in sessions they own. Multiple teachers can monitor different sessions simultaneously. |
| 2026-03-24 | Name-only login for students, passwords removed | Classroom context: students in the same room with a teacher. No eavesdropping incentive. Students enter their name; teachers/researchers log in by display name (e.g., "Ms. Johnson") + password. Password reset feature deleted. |
| 2026-03-24 | `onDelete: Cascade` on all child relations | Simplifies session delete to a single `prisma.session.delete()`. Database enforces referential integrity automatically. |
| 2026-03-24 | Socket.IO room joins validated against DB | Prevents unauthorized room access. Teacher ownership and student group membership checked before `socket.join()`. Old rooms cleared on navigation. |
| 2026-03-24 | JWT salt set dynamically from cookie name | Cookie name differs between dev (`authjs.session-token`) and production HTTPS (`__Secure-authjs.session-token`). Salt must match for decode to work. |
| 2026-03-24 | Research consent enforced in exports | `researchConsent` field on User checked in export queries. Non-consenting students excluded from researcher CSV exports (IRB/COPPA requirement). |
| 2026-03-24 | Socket.IO `.except()` prevents double-delivery | Events emitted to `group:` room, then to `session:` room with `.except(group:)`. Students in both rooms receive once. Teachers in session room receive once. |
