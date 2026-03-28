# CrossCheck — App Overview

> **CrossCheck** — Evaluate AI team presentations and discussions

CrossCheck is a web application that serves AI-generated presentations and discussions (produced by the Polylogue 3 pipeline) to students, teachers, and researchers. Student groups evaluate AI discourse for critical thinking flaws, teachers facilitate and scaffold in real time, and researchers study the resulting data.

---

## Context

Polylogue 3 generates group presentations and discussions containing intentional critical thinking flaws. AI agents are constructed with specific knowledge gaps (misconceptions, shallow understanding, blind spots) that produce flaws naturally. The output — transcripts with hidden metadata — is stored in `registry/{scenario_id}/` as YAML files.

CrossCheck is the delivery and interaction layer. It takes the generated content and makes it usable in a classroom setting at the University Middle School (UMS) in Memphis, serving grades 6–8 in project-based learning (PBL).

---

## Classroom Context

### School Profile

University Middle School enrolls ~270 students in grades 6–8, drawn from all 36 zip codes in Memphis–Shelby County. Class size averages 20:1. The student body is 49% White / 51% BIPOC.

UMS is part of University Schools, a state-recognized district. Its mission centers on preparing diverse students through PBL to be culturally competent, intellectually inquisitive, and emotionally intelligent.

### The PBL Model

- **6th and 7th grade**: Two semester-long PBL cycles per year — one STEM, one Humanities. Teachers design driving questions aligned to Tennessee content standards. Students work in collaborative groups of ~5.
- **8th grade**: Year-long self-guided capstone project.

Each 6th/7th grade project runs ~13 Fridays:

| Phase | Duration | What happens |
|-------|----------|-------------|
| Project Launch | 1 Friday | Entry event, team formation, driving question introduction |
| Build Knowledge & Develop | 11 Fridays | Research, prototyping, peer feedback, revision cycles |
| Present Products | STRIPES Showcase | Public presentation to authentic audience |

CrossCheck sessions must fit within a single Friday class period (typically 45–60 minutes).

### Where CrossCheck Fits

CrossCheck is a **critical thinking practice tool** embedded within PBL projects. It supplements the "Build Knowledge" phase by giving students structured practice in evaluating group work.

1. Students will present at STRIPES Showcase — they need to evaluate group presentations critically.
2. AI generates intentionally flawed presentations and discussions on topics that mirror the students' own PBL driving questions.
3. Students practice identifying flaws in someone else's work before they identify flaws in their own.
4. Teachers scaffold the process using real-time monitoring and hints.
5. The feedback loop shows students what they caught and what they missed.

A teacher might use CrossCheck 2–3 times during the 11-week Build Knowledge phase.

### Classroom Environment

- **Devices**: Primarily tablets (Chromebooks or iPads); some desktop computers.
- **Network**: School WiFi. Socket.IO auto-reconnects on brief drops.
- **Login**: Students log in by display name only — no passwords (COPPA-friendly). Teachers and researchers use name + password.
- **Physical setup**: Students sit in groups of ~5. During group stages, they discuss physically while referring to the shared transcript on their individual devices.

---

## Data Model (from Polylogue 3)

CrossCheck consumes these generated artifacts:

| Artifact | Key Fields | Role Visibility |
|----------|-----------|-----------------|
| **Presentation transcript** | Sections (intro, approach, findings, solution, conclusion), each with speaker, content, knowledge areas, rationale | Students see content only. Teachers see content + evaluation. Researchers see everything. |
| **Discussion transcript** | Turns with speaker, stage, content, knowledge areas, reactive tendency activation, rationale | Same visibility layers. |
| **Evaluation** | Flaws with type (reasoning, epistemic, completeness, coherence), source, severity, evidence quotes, explanations | Hidden from students until teacher releases. Full access for teachers and researchers. |
| **Scenario** | Driving question, domain, agent sketches, expected flaws, design notes | Teachers and researchers only. |
| **Agent profiles** | Knowledge profiles (strong, shallow, misconception, blind spot), disposition, expected flaws | Researchers only. |

---

## Classroom Usage Model

```
CLASSROOM (one session, ~45-60 min)

  Group A (4-5 students)    Group B (4-5 students)
  +------------------+      +------------------+
  | Shared transcript|      | Shared transcript|
  | Annotating flaws |      | Annotating flaws |
  | Discussing aloud |      | Discussing aloud |
  +------------------+      +------------------+

  Group C              Group D
  +----------+        +----------+
  | ...      |        | ...      |
  +----------+        +----------+

              Teacher (circulating)
              +------------------+
              | Live dashboard   |
              | Sends scaffolds  |
              | Monitors progress|
              +------------------+
```

Interactions are both **physical** (student discussion within each group, teacher walking between groups) and **digital** (student annotation in the app, teacher sending scaffolds via the app).

