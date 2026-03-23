# CrossCheck — App Concept Document

> **CrossCheck** — Evaluate AI team presentations and discussions

## Overview

CrossCheck is a web application that serves AI-generated presentations and discussions (produced by the Polylogue 3 pipeline) to three user roles — students, teachers, and researchers — with different views, permissions, and interaction models. The app supports a live classroom workflow where student groups evaluate AI discourse for critical thinking flaws, teachers facilitate and scaffold in real time, and researchers study the resulting data.

---

## Context

Polylogue 3 generates group presentations and discussions containing intentional critical thinking flaws. AI agents are constructed with specific knowledge gaps (misconceptions, shallow understanding, blind spots) that produce flaws naturally. The output — transcripts with hidden metadata — is stored in `registry/{scenario_id}/` as YAML files.

CrossCheck is the delivery and interaction layer. It takes the generated content and makes it usable in a classroom setting at the University Middle School (UMS) in Memphis, serving grades 6–8 in project-based learning (PBL).

---

## Data Model (from Polylogue 3)

CrossCheck consumes these generated artifacts:

| Artifact | Key Fields | Role Visibility |
|----------|-----------|-----------------|
| **Presentation transcript** | Sections (intro, approach, findings, solution, conclusion), each with speaker, content, knowledge areas engaged, rationale | Students see content only. Teachers see content + evaluation. Researchers see everything. |
| **Discussion transcript** | Turns with speaker, stage (opening_up, working_through, converging), content, knowledge areas, reactive tendency activation, rationale | Same visibility layers. |
| **Evaluation** | Flaws with type (reasoning, epistemic, completeness, coherence), source (knowledge-driven, interaction-driven), severity (minor, moderate, major), evidence quotes, explanations | Hidden from students until teacher releases. Full access for teachers and researchers. |
| **Scenario** | Driving question, domain, agent sketches, expected flaws, design notes | Teachers and researchers only. |
| **Agent profiles** | Knowledge profiles (strong, shallow, misconception, blind spot), disposition, expected flaws | Researchers only. |

---

## Classroom Usage Model

```
CLASSROOM (one session, ~45-60 min)

  Group A (4-5 students)    Group B (4-5 students)
  ┌─────────────────┐      ┌─────────────────┐
  │ Shared transcript│      │ Shared transcript│
  │ Annotating flaws │      │ Annotating flaws │
  │ Discussing aloud │      │ Discussing aloud │
  └─────────────────┘      └─────────────────┘

  Group C              Group D              ...
  ┌──────────┐        ┌──────────┐
  │ ...      │        │ ...      │
  └──────────┘        └──────────┘

              Teacher (circulating)
              ┌──────────────────┐
              │ Live dashboard   │
              │ Sends scaffolds  │
              │ Monitors progress│
              └──────────────────┘
```

Interactions are both **physical** (student discussion within each group, teacher walking between groups) and **digital** (student annotation in the app, teacher sending scaffolds via the app). The app creates conditions for productive physical discussion and then gets out of the way.

---

## Role 1: Student

### Core Experience

Read an AI-generated presentation or discussion, then identify critical thinking flaws — highlighting problematic passages and classifying them by type.

### Features

| Feature | Description |
|---------|-------------|
| **Browse activities** | See available presentations/discussions assigned by teacher. Topic, driving question, agent names visible. No metadata. |
| **Read transcript** | Presentation: step through sections one at a time. Discussion: scrollable chat-style thread grouped by stage. Agent names, roles, and avatars shown. |
| **Highlight & annotate** | Select text in any section/turn, tag with a flaw type, write optional brief explanation. Core learning activity. |
| **Flaw palette** | Sidebar with the 4 flaw types and simple definitions in middle-school language. |
| **Submit evaluation** | Lock in group annotations. |
| **Feedback view** | After teacher releases: side-by-side comparison of group annotations vs. reference evaluation. Matched flaws in green, missed in yellow, false positives in red. Explanation text shown for each. |
| **Growth tracking** | Individual accuracy trend across sessions (private, never public). |
| **Scaffold inbox** | Receive and acknowledge scaffolds from teacher. |
| **Phase awareness** | See current session phase and time remaining. |

### What Students Don't See

