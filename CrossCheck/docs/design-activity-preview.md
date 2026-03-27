# Design: Teacher Activity Preview

## Problem

Teachers select activities from a dropdown when creating sessions, but have no easy way to understand what students will encounter. The current preview is a two-column layout (raw transcript + dense evaluation panel) with no persona context and no connection between who's speaking and why what they say is flawed.

Teachers need a **pedagogical briefing** before creating a session: What will students read? Who are these AI personas and how do they behave? Where are the flaws and what makes them hard or easy to detect? This context drives every instructional decision — which mode for each group, what scaffolds to prepare, and how to lead the debrief.

## Current State

**Route:** `/teacher/activities/[id]` (linked from session creation form, opens in new tab)

**What teachers see:**
- Two-column layout: transcript on the left, evaluation panel on the right
- Agent names listed but no persona detail (just name + role)
- Evaluation shows all flaws with type, severity, description, evidence, explanation
- No connection between agents and their flaws
- No disposition or expected flaw information (restricted to researchers)

**What's available but not shown to teachers:**
- `Activity.metadata.profiles[]` — per-agent disposition, knowledge profile, expected flaws
- `Activity.transcript` — full transcript with per-turn knowledge area metadata
- Cross-referencing `flawIndex` with `transcriptContent` to associate flaws with speakers

**What gates access:** The teacher page (`page.tsx`) is a server component that queries Prisma directly — metadata is already fetched but the `ActivityData` TypeScript interface in `activity-preview.tsx` omits it. The API route (`route.ts`) also excludes metadata for teachers (line 45). Both need updating.

## Design

### Information Architecture

Three tabs, revealed progressively. The teacher's natural flow: "What is this?" → "Who's in it?" → "What will students read?"

### Layout

Single page, vertical scroll, sticky tab navigation at the top.

```
┌──────────────────────────────────────────────────────┐
│  ← Back to create session                            │
│                                                      │
│  What are the major threats affecting our global      │
│  environment?                                        │
│  presentation · 5 agents · 7 flaws                   │
│                                                      │
│  ┌──────────┐ ┌───────────────┐ ┌────────────────┐  │
│  │ Overview  │ │ Meet the Team │ │  Transcript    │  │
│  └──────────┘ └───────────────┘ └────────────────┘  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Active tab content]                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The header shows: topic (as h1), activity type badge, agent count, total flaw count. Always visible regardless of active tab.

---

### Tab 1: Overview

Purpose: quick scan of what this activity contains and where the difficulty lies.

```
┌─ Flaw Distribution ─────────────────────────────────┐
│                                                      │
│  7 flaws total                                       │
│                                                      │
│  Reasoning     ████████░░░░░░░  3                    │
│  Epistemic     ███░░░░░░░░░░░░  1                    │
│  Completeness  ███░░░░░░░░░░░░  1                    │
│  Coherence     ██████░░░░░░░░░  2                    │
│                                                      │
│  Severity: 2 major · 3 moderate · 2 minor            │
│                                                      │
├─ Key Patterns ──────────────────────────────────────┤
│                                                      │
│  "The team over-relies on a single study without     │
│   acknowledging its limitations. Two speakers         │
│   directly contradict each other on whether urban     │
│   development helps or harms pollinator diversity."   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Data source:** `evaluation.summary` (total_flaws, by_type, by_severity, key_patterns). All already available to teachers.

**Visual:** Color-coded horizontal bars for flaw type distribution (same colors used throughout the app: red/amber/blue/purple). Severity as a single text line.

---

### Tab 2: Meet the Team

Purpose: understand each AI persona — how they behave, what sections they speak in, and what flaws they were designed to produce. This is the key new information teachers don't currently have.

One card per agent, laid out as a vertical stack (mobile) or 2-column grid (desktop).