---

## Three Roles

### Student

Read an AI-generated presentation or discussion, then identify critical thinking flaws through a five-stage session flow (Recognize → Explain → Collaborate → Locate → Results). See the [Pedagogical Model](pedagogical-model.md) for details.

| Feature | Description |
|---------|-------------|
| **Read transcript** | Presentation: sections with speakers. Discussion: chat-style turns grouped by stage. |
| **Five-stage flow** | Recognize (individual, identify flaw types) → Explain (group, teach back what you got right) → Collaborate (group, resolve errors together) → Locate (group, find missed flaws) → Results |
| **On-demand hints** | "Narrow it down" button available at every stage. Unlocks after a try-first period. |
| **Coins and goal bars** | Earn coins for correct answers, explanations, and flaw discoveries. Goal bar shows progress toward the teacher-set pass threshold. |
| **Feedback view** | After teacher releases: matched flaws (green), wrong type (blue), false positives (red). |
| **Growth tracking** | Individual accuracy trend across sessions (private). |
| **Scaffold inbox** | Receive and acknowledge scaffolds from teacher. |

### Teacher

Set up sessions, monitor student groups in real time, send scaffolds, control stage transitions, and review results.

| Feature | Description |
|---------|-------------|
| **Class management** | Create classes, add students (bulk or individual). |
| **Session creation** | Pick activity, assign groups, set pass thresholds per stage. Every session runs the five-stage flow. |
| **Live dashboard** | Group cards with annotation counts, connection status, real-time activity feed, coin totals. |
| **Stage transitions** | Advance groups from Recognize → Explain. Explain → Collaborate and Collaborate → Locate/Results trigger automatically. |
| **Scaffolding** | 6 scaffold levels with 12 pre-loaded templates. Send to any group in real time. |
| **Evaluation access** | Full answer key available at any phase. |
| **Class view** | Projectable screen for whole-class debrief. |
| **Activity browser** | Preview transcripts and evaluations before creating sessions. |
| **Teacher guide** | Built-in reference for methodology and flaw types. |

### Researcher

Analyze the full data pipeline — from scenario design through agent profiles, generated discourse, evaluation, and student interaction data.

| Feature | Description |
|---------|-------------|
| **Pipeline view** | Scenario → profiles → transcript (with metadata) → evaluation, navigable in one interface. |
| **Session browser** | All sessions across teachers. Student data anonymized. |
| **CSV exports** | Annotations, scaffolds, hints, sessions — filtered by research consent. |
| **Teacher management** | Create teacher accounts, ingest/delete activities. |

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth v5 (JWT, credentials provider) |
| **Real-time** | Socket.IO (same Node process) |
| **Server** | Custom HTTP server wrapping Next.js + Socket.IO |

### Data Flow

```
registry/ YAML files (Polylogue 3 output)
    | parsed (ingest script)
PostgreSQL Database
    |
Next.js API Routes + Socket.IO
    |
+----------+----------+------------+
| Student  | Teacher  | Researcher |
| View     | View     | View       |
+----------+----------+------------+
```

The same data serves all three roles, but each role sees different layers of the metadata. Students see only content. Teachers see content + evaluation. Researchers see everything.

### Deployment

Self-hosted on a University of Memphis server. No external cloud dependencies. All components are open source.

```
University Server
+-------------------------------+
|  Nginx (port 443, HTTPS)      |
|    | reverse proxy             |
|  Node.js / Next.js (port 3000)|
|    | Socket.IO (same process)  |
|    |                           |
|  PostgreSQL (port 5432)        |
+-------------------------------+
```

---

## Design Philosophy

- **Physical + digital balance.** The app handles what apps are good at (displaying text, capturing annotations, tracking state). Physical discussion handles what it's good at (nuance, negotiation, persuasion). The app creates conditions for good discussion and then gets out of the way.
- **Motivation without toxic competition.** Coins, goal bars, and pass thresholds give students visible progress and achievable win conditions. No cross-group leaderboards or rankings. Group coin totals celebrate shared success.
- **Confidence before challenge.** The Explain stage (teach back) ensures every group's first collaborative activity is positive. Collaborate (error resolution) follows only after the group has built momentum.
- **Formative, not summative.** CrossCheck does not produce grades. It produces detection rates, flaw type breakdowns, coin counts, and matched/missed comparisons as formative feedback.
- **Privacy by design.** Opaque student IDs, research consent flags, COPPA-compliant auth, anonymized exports.

---

## Legacy Mode Support

The app also supports a legacy v1 mode system (Recognize, Locate, Classify, Explain as independent teacher-selected modes) for sessions created before the five-stage flow was implemented. New sessions use the five-stage flow exclusively. Legacy support will be removed once all old sessions are migrated.