Metadata (knowledge areas, rationale, reactive tendency), expected flaws, agent profiles, severity in the reference evaluation (until after submission).

### Annotation Difficulty Modes

Teacher-configurable per group, per session:

| Mode | Students Do | When to Use |
|------|-------------|-------------|
| **Spot** | Highlight text they think is problematic. No categorization. | First exposure. Builds close reading habits. |
| **Spot + Classify** | Highlight + pick flaw type from the 4 categories. | Core mode for most sessions. |
| **Full** | Highlight + classify + severity + brief written explanation. | Advanced groups, later in semester. |

In Spot mode, the feedback reveal shows what type and severity each flaw was — students learn the taxonomy passively before using it actively.

---

## Role 2: Teacher

### Core Experience

Set up sessions, monitor student groups in real time, send scaffolds, control when feedback is revealed, and review results.

### Session Setup (Before Class)

| Feature | Description |
|---------|-------------|
| **Create session** | Pick activity, assign groups, set time. |
| **Scaffold library** | Pre-load scaffold prompts organized by flaw type and difficulty. Reusable across sessions. Teacher can also write custom scaffolds. |
| **Scaffolding mode** | Choose difficulty mode per group (Spot / Spot+Classify / Full). |

### Live Dashboard (During Class)

The core teacher screen — mission control for multiple groups.

| Feature | Description |
|---------|-------------|
| **Group overview** | Grid of all groups. At a glance: annotation counts, sections touched, time spent. Color-coded status (stuck, active, nearly done). |
| **Activity feed** | Real-time stream of annotations as students make them. |
| **Stuck detection** | Flag groups with no activity for configurable duration. Surfaces suggestions, not automatic actions. |
| **Group detail** | Tap into any group: see their annotations overlaid on the transcript in real time. See what they've found vs. what they've missed (compared to reference evaluation). Teacher's "X-ray vision." |

### Scaffolding Tools

Six scaffold levels, from lightest to heaviest:

| Level | Type | Example | When to Use |
|-------|------|---------|-------------|
| 1 | **Attention redirect** | "Take another look at Section 3." | Group skipping a section |
| 2 | **Comparison prompt** | "What does Agent A say about X? Now look at what Agent C says." | Missing cross-section coherence flaw |
| 3 | **Category nudge** | "You've found reasoning flaws — are there other types of problems?" | Only finding one flaw type |
| 4 | **Question prompt** | "Does the evidence Agent B cites actually support their conclusion?" | Near a flaw but not articulating it |
| 5 | **Flaw type hint** | "There's an epistemic flaw in Turns 7-9." | Stuck, needs direct guidance |
| 6 | **Metacognitive prompt** | "Your group disagreed about Turn 4 — what would help you decide?" | Supports physical discussion |

Scaffolds appear on student screens as a notification card pinned to the top — visible but not blocking. Can be targeted to a specific section/turn or general.

**Auto-scaffolding approach:** The app suggests scaffolds to the teacher based on group state. Teacher approves with one tap or dismisses. The app never sends scaffolds directly to students.

Suggestion triggers (configurable thresholds):
- Group idle for N minutes (default: 4)
- Group annotated less than half of sections with less than half the time remaining
- Group found zero flaws of a type the reference evaluation has 2+ of
- Group annotating one section repeatedly

### Pacing Controls

| Feature | Description |
|---------|-------------|
| **Phase timer** | Structure session into phases with visible countdown on student screens. |
| **Lock/unlock feedback** | Teacher controls when reference evaluation is revealed. Per-group or all at once. |
| **Pause** | Freeze all groups for a whole-class moment. Student screens show "Teacher is speaking." |
| **Individual → Group transition** | Teacher controls when individual annotations become visible to the group (see Group Annotations below). |

### Post-Session

| Feature | Description |
|---------|-------------|
| **Reveal & compare** | Release reference evaluation. Students see annotations vs. reference side-by-side. |
| **Class discussion view** | Projectable screen showing aggregate results for whole-class debrief. |
| **Scaffold effectiveness** | Which scaffolds led to successful annotations. |
| **Scenario metadata** | View scenario design, driving question, agent sketches, expected flaws, design notes. |

### Requesting New Content

Form to submit a topic + pedagogical goals. Feeds into the Polylogue 3 pipeline (initially manual, later automated).