```
┌─ Dr. Rivera ────────────────────────────────────────┐
│  🟣  Lead Researcher                                 │
│                                                      │
│  Speaks in: Introduction, Conclusion                 │
│                                                      │
│  Disposition                                         │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ High confid.  │ │Collaborative│ │  Expressive   │  │
│  └──────────────┘ └─────────────┘ └──────────────┘  │
│  "Tends to double down when challenged."             │
│                                                      │
│  Expected Flaws (design intent)                      │
│  ┌─ R ───────────────────────────────────────────┐   │
│  │  Overgeneralizes from a single local study to  │   │
│  │  claim all urban areas harm all pollinators.    │   │
│  └────────────────────────────────────────────────┘   │
│  ┌─ Co ──────────────────────────────────────────┐   │
│  │  Conclusion contradicts findings presented by  │   │
│  │  Jordan in the Findings section.               │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─ Jordan Chen ───────────────────────────────────────┐
│  🟢  Data Analyst                                    │
│                                                      │
│  Speaks in: Findings                                 │
│                                                      │
│  Disposition                                         │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Moderate conf.│ │ Competitive │ │  Restrained   │  │
│  └──────────────┘ └─────────────┘ └──────────────┘  │
│  "Deflects to data when feeling uncertain."          │
│                                                      │
│  Expected Flaws (design intent)                      │
│  ┌─ E ───────────────────────────────────────────┐   │
│  │  Presents one study as definitive evidence.    │   │
│  │  Moderate confidence makes this sound measured  │   │
│  │  but the certainty is unearned.                │   │
│  └────────────────────────────────────────────────┘   │
│  ┌─ Cp ──────────────────────────────────────────┐   │
│  │  Omits economic tradeoffs entirely.            │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Card structure:**
- **Header:** Agent avatar (colored initials, same as in transcript) + name + role
- **Speaks in:** Computed server-side in `page.tsx` and passed as a prop. Derivation rule by activity type:
  - **Presentation:** Unique section names where the agent is the speaker, in transcript order. E.g., "Introduction, Conclusion".
  - **Discussion:** Unique stage names (Opening Up, Working Through, Converging) where the agent has at least one turn, in order. Each `DiscussionTurn` already carries a `stage` field — just group by `turn.stage` and deduplicate. No external data needed. Stage names are the pedagogical unit teachers think in — turn numbers are meaningless to them.
- **Disposition:** Three pill tags for the dimensions (confidence, engagement style, expressiveness) + the reactive tendency as an italic quote below. From `metadata.profiles[].disposition`.
- **Expected flaws:** Compact cards showing type abbreviation (R/E/Cp/Co) with color and the `flaw` description text. No severity — that only exists on evaluated flaws. From `metadata.profiles[].expected_flaws[]`.

**Data source:** `metadata.profiles[]` (data exists in DB, needs interface/prop changes to expose — see Data Changes section) + `transcriptContent` (for "speaks in" derivation) + `agents[]` (for name/role).

**Design notes:**
- Expected flaw descriptions come from the profile's `expected_flaws[].flaw` field, which is a plain-language description of the flaw mechanism. This is distinct from the evaluation's `description` field — the profile describes the *design intent*, the evaluation describes the *observed flaw*.
- Disposition dimension values are displayed as pills with muted color coding. No need to explain the dimension names — "High confidence" and "Collaborative" are self-explanatory.
- Agents are ordered by their first appearance in the transcript.

**Linking expected flaws to evaluated flaws:**
- The section title reads "Expected Flaws (design intent)" with a subtle tooltip: "These are the flaws this persona was designed to produce. See the Transcript tab for what actually appeared."
- Matching logic: evaluated flaws have no direct `speaker` field. To link, resolve each evaluated flaw's `location.references[]` to section/turn IDs, then look up the `speaker` (agent_id) on those sections/turns. An expected flaw matches an evaluated flaw when the agent_id and flaw_type both match.
- Expected flaws that match a detected flaw show a "See in transcript →" link. Clicking switches to the Transcript tab and scrolls to the relevant highlight.
- Expected flaws that did *not* manifest appear dimmed with a label: "Not detected in transcript." This tells the teacher the activity is slightly easier than designed.
- On the Transcript tab, flaw detail cards are labeled "Detected flaw" to reinforce the distinction.

---

### Tab 3: Annotated Transcript

Purpose: see exactly what students will read, with the "answer key" overlaid. The teacher can see the student's experience and the flaws they should find.

```
┌─ INTRODUCTION — Dr. Rivera ─────────────────────────┐
│                                                      │
│  Our team investigated the impact of urbanization    │
│  on local bee populations. ▐Studies consistently▐    │
│  ▐show that urban areas are harmful to all▐          │
│  ▐pollinators without exception.▐ [R]                │
│                                                      │
│  We believe this research will help communities      │
│  make better decisions about green spaces and         │
│  wildlife corridors in Memphis...                    │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─ Flaw Detail (expanded) ────────────────────────────┐
│  Reasoning · Major                                   │
│                                                      │
│  Overgeneralization from limited evidence. The       │
│  cited study only examined honeybees in one city;    │
│  the speaker extends this to all pollinators in all  │
│  urban areas.                                        │
│                                                      │
│  Evidence: "Studies consistently show that urban     │
│  areas are harmful to all pollinators without         │
│  exception."                                         │
└──────────────────────────────────────────────────────┘
```

**Behavior:**
- Transcript renders using `PresentationView` / `DiscussionView` as the base, with flaw highlights overlaid via the new `flaw-highlight.tsx` component
- Flaw evidence passages are highlighted with type-colored backgrounds (same palette as `AnnotatableText`: `bg-red-50`/`bg-amber-50`/`bg-blue-50`/`bg-purple-50`) and clickable inline badges
- Highlight regions are located using `evaluation.flaws[].location.references[]` (which contain section_ids or turn_ids) and text-matching against `evaluation.flaws[].evidence`
- Badges show type abbreviation (R/E/Cp/Co) with flaw type color
- **Click a badge** to expand the flaw detail card below the passage: type, severity, description, evidence quote, explanation
- **Collapsed by default.** Badges visible, details hidden
- **"Show all flaws" / "Hide all flaws" toggle** at the top of the tab — expands or collapses all flaw detail cards at once

**Student View toggle:**
- A switch at the top: `[Teacher View]  [Student View]`
- **Teacher View** (default): flaw highlights and badges visible
- **Student View**: all highlights removed — see the clean transcript exactly as a student in Classify or Explain mode would see it
- This helps the teacher gauge: "How hard is it to spot these flaws without any hints?"

**Cross-section flaws (coherence):**
- Flaws that span multiple sections (or stages, for discussions) show a badge in each referenced location
- Badge includes a link indicator: "Part 1 of 2 — also in Conclusion"
- Each flaw gets a stable `id`. Multi-location badges render as anchor links (`#flaw-{id}-{partIndex}`)
- **Click behavior:** Smooth-scrolls to the paired badge, pulse-highlights it (CSS animation, 1.5s), and auto-expands its detail card. The badge text updates to show context: "Part 2 of 2 — also in Introduction"
- Flaw expansion state is shared globally — expanding in one location expands in all

