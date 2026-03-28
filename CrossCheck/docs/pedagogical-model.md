# CrossCheck — Pedagogical Model

CrossCheck teaches middle school students to identify critical thinking flaws in AI-generated discourse. This document describes the pedagogical model: **Bloom's x ZPD, governed by CLT**. The teacher-facing organizing principle is an independence gradient; Bloom's provides the theoretical backbone.

---

## Part 1: Theoretical Framework

### 1.1 Independence Gradient — The Organizing Principle

CrossCheck's practice modes are organized by **how much the system does for the student**. As the student moves from Recognize to Explain, the system progressively withdraws support and the student takes on more cognitive work.

This is CrossCheck's own taxonomy. It mirrors Bloom's Revised Taxonomy (see Section 1.5) for academic audiences, but the teacher-facing UI never mentions Bloom's. The teacher's question is simply: "How much support does this group need?"

| Mode | System gives | Student does |
|------|-------------|-------------|
| **Recognize** | Shows the flaws, offers options | Identify flaw type from choices |
| **Locate** | Tells you what to find and roughly where | Find the specific passage |
| **Classify** | Nothing | Find flaws (optionally categorize) |
| **Explain** | Nothing | Find, categorize, judge severity, justify in writing |

**Learn** is a standalone vocabulary primer (accessible from the nav bar, not a session mode). It provides the prerequisite knowledge for all session modes.

### 1.2 Zone of Proximal Development — The Support Dimension

Vygotsky's ZPD (1978) defines three zones:

- **Zone of Actual Development:** What the learner can do independently. Too easy — no learning.
- **Zone of Proximal Development:** What the learner can do with support. Where learning happens.
- **Beyond ZPD:** What the learner cannot do even with help. Frustration, not learning.

Scaffolding (Wood, Bruner, & Ross, 1976) is temporary support that is contingent, fading, and transfers responsibility to the learner.

**Role in CrossCheck:** Support comes from four sources:
- **Mode selection:** The practice mode determines baseline scaffolding (Recognize gives everything; Classify gives nothing).
- **Per-mode granularity knob:** Each mode has one teacher-configurable setting that fine-tunes support within the mode.
- **On-demand hints:** In Classify and Explain, students can request section-level hints. Hint usage is tracked.
- **Teacher interventions:** The 6-level scaffold system lets the teacher add support within any mode.
- **Peer scaffolding:** Individual → group phase transition creates MKO relationships between students.

### 1.3 Cognitive Load Theory — The Design Constraint

CLT (Sweller, 1988) says working memory is limited. Three types of cognitive load:

- **Intrinsic load:** Inherent task difficulty. Managed by mode selection and granularity knobs.
- **Extraneous load:** Unnecessary effort from poor design. Minimized by adapting the UI per mode — each mode shows only what's needed.
- **Germane load:** Productive schema-building effort. Maximized by ZPD-calibrated scaffolding and false positives that require active discrimination.

**Role in CrossCheck:** CLT governs the UI. As the mode demands more independence, the app simplifies what's shown. Recognize shows response cards; Classify (detect only) shows a single button; Explain shows the full categorization + explanation interface. False positives in Recognize and Locate add productive germane load by requiring students to discriminate real flaws from non-flaws.

### 1.4 Bloom's Revised Taxonomy — The Task Dimension

Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001) describes six levels of cognitive processing. It provides the theoretical backbone of the independence gradient — each mode maps to a Bloom's level, which is why the modes are ordered the way they are.

The teacher-facing UI does not mention Bloom's. The independence gradient is the practitioner-facing translation of the same underlying structure.

| Mode | Bloom's Level | Rationale |
|------|--------------|-----------|
| Learn | Remember | Recall flaw type definitions and examples |
| Recognize | Understand | Explain why a shown passage is a flaw |
| Locate | Apply | Use knowledge in a bounded, guided search |
| Classify | Analyze | Independently identify (and optionally categorize) flaws |
| Explain | Evaluate | Make judgments, justify decisions with written reasoning |

### 1.5 The Integrated Model

```
    Support provided by system
    ↑
    │
    │  Maximum     Recognize (system shows flaws, offers options)
    │  support         │
    │                  │  Granularity knobs fine-tune within each mode
    │  Moderate    Locate (system gives type + area)
    │  support         │
    │                  │  "Show Hint" bridges Classify/Explain to Locate
    │  Minimal     Classify (system gives nothing)
    │  support         │
    │              Explain (system gives nothing; student justifies)
    │  Independent
    │
    └──────────────────────────────────────────────────────────────→
                              Independence gradient
```

| Framework | Role | Teacher controls it via |
|-----------|------|------------------------|
| **Bloom's** (task dimension) | Defines the independence gradient — why modes are ordered the way they are | Mode selection (Recognize → Locate → Classify → Explain) |
| **ZPD** (support dimension) | Determines how much help the student gets within a mode | Granularity knob + Show Hint + teacher scaffolds + peer phase |
| **CLT** (design constraint) | Governs the UI at each point — each mode shows only what's needed | Automatic (mode-adaptive UI, not teacher-configured) |