---

## Role 3: Researcher

### Core Experience

Analyze the full data pipeline — from scenario design through agent profiles, generated discourse, evaluation, and student interaction data — to study how knowledge profiles produce flaws and how students detect them.

### Features

| Feature | Description |
|---------|-------------|
| **Full pipeline view** | For any scenario: scenario → profiles → transcript → evaluation, navigable in one interface. Click a flaw, see it highlighted in transcript, trace back to the knowledge profile. |
| **Knowledge-to-flaw tracing** | Interactive visualization: agent knowledge profile (left), transcript (middle), flaws (right). Lines connect knowledge gaps → content → detected flaws. |
| **Metadata explorer** | Full access to all hidden metadata: knowledge areas per turn/section, rationale, reactive tendency activation, stage transitions. Filter turns by knowledge category. |
| **Cross-scenario comparison** | Compare flaw distributions across scenarios. Which topics produce more reasoning vs. epistemic flaws? |
| **Disposition analysis** | Filter/group by disposition dimensions. Correlation analysis between disposition and flaw patterns. |
| **Student performance data** | Aggregate anonymized student data: detection rates by flaw type, severity, source. Which flaws are hardest? |
| **Scaffold effectiveness analysis** | Which scaffold types led to successful flaw identification? At what session time point? For which flaw types? |
| **Interaction pattern analysis** | For discussions: visualize escalation, deflection, conformity patterns. Timeline of reactive tendency activations overlaid on stage transitions. |
| **Export & API** | Export any dataset as CSV/JSON for external analysis. API access for programmatic queries. All exports pre-anonymized. |

---

## Group Annotation Model

### Individual-Then-Group Flow

```
Individual phase (5-10 min)          Group phase (10-15 min)
┌─────────────────────────┐         ┌─────────────────────────┐
│ Each student reads &     │         │ All individual           │
│ annotates on their own   │────────▶│ annotations become       │
│ device. Annotations are  │         │ visible (color-coded     │
│ private.                 │         │ by student). Group       │
│                          │         │ discusses physically,    │
│                          │         │ creates "group answer"   │
│                          │         │ annotations.             │
└─────────────────────────┘         └─────────────────────────┘
```

**Why individual first:** Prevents groupthink. The quiet student who spotted a subtle flaw doesn't get overridden before they write it down. Follows think-pair-share pedagogy.

**Why reveal then discuss:** Creates natural discussion moments — "I tagged this as epistemic but you tagged it as reasoning — why?" That physical discussion is the learning.

**Group answer layer:** What gets compared to the reference evaluation. Individual annotations preserved as research data.

**Phase transition:** Teacher-controlled (not timer-based). Teacher reads the room and decides when to reveal.

**Confirmation requirement:** Before finalizing a group annotation, require confirmation taps from 2+ different devices in the group. Forces at least a verbal check-in.

---

## Physical vs. Digital Balance

### Design Philosophy

The app handles what apps are good at (displaying text, capturing annotations, tracking state, sending messages across distance). Physical discussion handles what it's good at (nuance, negotiation, persuasion, building on half-formed ideas). The app creates conditions for good discussion and then gets out of the way.

### What the App Does

- The **individual → group phase transition** is a built-in prompt for discussion. When annotations become visible, students naturally react.
- **Confirmation requirement** before finalizing group annotations is a speed bump that forces verbal check-in.
- **Teacher scaffolds** are conversation starters, not answers.

### What the App Does NOT Do

- Pop up "Discuss with your group!" prompts. Students find these patronizing.
- Require typed discussion summaries during the session. Writing slows conversation.
- Provide a chat feature between group members sitting next to each other. Digital chat would replace physical discussion, not support it.

---

## Hint System

### Approach: Teacher-Controlled, Not Automatic

No automatic hints to students. The teacher sends scaffolds at the level they choose using the 6-level system.

The teacher dashboard surfaces **observations and suggestions** that the teacher can act on or ignore:
- "Group B has only annotated Sections 1-2. Sections 3-5 untouched."
- "Group D has found 0 coherence flaws. Consider a comparison prompt."

**Rationale:** Automatic hints undermine productive struggle, which is central to PBL. A group being stuck for 3 minutes might be having a valuable discussion. An algorithm can't tell the difference.