**Data source:** `transcriptContent` (renders the transcript), `evaluation.flaws[]` (highlights and flaw details). Same data as current preview, just rendered differently.

**Discussion-specific behavior:**

Both presentations and discussions are fully supported. Key differences for discussions:

- **Stage dividers already exist.** `DiscussionView` already renders stage dividers with colored badges (Opening Up / Working Through / Converging) at each stage transition. No new work needed for basic stage display.
- **Stage data lives on each turn.** Each `DiscussionTurn` has a `stage` field (`"opening_up" | "working_through" | "converging"`). No external `discussion.yaml` or stage boundary data is needed at runtime.
- **"Speaks in" shows stage names**, not turn numbers (see Tab 2 derivation rule above).
- **Cross-stage flaws** use the same "Part N of M" mechanic as cross-section flaws, referencing stage names instead of section names.
- **Transcript rendering** uses `DiscussionView` instead of `PresentationView`. The `transcript-tab.tsx` component checks `activityType` and delegates to the appropriate renderer.

---

## Data Changes

### How data reaches the teacher preview

The teacher activity page (`page.tsx`) is a **server component that queries Prisma directly** — it does not use the API route. The full activity object (including `metadata`) is already serialized and passed to `ActivityPreview` via `JSON.parse(JSON.stringify(activity))`. The data is present but unused because the `ActivityData` interface in `activity-preview.tsx` omits `metadata`.