The teacher navigates a 2D space (Bloom's x ZPD) by choosing a mode (diagonal position) and adjusting the knob (vertical offset within that mode). CLT ensures the experience is well-designed at every point.

---

## Part 2: Practice Modes — Full Specification

Four session modes plus Learn (standalone). Each mode has one teacher-configurable granularity knob.

### Learn (Standalone)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Build vocabulary before first transcript exposure |
| **Student experience** | Screen shows 4 flaw types with definitions and one example each. Interactive quiz: 8 short passages → "Which flaw type?" → immediate feedback with explanation |
| **Duration** | 3-5 minutes. Accessible from nav bar at any time |
| **Transcript** | Not shown |
| **Session mode?** | No — standalone page. Not in the session creation picker |
| **Data source** | Static content: `FLAW_TYPES` constant + pre-written generic examples |
| **CLT** | Very low intrinsic load. Zero extraneous load. Germane load focused on building the flaw type schema |

### Recognize

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Comprehend what makes a passage a flaw, given that the flaw is already shown |
| **Student experience** | Transcript displayed with passages pre-highlighted. For each, a centered popup asks "What type of problem is this?" Students select from flaw type buttons. Some highlighted passages are **false positives** (not actual flaws) — students must also identify these via a "No flaw here" option |
| **Granularity knob** | `response_format`: **A/B choice** (correct type + 1 distractor, easier) or **multiple choice** (all 4 types, harder). Both include "No flaw here" |
| **False positives** | 1–2 non-flawed passages injected from sections with no real flaws. Deterministic per session+group. Teaches discrimination |
| **Transcript** | Shown with pre-highlighted passages (colored background on flaw evidence text) |
| **Bottom bar** | Hidden — response cards are centered popups |
| **Data source** | `activity.evaluation.flaws[].evidence` for highlights. False positives generated client-side |
| **Group phase** | Quiz-based consensus (different from annotation-based group phase in other modes) |
| **Matching** | Per-flaw: correct type = green. Multi-attempt with elimination (configurable max) |
| **CLT** | Low intrinsic load (comprehension, not identification). Highlighted passages direct attention. False positives add productive germane load |

### Locate

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Find a flaw given its type and general area — directed search |
| **Student experience** | Hint card at top: flaw type badge + location + reading strategy. Student reads the indicated area and flags the passage. Some hint cards are **false positives** — the student clicks "No flaw found" |
| **Granularity knob** | `hint_scope`: **sentence** (narrower location hint) or **section** (broader) |
| **False positives** | 1 non-flawed hint card injected from a section with no real flaws. "No flaw found" button resolves it. Persisted as FlawResponse |
| **Transcript** | Target section at full opacity, others dimmed |
| **Bottom bar** | Single "Flag This" button (+ "No flaw found" for false positive hints) |
| **Data source** | `activity.flawIndex[]` for hints. False positives generated client-side |
| **Group phase** | Annotation-based (same as Classify/Explain) |
| **Matching** | Location-only (`locationOnly: true`). Type is given, not assessed |
| **CLT** | Moderate intrinsic load. Dimmed sections reduce visual search. Hint card provides cognitive frame |

### Classify

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Independently identify flaws in the full transcript — open search |
| **Student experience** | Read full transcript. Select text. What happens next depends on the categorization knob |
| **Granularity knob** | `categorization`: **detect only** (single "Flag This" button, no type selection), **assisted** (correct type + random 1–3 distractors, varies per flaw), or **full** (all 4 flaw type buttons) |
| **Show Hint** | Always available. Each click reveals one unfound flaw's section (scroll + pulse animation). Hint-assisted annotations tracked with `hinted: true` |
| **Transcript** | Full, no emphasis or dimming |
| **Bottom bar** | Depends on categorization: single button / 2–4 dynamic buttons / all 4 buttons. Plus "Show Hint" (lightbulb icon with remaining count) |
| **Sidebar** | Flaw Field Guide (definitions, reading strategies, examples — compact in detect-only mode) + annotation list |
| **Data source** | `activity.flawIndex[]` for hint system comparison |
| **Group phase** | Annotation-based with confirm/unconfirm |
| **Matching** | Detect only: location-only (`locationOnly: true`). Assisted/Full: location + type |
| **CLT** | High intrinsic load (independent identification). Field guide provides just-in-time support. Detect-only removes categorization burden |

### Explain

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Full critical analysis: find, categorize, judge severity, explain reasoning |
| **Student experience** | Same as Classify (full), plus: after selecting a flaw type, an explanation prompt appears before saving |
| **Granularity knob** | `explanation_format`: **guided** ("This is a [type] flaw because ___" template) or **free text** (open textarea). Both include severity selector (minor/moderate/major) |
| **Show Hint** | Same as Classify — always available, tracked |
| **Transcript** | Full |
| **Bottom bar** | All 4 flaw type buttons + "Show Hint" |
| **Sidebar** | Flaw Field Guide + annotation list |
| **Data source** | `activity.flawIndex[]` for hint system |
| **Group phase** | Annotation-based with confirm/unconfirm |
| **Matching** | Location + type + severity. Explanation compared qualitatively in feedback |
| **CLT** | Highest intrinsic load (5 sub-tasks: find, read closely, categorize, judge, explain). Guided template reduces writing burden |

---

## Part 3: Cross-Cutting Features

### False Positives

False positives are non-flawed passages/sections presented alongside real flaws for evaluation. They appear in Recognize (highlighted passages) and Locate (hint cards). Students must identify them via "No flaw here" / "No flaw found" actions.

**Purpose:** Prevents the pattern-matching shortcut ("if it's highlighted, it's a flaw"). Forces genuine discrimination — is this even a flaw? — which is a higher-order skill than categorization alone.

**Implementation:** Generated client-side at render time from non-flawed sections. Deterministic seed (sessionId + groupId hash) ensures consistency across page refreshes. Not stored in the activity data model. Responses saved as `FlawResponse` records with `typeAnswer: "no_flaw"`.

### Show Hint System

Available in Classify and Explain modes. Each click reveals one unfound flaw's section by scrolling to it and applying a pulse animation.

**Purpose:** Bridges the gap from Locate to Classify. A student in Classify who uses hints is effectively doing Locate-lite; a student who never touches the button is doing full independent search. The mode adapts to the student.

**Implementation:** Compares student annotations against `flawIndex` by `item_id`. Tracks hints in client state (`hintsUsed` set of flaw IDs). Annotations created in hinted sections are saved with `hinted: true` in the database. Teacher dashboard shows hint usage per annotation (lightbulb icon) and summary stats ("X of Y hint-assisted").

### Per-Mode Granularity Knobs

Each mode has exactly one teacher-configurable setting stored in `group.config` JSONB alongside `difficulty_mode`. Teachers see the knob as a row of buttons below the mode pills on the session creation form.

| Mode | Knob | More support | Less support | Default |
|------|------|-------------|-------------|---------|
| Recognize | Response format | A/B (2 options + definitions) | Multiple choice (4 options) | multiple_choice |
| Locate | Hint scope | Sentence (narrower) | Section (broader) | section |
| Classify | Categorization | Detect only (flag) | Full (flag + type) | full |
| Explain | Explanation format | Guided (template) | Free text | guided |

Classify also has an **assisted** middle setting: correct type + random 1–3 distractors, varying per flaw.

---

## Part 4: Architecture Reference

### Key Paths

```
src/app/student/session/[id]/
  page.tsx                    — Server component (fetches data, routes to mode component)
  session-activity-viewer.tsx — Client component (Classify + Explain annotation interface)

src/components/modes/
  learn-mode.tsx              — Standalone vocabulary primer
  recognize-mode.tsx          — Pre-highlighted passages with response cards
  locate-mode.tsx             — Hint cards with directed search
  response-card.tsx           — Flaw type selection popup (used by Recognize)
  hint-card.tsx               — Flaw type + location hint (used by Locate)
  explanation-prompt.tsx      — Guided/free text explanation modal (used by Explain)

src/components/annotation/
  flaw-toolbar.tsx            — FlawBottomBar (adapts per mode + categorization)
  flaw-field-guide.tsx        — Expandable reference panel (desktop sidebar + mobile drawer)
  flaw-palette.tsx            — Annotation list sidebar

src/lib/
  types.ts                    — DifficultyMode, SessionMode, ModeConfig, MODE_KNOB_INFO
  matching.ts                 — 3-pass matching engine with locationOnly option

src/app/teacher/sessions/new/
  create-session-form.tsx     — 4 flat mode pills + per-mode knob panel
```

### Data Model

- `group.config` — JSONB: `{ difficulty_mode: "recognize"|"locate"|"classify"|"explain", [knob_key]: value }`
- `Annotation.hinted` — Boolean, default false. Set when student annotates in a section that was previously revealed by Show Hint
- `FlawResponse` — Stores Recognize quiz answers and Locate false positive resolutions. `typeAnswer` accepts "no_flaw" for false positives
- `activity.flawIndex[]` — `[{ flaw_id, locations[], flaw_type, severity }]`. Used by Locate hints, Classify/Explain Show Hint, and assisted mode button generation

### Practice Mode Values

Stored in `group.config.difficulty_mode`:
- `"recognize"` — Recognize mode
- `"locate"` — Locate mode
- `"classify"` — Classify mode (categorization sub-mode in same config)
- `"explain"` — Explain mode
- `"learn"` — Learn (legacy, kept for backward compat; not a session mode)

Historical values migrated: `"spot"` → `"classify"` (with `categorization: "detect_only"`), `"full"` → `"explain"`.