**Exception:** Timed phase transitions are session structure, not scaffolds. Those can be automatic.

---

## Gamification

### Approach: Minimal, Group-Oriented, Non-Competitive

| Include | Avoid |
|---------|-------|
| **Group progress indicator** — progress bar showing sections examined. Encourages thoroughness, not speed. | Cross-group leaderboards |
| **Discovery moments** — at feedback reveal: "Your group identified 6 of 9 flaws, including a major coherence flaw only 2 groups caught." Positive, specific, non-comparative. | Speed-based rewards |
| **Individual growth** — private accuracy trend across sessions. "You're getting better at spotting epistemic flaws." | Badges/streaks (gamify attendance and quantity, not quality) |
| | Anything that makes a student feel bad for missing a flaw — these are designed to be hard to catch |

---

## Research Data & Privacy

### IRB and Anonymization (Designed from Day One)

This is a university-affiliated project with middle schoolers (minors). Any research use requires IRB approval and parental consent.

| Decision | Approach |
|----------|----------|
| **Student identifiers** | App uses opaque IDs internally. Real names shown only in teacher view. Researcher view shows only `student_047`, `group_B`. |
| **Data export** | All exports strip names automatically. Researcher cannot export identifiable data. |
| **Consent flag** | Each student record has a `research_consent` boolean (set by teacher from parental consent forms). Non-consented students excluded from researcher queries entirely. |
| **Age compliance** | COPPA applies (students under 13). No email-based student accounts. Teacher creates accounts. No user-generated content visible to other groups. |
| **Data retention** | Defined retention policy. Non-consented student data available to teacher during semester, then purged. |

### Scaffold Event Logging

Every scaffold event recorded with full context for research analysis:

```yaml
scaffold_event:
  session_id: "session_042"
  timestamp: "2026-04-15T10:23:17Z"
  group_id: "group_B"
  sent_by: teacher | auto_suggestion_approved
  scaffold_level: 2
  scaffold_type: comparison_prompt
  target_location:
    references: ["section_01", "section_04"]
  scaffold_text: "Compare what Amara says about pollution sources..."
  context_at_send:
    annotations_count: 3
    sections_touched: [1, 2]
    time_in_session_minutes: 12
  outcome:
    annotations_after_5min: 2
    target_section_annotated: true
    flaw_found_at_target: true
```

This data is generated by normal teacher usage with no extra effort, but answers key research questions about scaffold effectiveness.

---

## Scope: v1 vs. v2

### Guiding Principle for v1

One teacher, one class, one session at a time. Get the core classroom loop working.

### Student v1

| Must-Have | Nice-to-Have (v2) |
|-----------|--------------------|
| Read transcript (presentation sections or discussion turns) | Cross-session progress tracking |
| Highlight + classify flaws (Spot + Classify mode) | Written explanations for annotations |
| See teacher scaffolds | Severity rating |
| View reference evaluation after teacher releases it | |
| Side-by-side comparison (annotations vs. reference) | |

### Teacher v1

| Must-Have | Nice-to-Have (v2) |
|-----------|--------------------|
| Create session, assign activity to groups | Scaffold library with pre-loaded templates |
| Live group overview (annotation counts, sections touched) | Auto-suggestions ("Group B is idle") |
| Tap into any group to see their annotations in real time | Phase timer with student-visible countdown |
| Send free-text scaffolds targeted to a group | Pause/freeze all groups |
| Control when reference evaluation is revealed | Post-session class discussion projector view |
| View reference evaluation with full flaw details | Per-group difficulty mode |

### Researcher v1

| Must-Have | Nice-to-Have (v2) |
|-----------|--------------------|
| Nothing in the app. Researchers access raw YAML and registry files directly. | Full pipeline view |
| | Knowledge-to-flaw tracing visualization |
| | Cross-scenario comparison |
| | Student performance analytics |
| | Export & API |

**Rationale:** The researcher role's value depends on accumulated data from multiple sessions. Until teachers and students generate real usage data, there's nothing to analyze in-app. Build the researcher dashboard in v2.

### Data Model v1

Even though the researcher UI is v2, the **data model** should support research from day one:
- Log all scaffold events with full context
- Store individual and group annotations separately
- Include research consent flags
- Use opaque student IDs throughout
- Support multiple activities per session in the schema (even if the UI only supports one)