Two changes are needed:

### 1. Define an ActivityMetadata type

**File:** `CrossCheck/app/src/lib/types.ts`

No TypeScript type exists for `metadata` (it's `Json?` in Prisma). Add:

```typescript
interface AgentProfile {
  agent_id: string;
  name: string;
  disposition: {
    confidence: string;       // "low" | "moderate" | "high"
    engagement_style: string; // "collaborative" | "moderate" | "competitive"
    expressiveness: string;   // "restrained" | "moderate" | "expressive"
    reactive_tendency: string; // multi-sentence prose description
  };
  expected_flaws: {
    flaw: string;       // plain-language description of the flaw
    flaw_type: string;  // "reasoning" | "epistemic" | "completeness" | "coherence"
    mechanism: string;  // how the flaw arises from knowledge gaps + disposition
  }[];
  // Full profiles also contain knowledge_profile, context, description,
  // scenario_id, metadata — but only disposition + expected_flaws are
  // used in the teacher preview.
}

interface ActivityMetadata {
  scenario?: unknown;       // full scenario YAML (researcher-only)
  profiles?: AgentProfile[];
}
```

Note: expected flaws have **no `severity` field** — that exists only on evaluated flaws. Severity is a property of the observed flaw in context, not the design intent. The Meet the Team tab shows expected flaw cards without severity; the Transcript tab shows evaluated flaw cards with severity.

### 2. Expand ActivityData interface and pass metadata selectively

**File:** `CrossCheck/app/src/app/teacher/activities/[id]/activity-preview.tsx`

Current `ActivityData` interface declares `id, topic, type, agents, transcriptContent, evaluation`. Add `metadata`:

```typescript
interface ActivityData {
  id: string;
  topic: string;
  type: string;
  agents: Agent[];
  transcriptContent: unknown;
  evaluation: unknown;
  metadata: ActivityMetadata | null;
}
```

Alternatively, `page.tsx` can extract just `profiles` before serializing, so the client never receives the full metadata object. This is the safer approach — it mirrors the API route's role-based filtering:

```typescript
// In page.tsx
const { metadata, ...rest } = activity;
const profiles = (metadata as ActivityMetadata | null)?.profiles ?? [];
<ActivityPreview activity={JSON.parse(JSON.stringify({ ...rest, profiles }))} />
```

### 3. API route change (for non-page consumers)

**File:** `CrossCheck/app/src/app/api/activities/[id]/route.ts`

The API route currently returns `metadata: undefined` for teachers (line 45). Update to expose profiles only:

```typescript
const metadata = activity.metadata as ActivityMetadata | null;

metadata: session.user.role === "researcher"
  ? metadata
  : session.user.role === "teacher"
    ? { profiles: metadata?.profiles ?? [] }
    : undefined,
```

This keeps the API consistent with the page for any future client-side fetches.

### No schema changes needed

All data already exists in `Activity.metadata` JSONB. No migration required.

---

## Component Structure

All components co-located under the route (page-specific, not shared). Extract to `src/components/` only if reuse emerges later.

```
src/app/teacher/activities/[id]/
  page.tsx                    — Server component (fetches activity with metadata.profiles)
  activity-preview.tsx        — REWRITE: tabbed layout replacing current two-column
  overview-tab.tsx            — Flaw distribution bars + key patterns
  team-tab.tsx                — Agent cards with disposition + expected flaws
  agent-card.tsx              — Individual agent card
  transcript-tab.tsx          — Annotated transcript with flaw highlights
  flaw-highlight.tsx          — Inline flaw badge + expandable detail card
```

### Flaw type abbreviations (new convention)

The existing `FLAW_TYPES` constant in `src/lib/types.ts` has full labels but no abbreviations. Add an `abbrev` field to each entry:

| Type | Abbreviation |
|------|-------------|
| Reasoning | **R** |
| Epistemic | **E** |
| Completeness | **Cp** |
| Coherence | **Co** |

This keeps all flaw display info in one place rather than introducing a separate constant.

### Reuse from existing components

- `AgentAvatar` — already renders colored initials from agent_id via hash-based coloring
- `PresentationView` / `DiscussionView` — transcript rendering for Student View toggle. Already used in the current `activity-preview.tsx` with stub callbacks (`onTextSelected={() => {}}`, `annotations={[]}`). Student View can reuse this directly.
- `FLAW_TYPES` from `src/lib/types.ts` — color and label constants for all 4 flaw types. Already used throughout the app.
- `AnnotatableText` — the offset-based text rendering system (`data-seg-start`/`data-seg-end` spans). The transcript tab's flaw highlighting should build on this approach, not inline text insertion.
- `EvaluationPanel` — the flaw detail card layout (type badge, severity, description, evidence, explanation) can be extracted as a reusable `FlawDetailCard`.

### New component needed: `flaw-highlight.tsx`

`HighlightedContent` in `recognize-mode.tsx` is **not reusable** for this feature. It is tightly coupled to recognize mode: manages attempt tracking, response cards, answer states (correct/wrong/attempted), false positive injection, and `crossSectionOwner` logic that shows badges only in the first section. A new `flaw-highlight.tsx` component is needed that:

- Uses `evaluation.flaws[].location.references[]` (section/turn IDs) and `evaluation.flaws[].evidence` (text) to locate highlight regions within the transcript
- Renders type-colored background highlights using the same color tokens as `AnnotatableText` (`bg-red-50`, `bg-amber-50`, `bg-blue-50`, `bg-purple-50`)
- Shows clickable badges (abbreviation + color) that expand flaw detail cards
- Supports multi-location flaws with badges in *every* referenced section (unlike recognize mode's first-section-only approach)

---

## Interaction Flow

1. Teacher clicks "Preview transcript & evaluation" on session creation form
2. New tab opens to `/teacher/activities/[id]`
3. **Overview tab** loads first — teacher scans flaw distribution and key patterns (10 seconds)
4. Teacher clicks **Meet the Team** — reads persona cards, understands who produces which flaws and why they're hard/easy to detect (1-2 minutes)
5. Teacher clicks **Transcript** — skims the annotated transcript, clicks a few flaw badges to read details, toggles to Student View to see the clean version (2-3 minutes)
6. Teacher returns to session creation tab with enough context to choose modes and prepare scaffolds

Total preview time: ~5 minutes for a thorough read. Can be skimmed in under a minute (Overview tab only).

---

## Edge States

| State | Behavior |
|-------|----------|
| 0 evaluated flaws | Overview tab shows "No flaws detected" with a note that this is unusual. Transcript tab renders clean (no badges). Meet the Team still shows expected flaws (dimmed, marked "Not detected in transcript"). |
| Agent with no expected flaws | Card omits the "Expected Flaws" section entirely. Shows disposition only. |
| No evaluation data yet | Overview and Transcript tabs show: "Evaluation pending — check back shortly." Meet the Team tab still works (uses profile data, not evaluation). |
| Agent in profiles but not in transcript | Card shows "Does not appear in transcript" instead of "Speaks in." (Defensive — shouldn't happen in practice.) |

---

## What This Does NOT Include

- **Teaching notes** — auto-generated instructional advice per agent. Deferred; the disposition + expected flaws provide enough for the teacher to draw their own conclusions.
- **Knowledge profiles** — the 4-category knowledge breakdown (strong/shallow/misconception/blind spot) per agent. This is design internals, not instructional surface. Expected flaws are the pedagogically relevant output.
- **Transcript metadata** — per-turn knowledge area engagement, reactive tendency activation, rationale. This is researcher-level detail about how the LLM generated each turn.
- **Mode recommendations** — "Based on this activity's difficulty, we suggest Classify for advanced groups." Deferred; requires more design work on what signals drive recommendations.
