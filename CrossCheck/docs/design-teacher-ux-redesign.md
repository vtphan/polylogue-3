# Design: Teacher UX Redesign

## Problem

The teacher interface has two top-level pages: **Sessions** and **Students**. Teachers have no way to learn about the system's methodology, browse activities and their AI personas, understand flaw types, or read transcripts without first starting to create a session. The current structure assumes familiarity that doesn't exist.

Separately, flaw details in the transcript view appear as expanding cards that push content down. This breaks context — teachers lose their place in the transcript when a card expands below.

## Changes

### 1. Add two nav items: Activities and Guide

Current nav: `Sessions | Students`

New nav: `Sessions | Activities | Guide | Students`

### 2. Activities page (`/teacher/activities`)

A browsable list of all available activities. Currently, activities are only visible inside the session creation dropdown. Teachers need to explore activities independently — understanding what's available before deciding what to assign.

Each activity card shows:
- Topic (title)
- Type badge (presentation / discussion)
- Agent count
- Flaw count + severity breakdown
- Click → opens existing activity preview (`/teacher/activities/[id]`) with its 3 tabs (Overview, Meet the Team, Transcript)

This makes AI personas (via Meet the Team tab) and transcripts (via Transcript tab) discoverable without requiring the teacher to start creating a session.

**Data source:** `prisma.activity.findMany()` with evaluation summary. Same data as the session creation dropdown, just rendered as a full page.

### 3. Guide page (`/teacher/guide`)

A reference page with two sections, navigable via internal tabs.

#### Tab: Methodology

Explains the pedagogical model so teachers understand what they're doing and why.

**Practice Modes** — the 4 session modes on the independence gradient:

| Mode | What students do | System provides | Teacher controls |
|------|-----------------|-----------------|-----------------|
| Recognize | Read pre-highlighted flaws, identify the type | Flaw locations shown, student classifies | Response format: A/B or multiple choice |
| Locate | Search for flaws with directional hints | Hint highlights (sentence or section scope) | Hint scope: sentence or section |
| Classify | Find and categorize flaws independently | Nothing shown — open search | Categorization depth: detect only, assisted, or full |
| Explain | Full analysis with written justification | Nothing shown — student writes reasoning | Explanation format: guided or free text |

**Independence gradient:** The system withdraws support as modes progress. Recognize gives the most scaffolding (locations shown); Explain gives the least (student does everything). Teachers choose modes per group based on readiness.

**Session phases:** Setup → Individual → Group → Reviewing → Closed. What happens in each phase, what students see, what the teacher can do.

**Scaffolding:** When and how to send hints during a session. Reference to the 6 scaffold levels (attention redirect → comparison prompt → category nudge → question prompt → flaw type hint → metacognitive).

#### Tab: Flaw Types

The four flaw types with definitions, examples, and an optional interactive quiz. Reuses content from the student Learn mode (`learn-mode-content.ts`) but presented for teacher reference rather than as a student exercise.

**Per flaw type:**
- Name, color, abbreviation (R, E, Cp, Co)
- Definition (from `FLAW_TYPES`)
- 2 example passages with explanations (from `LEARN_EXAMPLES`)
- How it typically manifests in presentations vs. discussions

**Interactive quiz (optional):** Teachers can take the same 8-question quiz students take, to experience it firsthand. Uses `LearnMode` component with a teacher-facing wrapper (no score saving).

### 4. Inline flaw pop-ups in Transcript tab

Replace expanding flaw detail cards with pop-ups (popovers) that appear anchored to the clicked highlight.

**Current behavior:** Clicking a highlighted passage expands a card below the section, pushing all content down. "Show all flaws" expands all cards, creating a wall of detail text.

**New behavior:**
- Click a highlighted passage → a popover appears anchored near the click, showing: type badge, severity, description, evidence quote, explanation
- Popover has a close button (X) and closes when clicking elsewhere
- Only one popover open at a time — clicking another highlight closes the first
- "Show all flaws" toggle is removed (pop-ups are inherently one-at-a-time)
- Flaw type badges in section headers remain (at-a-glance indicator of what's present)

**Cross-section flaws:** Popover shows "Also appears in: [section name]" with a link that closes the popover, scrolls to the other section, and opens the popover there.

**Implementation:** Use a positioned `div` with `absolute`/`fixed` positioning relative to the clicked highlight span. The `AnnotatableText` component already tracks click coordinates via its annotation click handler. Compute popover position from the clicked element's `getBoundingClientRect()`.

## Files

### New files

| File | Purpose |
|------|---------|
| `src/app/teacher/activities/page.tsx` | Activities list page (server component) |
| `src/app/teacher/guide/page.tsx` | Guide page with Methodology + Flaw Types tabs |
| `src/app/teacher/guide/methodology-tab.tsx` | Practice modes, session phases, scaffolding reference |
| `src/app/teacher/guide/flaw-types-tab.tsx` | Flaw type definitions, examples, optional quiz |

### Modified files

| File | Change |
|------|--------|
| `src/app/teacher/layout.tsx` | Add "Activities" and "Guide" nav links |
| `src/app/teacher/activities/[id]/transcript-tab.tsx` | Replace expanding cards with positioned popovers |

### Unchanged

All other activity preview components (overview-tab, team-tab, flaw-annotations), session dashboard, student pages.

## What This Does NOT Include

- **Activity difficulty ratings** — deferred; requires more design work on what signals drive difficulty assessment.
- **Mode recommendations per activity** — deferred; "Based on this activity, we suggest Classify for advanced groups."
- **Per-activity domain examples** — showing flaw examples specific to the activity's topic. The guide shows generic examples from the Learn mode content.
- **Teacher onboarding flow** — a first-time tutorial or walkthrough. The Guide page serves as a reference but doesn't walk teachers through their first session step by step.