---

## Shared UI Components

| Component | Description |
|-----------|-------------|
| **Transcript renderer** | Renders presentation sections or discussion turns. Supports highlighting, annotation overlays, metadata overlays (toggled by role). |
| **Flaw card** | Displays a flaw with type badge, severity indicator, evidence quote, explanation. Expandable. |
| **Agent avatar** | Consistent visual identity per agent (color + icon from name/role). Helps students track speakers. |
| **Activity card** | Topic, domain, agent count, flaw summary stats, activity type badge. Used in browsing views. |

---

## Data Flow

```
registry/ YAML files (Polylogue 3 output)
    ↓ parsed (ingest script)
PostgreSQL Database
    ↓
Next.js API Routes + Socket.IO
    ↓
┌──────────┬──────────┬────────────┐
│ Student  │ Teacher  │ Researcher │
│ View     │ View     │ View       │
└──────────┴──────────┴────────────┘
    ↓                       ↓
Student annotations    Export/API
    ↓
Scaffold events + Feedback + Analytics
```

The same data serves all three roles, but each role sees different layers of the metadata onion. Students see only content. Teachers see content + evaluation. Researchers see content + evaluation + all hidden metadata + student performance data.

---

## Technical Stack

### Deployment Target

Self-hosted on a University of Memphis server. No external cloud dependencies. All components are open source and free.

### Architecture

```
University Server
┌─────────────────────────────────┐
│  Nginx (port 443, HTTPS)        │
│    ↓ reverse proxy              │
│  Node.js / Next.js (port 3000) │
│    ↕ Socket.IO (same process)  │
│    ↕                            │
│  PostgreSQL (port 5432)         │
└─────────────────────────────────┘
```

Single server, three processes (Nginx, Node, Postgres). No containers required, though Docker is an option if the university prefers it.

### Stack Components

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | Next.js (React) + TypeScript | UI for all three roles. App Router for role-based layouts (`/student/`, `/teacher/`, `/researcher/`). |
| **Styling** | Tailwind CSS | Responsive, tablet-friendly layouts. Utility-first for rapid development. |
| **Backend** | Next.js API routes | REST endpoints for CRUD operations. Runs in the same Node process as the frontend. |
| **Real-time** | Socket.IO | WebSocket-based live updates: annotation sync, scaffold delivery, phase transitions. Runs in the same Node process. At 30 concurrent users, this is trivial. |
| **Database** | PostgreSQL | Stores activities, sessions, annotations, scaffolds, events. JSONB for transcript and evaluation data. |
| **Auth** | NextAuth.js (credentials provider) | Username/password authentication. Teacher creates student accounts — no email required (COPPA-friendly). Role-based access in API middleware. |
| **Process manager** | PM2 | Keeps Node.js alive, handles restarts, log rotation. |
| **Reverse proxy** | Nginx | HTTPS termination, static file caching, WebSocket proxying to Node. |

### Why This Stack

- **Single deployable unit.** One Node process serves frontend, API, and real-time. Simplest possible operational model for university IT.
- **No external dependencies.** No Supabase, Vercel, or cloud services. Everything runs on the university server. Data stays on campus.
- **PostgreSQL is standard.** University IT likely already manages Postgres instances. Backup, monitoring, and maintenance follow existing procedures.
- **Socket.IO for real-time.** Lightweight, battle-tested. Handles the live dashboard (teacher sees annotations appear), scaffold delivery, and phase transitions. No separate service needed.
- **NextAuth.js for auth.** Credentials-based provider means no OAuth, no email verification, no third-party auth service. Teacher creates accounts directly. Role assignment built into the user model.
- **Cost: $0.** All open source. The only cost is the server itself, which already exists.

### Database Schema

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ activities   │────▶│ sessions     │────▶│ groups       │
│ (from YAML)  │     │ (teacher     │     │ (students    │
│              │     │  creates)    │     │  assigned)   │
└─────────────┘     └──────────────┘     └──────────────┘
                                               │
                          ┌────────────────────┤
                          ▼                    ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ annotations  │    │ scaffolds    │
                    │ (individual  │    │ (teacher →   │
                    │  + group)    │    │  group)      │
                    └──────────────┘    └──────────────┘
```

Core tables:

| Table | Key Fields |
|-------|-----------|
| `users` | id, username, display_name, role (student/teacher/researcher), research_consent, created_by |
| `activities` | id, scenario_id, type (presentation/discussion), topic, transcript (JSONB), evaluation (JSONB), metadata (JSONB) |
| `sessions` | id, teacher_id, activity_id, status (setup/active/reviewing/closed), config (JSONB: difficulty modes, phase timers), created_at |
| `groups` | id, session_id, name |
| `group_members` | group_id, user_id |
| `annotations` | id, group_id, user_id, location (section_id/turn_id + text range as JSONB), flaw_type, severity, explanation, is_group_answer, created_at |
| `scaffolds` | id, session_id, group_id, teacher_id, level (1-6), type, text, target_location (JSONB), context_at_send (JSONB), created_at, acknowledged_at |
| `session_events` | id, session_id, event_type, payload (JSONB), created_at |

**JSONB for transcripts:** Store parsed YAML as JSONB. Transcript data is read-heavy and write-once (imported from registry). Annotations reference locations by section_id/turn_id strings and character offsets.

**Role-based access:** Enforced in API middleware, not at the database level. Each API route checks the user's role before returning data. Students cannot access metadata or evaluation endpoints. Teachers cannot access researcher-only fields.

### Project Structure

```
CrossCheck/
├── docs/                      # Concept and planning docs
├── app/                       # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── student/       # Student routes
│   │   │   ├── teacher/       # Teacher routes
│   │   │   ├── researcher/    # Researcher routes (v2)
│   │   │   ├── auth/          # Login
│   │   │   └── api/           # API routes
│   │   │       ├── activities/
│   │   │       ├── sessions/
│   │   │       ├── annotations/
│   │   │       ├── scaffolds/
│   │   │       └── auth/
│   │   ├── components/
│   │   │   ├── transcript/    # Shared transcript renderer
│   │   │   ├── annotation/    # Highlight + flaw tagging
│   │   │   ├── flaw-card/     # Flaw display component
│   │   │   └── dashboard/     # Teacher live dashboard
│   │   ├── lib/
│   │   │   ├── db.ts          # PostgreSQL client (pg or Prisma)
│   │   │   ├── socket.ts      # Socket.IO setup
│   │   │   ├── auth.ts        # NextAuth config
│   │   │   └── types.ts       # TypeScript types
│   │   └── hooks/
│   │       ├── useAnnotations.ts
│   │       └── useRealtime.ts
│   ├── prisma/                # or raw SQL migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/
│   │   └── ingest-registry.ts # Parse YAML → insert into DB
│   ├── server.ts              # Custom server (Socket.IO integration)
│   └── package.json
└── nginx/
    └── crosscheck.conf        # Nginx site config
```

### Key Implementation Details

| Concern | Approach |
|---------|----------|
| **Text highlighting** | Custom selection handler or `react-text-annotate`. Persist as `{section_id, start_offset, end_offset}`. |
| **Real-time sync** | Socket.IO rooms per session and per group. Teacher joins all rooms in their session. Students join only their group's room. Events: `annotation:created`, `scaffold:sent`, `session:phase_changed`. |
| **YAML ingestion** | CLI script reads `registry/{id}/*.yaml`, parses with `js-yaml`, inserts into `activities` table. Run once per new scenario. Could also be triggered from a teacher admin page. |
| **Offline resilience** | Annotations cached in localStorage. Queued and synced on reconnection. Socket.IO handles reconnection automatically. |
| **HTTPS** | University IT provides SSL certificate (or Let's Encrypt). Nginx terminates TLS. |
| **Backups** | Standard `pg_dump` cron job. University IT likely has existing backup infrastructure. |

### Implementation Phases

| Phase | What | Depends On |
|-------|------|-----------|
| **Phase 0: Foundation** | Next.js project setup, PostgreSQL schema, NextAuth with credentials, YAML ingestion pipeline, basic Nginx config | Server access from university IT |
| **Phase 1: Student Core** | Transcript renderer (presentation + discussion), highlight & classify annotations, flaw palette, submit | Phase 0 |
| **Phase 2: Teacher Core** | Create session, assign groups, live group overview, tap into group detail, send free-text scaffolds, release evaluation | Phase 0 |
| **Phase 3: Real-time** | Socket.IO integration — live annotation feed on teacher dashboard, scaffold delivery to students, phase transitions, connectivity status | Phases 1 + 2 |
| **Phase 4: Feedback Loop** | Annotation matching engine, side-by-side comparison view (student annotations vs. reference), class discussion projector view | Phase 3 |
| **Phase 5: Polish** | Individual → group annotation flow, difficulty modes, scaffold library, phase timer, offline queue with sync | Phase 4 |
| **Phase 6: Researcher (v2)** | Pipeline view, knowledge-to-flaw tracing, cross-scenario comparison, export/API, student performance analytics, scaffold outcome analysis | Phase 5 + accumulated usage data |

---

## Design Clarifications

### Annotation Matching Algorithm

The feedback view (green/yellow/red) requires matching student annotations against reference flaws. This is the core of the feedback loop and needs a clear specification.

**Matching strategy: Location + Type, not text overlap.**

A student annotation matches a reference flaw when:

1. The annotation is **within the same section or turn** that the reference flaw references, AND
2. The annotation has the **same flaw type** (reasoning, epistemic, completeness, coherence)

Text overlap is not used as a primary matching signal. Students may highlight different spans of text that cover the same logical issue, or highlight a broader passage that contains the problematic claim. Requiring exact text match would produce false negatives constantly.

**Match categories for the feedback view:**

| Color | Meaning | Rule |
|-------|---------|------|
| **Green** | Correct match | Student annotated the right location with the right flaw type |
| **Yellow** | Missed flaw | Reference flaw exists at a location the student did not annotate (or annotated with the wrong type) |
| **Red** | False positive | Student annotated a location/type combination that doesn't correspond to any reference flaw |
| **Partial (blue)** | Location match, wrong type | Student found the right location but classified it differently — still shows they noticed something |

**Cross-section and cross-turn flaws (coherence):**

These reference flaws cite multiple locations (e.g., `references: ["section_01", "section_04"]`). A student annotation matches if they tagged **either** referenced location with the correct flaw type. This counts as a full match — requiring students to annotate both locations would be overly strict, since identifying one half of a contradiction demonstrates the critical thinking skill.

**Scoring:**

- **Detection rate** = green matches / total reference flaws
- **Precision** = green matches / (green + red)
- **Partial credit** shown qualitatively (blue highlights) but not counted in the score — serves as a learning signal, not a grade

**Edge cases:**

- Multiple students in a group annotate the same flaw → counts as one group match
- A student annotates a location with multiple flaw types → each type checked independently
- A reference flaw spans an entire section (e.g., the whole introduction is an overgeneralization) → any annotation within that section with the correct type matches
- A student spots a legitimate flaw not in the reference evaluation → marked as red (false positive) in the automated view, but teacher can manually upgrade to "bonus find" before releasing feedback

### YAML Ingestion Pipeline

The parse step from `registry/` YAML to database is doing meaningful work and warrants its own specification.

**What the ingestion script does:**

```
registry/{scenario_id}/
├── config.yaml              → session metadata
├── presentation.yaml        → activities table (type: presentation)
│   or discussion.yaml       → activities table (type: discussion)
├── presentation_evaluation.yaml  → same activities row (evaluation JSONB)
│   or discussion_evaluation.yaml
└── (from configs/)
    ├── scenarios/{id}.yaml  → activities.metadata (scenario design)
    └── profiles/{id}/*.yaml → activities.metadata (agent profiles)
```

**Ingestion steps:**

1. **Parse transcript YAML** (`presentation.yaml` or `discussion.yaml`)
   - Extract top-level fields: scenario_id, topic, activity type, agents
   - Store full transcript as JSONB in `activities.transcript`
   - **Separate content from metadata:** Build a `content_only` JSONB view that strips `metadata` blocks (knowledge_areas_engaged, rationale, reactive_tendency_activated) from each section/turn. This is what students see. The full transcript with metadata is what researchers see.

2. **Parse evaluation YAML**
   - Store as JSONB in `activities.evaluation`
   - **Build a flaw location index:** For each flaw, extract its `location.references` (section_ids or turn_ids) and `flaw_type`. Store as a denormalized array in `activities.flaw_index` (JSONB) for fast annotation matching:
     ```json
     [
       {"flaw_id": "flaw_001", "locations": ["section_01"], "flaw_type": "reasoning", "severity": "major"},
       {"flaw_id": "flaw_007", "locations": ["section_01", "section_04"], "flaw_type": "coherence", "severity": "major"}
     ]
     ```

3. **Parse scenario and profiles** (from `configs/`)
   - Store as JSONB in `activities.metadata`
   - This includes expected flaws, agent knowledge profiles, disposition details, design notes
   - Only accessible via researcher API endpoints

4. **Validate completeness**
   - Confirm transcript + evaluation both exist
   - Confirm all agents referenced in evaluation appear in transcript
   - Confirm all flaw location references point to valid section_ids/turn_ids
   - Report warnings for any mismatches

**When to run:** Once per new scenario. Triggered by a CLI command (`npm run ingest -- --scenario plastic-pollution-mississippi-river`) or from a teacher admin page that lists available scenarios in `registry/` not yet imported.

### Scaffold Outcome Measurement

Scaffold event logging is v1. Scaffold outcome analysis is v2.

**v1 (Phase 0-5):** Log the scaffold event with `context_at_send` at the moment the teacher sends it. The `outcome` fields in the schema are **nullable** — they are not populated in real time.

```yaml
scaffold_event:
  # ... all fields as specified ...
  context_at_send:
    annotations_count: 3
    sections_touched: [1, 2]
    time_in_session_minutes: 12
  outcome: null  # populated later by post-session analysis
```

**v2 (Phase 6):** A post-session batch script computes outcomes by correlating scaffold timestamps with subsequent annotation timestamps per group:
- `annotations_after_5min`: count of new annotations by this group within 5 minutes of scaffold delivery
- `target_section_annotated`: did the group annotate the scaffold's target location after receiving it?
- `flaw_found_at_target`: did an annotation at the target location match a reference flaw?

This keeps v1 simple (just write events) and defers temporal correlation to when the researcher dashboard needs it. The data to compute outcomes exists in `annotations.created_at` and `scaffolds.created_at` — the batch script joins on timestamps, nothing needs to be tracked in real time.

### Connectivity and Offline Resilience

Middle school classrooms with 25+ devices can have unreliable wifi. The app must distinguish between "idle" and "disconnected" and handle both gracefully.

**Connection states per group (visible on teacher dashboard):**

| State | Icon | Meaning | How Detected |
|-------|------|---------|-------------|
| **Active** | Green | At least one device in the group has sent an event (annotation, scroll, page view) in the last 2 minutes | Recent Socket.IO events |
| **Idle** | Yellow | All devices connected but no events in the last N minutes (configurable, default 4) | Socket.IO connected, no recent events |
| **Disconnected** | Red | No devices in the group have an active Socket.IO connection | Socket.IO disconnect event |
| **Partial** | Orange | Some devices connected, some not | Mixed connection states within group |

**Why this matters:** If the teacher sees "idle" they might send a scaffold. If they see "disconnected" they know the students can't receive it and should walk over physically. Conflating the two would actively mislead the teacher.

**Offline annotation queue:**

1. Student creates annotation while disconnected → stored in IndexedDB (not localStorage — IndexedDB handles structured data better and survives tab crashes)
2. Visual indicator on student screen: "Offline — your work is saved locally"
3. On reconnection, Socket.IO fires `reconnect` event → client replays queued annotations to the server
4. Server deduplicates by (group_id, user_id, location, flaw_type) to handle double-sends
5. Teacher dashboard shows annotation count update when sync completes

**Scaffold delivery while disconnected:**

- Scaffold is stored server-side with `delivered_at: null`
- When the student's device reconnects, pending scaffolds are pushed immediately
- Teacher sees "scaffold pending delivery" status on their dashboard until acknowledgment

**Heartbeat mechanism:** Socket.IO's built-in ping/pong (default: 25s interval, 20s timeout) handles connection detection. No custom heartbeat needed. The server tracks which user_ids have active sockets and exposes this to the teacher dashboard via a lightweight polling endpoint (not real-time — connection status doesn't need sub-second updates).
