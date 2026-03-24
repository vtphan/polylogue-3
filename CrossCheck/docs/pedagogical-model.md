# CrossCheck — Pedagogical Model, Gap Analysis, and Implementation Plan

CrossCheck teaches middle school students to identify critical thinking flaws in AI-generated discourse. This document describes the pedagogical model (Bloom's × ZPD with CLT governance), audits the current codebase against the model, identifies every gap, and provides a detailed implementation plan for a coding agent.

---

## Part 1: Theoretical Framework

### 1.1 Bloom's Revised Taxonomy — The Task Dimension

Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001) describes six levels of cognitive processing:

| Level | Cognitive Process | In CrossCheck |
|-------|------------------|---------------|
| **Remember** | Recall facts, definitions, terminology | Learn flaw type definitions and examples |
| **Understand** | Explain ideas, interpret meaning | Explain why a shown passage is a flaw |
| **Apply** | Use knowledge in a bounded, guided context | Find a flaw given its type and location area |
| **Analyze** | Break material into parts, examine relationships | Read a transcript and independently identify flaws |
| **Evaluate** | Make judgments, justify decisions | Classify flaws by type and severity, explain reasoning |
| **Create** | Produce new work, synthesize | Write corrections, evaluate peers' work (future) |

**Role in CrossCheck:** Bloom's levels map to difficulty modes. The mode determines what cognitive work the task demands.

### 1.2 Zone of Proximal Development — The Support Dimension

Vygotsky's ZPD (1978) defines three zones:

- **Zone of Actual Development:** What the learner can do independently. Too easy — no learning.
- **Zone of Proximal Development:** What the learner can do with support. Where learning happens.
- **Beyond ZPD:** What the learner cannot do even with help. Frustration, not learning.

Scaffolding (Wood, Bruner, & Ross, 1976) is temporary support that is contingent, fading, and transfers responsibility to the learner.

**Role in CrossCheck:** Support comes from three sources:
- **App-provided structure:** The difficulty mode provides baseline scaffolding (Recognize gives locations; Spot gives nothing).
- **Teacher interventions:** The 6-level scaffold system lets the teacher add support within any mode.
- **Peer scaffolding:** Individual→group phase transition creates MKO relationships between students.

### 1.3 Cognitive Load Theory — The Design Constraint

CLT (Sweller, 1988) says working memory is limited. Three types of cognitive load:

- **Intrinsic load:** Inherent task difficulty. Managed by Bloom's level selection.
- **Extraneous load:** Unnecessary effort from poor design. Minimized by adapting the UI per mode.
- **Germane load:** Productive schema-building effort. Maximized by ZPD-calibrated scaffolding.

**Role in CrossCheck:** CLT constrains the 2D space. As Bloom's level increases (more intrinsic load), the app must reduce extraneous load (simplify UI) and calibrate support (manage germane load). Each difficulty mode should show only what's needed for that cognitive level.

### 1.4 The Integrated Model — A 2D Space with CLT Governance

```
    ZPD (support level)
    ↑
    │
    │  Maximum     ╔══════════════════════════════════════════╗
    │  support     ║          TOO EASY                       ║
    │              ║     (below ZPD — no productive          ║
    │              ║      struggle, no germane load)          ║
    │              ╠══════════════════════════════════════════╣
    │  Moderate    ║                                          ║
    │  support     ║      PRODUCTIVE STRUGGLE ZONE            ║
    │              ║                                          ║
    │              ║   (intrinsic load matched by support,    ║
    │              ║    germane load maximized,                ║
    │              ║    extraneous load minimized by design)   ║
    │              ║                                          ║
    │              ╠══════════════════════════════════════════╣
    │  Minimal     ║       TOO HARD                           ║
    │  support     ║  (above ZPD — cognitive overload,        ║
    │              ║   frustration, no learning)              ║
    │              ╚══════════════════════════════════════════╝
    │  Independent
    │
    └──────────────────────────────────────────────────────────→ Bloom's
         Remember   Understand   Apply    Analyze    Evaluate   Create
```

| Framework | Determines | Axis/Role |
|-----------|-----------|-----------|
| Bloom's Revised Taxonomy | What cognitive work the task requires | X-axis (task complexity) |
| Zone of Proximal Development | How much support the student receives | Y-axis (support level) |
| Cognitive Load Theory | How the experience is designed at each point | Constraint (governs UI, information visibility, scaffold calibration) |

**Learning is movement through the space:** Right (harder tasks) + Down (less support). The teacher keeps each group inside the productive struggle band. The app minimizes extraneous load at every point.

---

## Part 2: Difficulty Modes — Full Specification

Six modes, one per Bloom's level (Analyze has two sub-levels):

### Learn (Remember)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Build vocabulary before first transcript exposure |
| **Student experience** | Screen shows 4 flaw types with definitions and one example each. Interactive matching: 4-6 short passages → "Which flaw type?" (4 options) → immediate feedback with explanation |
| **Duration** | 3-5 minutes. Assigned before first session or at teacher's discretion |
| **Transcript** | Not shown |
| **Bottom bar** | Hidden |
| **Sidebar** | Hidden |
| **UI shown** | Quiz cards only — definitions, example passages, multiple-choice questions |
| **Data source** | Static content: `FLAW_TYPES` constant + pre-written generic examples (not from the current activity) |
| **Group phase** | Not applicable — Learn is individual only |
| **Matching/feedback** | Immediate per question (correct/incorrect + explanation) |
| **CLT** | Very low intrinsic load. Zero extraneous load. Germane load focused on building the flaw type schema |

### Recognize (Understand)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Comprehend what makes a passage a flaw, given that the flaw is already shown |
| **Student experience** | Transcript displayed with passages pre-highlighted (from evaluation `evidence` field). For each highlighted passage, a response card asks: (1) "What type of problem is this?" — 4 options; (2) "Why is this a problem?" — 2-3 options (one correct, distractors from `explanation`). After answering, shows the evaluator's explanation |
| **Transcript** | Shown with pre-highlighted passages (colored background on flaw evidence text) |
| **Bottom bar** | Hidden — no text selection or annotation |
| **Sidebar** | Hidden — response cards are inline or in a panel below each highlighted passage |
| **UI shown** | Transcript + response cards + feedback explanations |
| **Data source** | `activity.evaluation.flaws[].evidence` for highlights, `flaws[].flaw_type` for correct answer, `flaws[].explanation` for feedback. Distractors generated from other flaw types' explanations |
| **Group phase** | Students answer individually, then discuss answers physically before group submission. Group submission = confirm answers together |
| **Matching/feedback** | Per-flaw: correct type + correct reason = full credit. Shown after each response (immediate) |
| **CLT** | Low intrinsic load (comprehension, not identification). Highlighted passages direct attention, eliminating visual search |

### Locate (Apply)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Find a flaw given its type and general area |
| **Student experience** | Hint card at top: "There's a **[flaw_type]** flaw in **[section/turn range]**. Can you find it?" Student reads the indicated area and highlights the passage they think contains the flaw. Other sections/turns are visually de-emphasized (dimmed) |
| **Transcript** | Shown with target section/turns at full opacity, others dimmed (opacity-40 or similar) |
| **Bottom bar** | Single "Flag this" button (no flaw type selection — the type is given in the hint) |
| **Sidebar** | Hint card component showing: flaw type badge + location + reading strategy for that type. Annotation list below (what student has flagged so far) |
| **UI shown** | Transcript (with emphasis) + hint card + simplified bottom bar + annotation list |
| **Data source** | `activity.flawIndex[]` for hints: `flaw_type` + `locations[]`. One hint card per reference flaw, revealed sequentially or all at once (teacher's choice) |
| **Hint progression** | Two levels: (1) flaw type + section/turn range; (2) flaw type + specific agent name. Teacher sends Level 2 as a scaffold if student is stuck |
| **Group phase** | Same hint cards for the whole group. Students search independently, compare in group phase. Confirm/unconfirm works as in Classify |
| **Matching** | Location-only matching (did the student highlight within the correct section/turn?). Type is given, not assessed |
| **CLT** | Moderate intrinsic load. Dimmed sections reduce visual search (extraneous). Hint card provides cognitive frame (germane) |

### Spot (Analyze — beginning)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Independently identify problematic passages — no hints |
| **Student experience** | Read the full transcript. Highlight any passage that seems wrong. No flaw type classification required |
| **Transcript** | Full, no emphasis or dimming |
| **Bottom bar** | Single "Flag this" button. Undo button. Annotation count |
| **Sidebar** | Flaw Field Guide (definitions + reading strategies, expandable). Annotation list (click to scroll) |
| **UI shown** | Full transcript + field guide + simplified bottom bar |
| **Data source** | None — student works independently |
| **Group phase** | Full individual→group flow with confirm/unconfirm |
| **Matching** | Location-only (any annotation at a flaw's location counts as found, regardless of type) |
| **CLT** | High intrinsic load (independent identification). Field guide provides just-in-time support. No extraneous type selection UI |

### Classify (Analyze — full)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Independently identify AND categorize flaws by type |
| **Student experience** | Read the full transcript. Highlight passages, pick flaw type from 4 categories |
| **Transcript** | Full, no emphasis or dimming |
| **Bottom bar** | 4 flaw type buttons (color-coded). Undo button. Annotation count |
| **Sidebar** | Flaw Field Guide + annotation list with flaw type badges |
| **UI shown** | Full transcript + field guide + full bottom bar |
| **Data source** | None — student works independently |
| **Group phase** | Full individual→group flow with confirm/unconfirm |
| **Matching** | Location + type matching (standard 3-pass: green exact, blue wrong-type, red false positive) |
| **CLT** | High intrinsic load (identify + categorize). Flaw type buttons and color coding reduce decision overhead |

**This is the current default mode. Fully implemented.**

### Analyze (Evaluate)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Full critical analysis: find, categorize, judge severity, explain reasoning |
| **Student experience** | Same as Classify, plus: severity dropdown (minor/moderate/major) and explanation text area for each annotation |
| **Transcript** | Full |
| **Bottom bar** | 4 flaw type buttons + severity dropdown + explanation field. Undo button |
| **Sidebar** | Flaw Field Guide + annotation list with severity badges |
| **UI shown** | Full transcript + field guide + extended bottom bar |
| **Data source** | None — student works independently |
| **Group phase** | Full individual→group flow with confirm/unconfirm |
| **Matching** | Location + type + severity matching. Explanation compared qualitatively in feedback |
| **CLT** | Highest intrinsic load (5 sub-tasks: find, read closely, categorize, judge, explain). Only for advanced students who have mastered Classify |

**Currently labeled "Full" in the UI. Partially implemented — severity dropdown and explanation textarea are not wired.**

---

## Part 3: Current State Audit

### What's Implemented

**Difficulty modes:** 3 of 6 (Spot, Classify, Full/Analyze partial). Stored in `group.config.difficulty_mode`.

**Scaffolding:** 6-level teacher scaffold system with 12 templates, real-time delivery via Socket.IO, acknowledgment tracking. All manual — no smart suggestions.

**Peer scaffolding:** Individual→group phase transition with group consensus (confirm/unconfirm, 2-vote threshold, `isGroupAnswer` field).

**Feedback:** 3-pass matching engine (green/blue/red/yellow). Feedback view with transcript tab + annotations/flaws tab. Teacher comments and bonus find flags. Student progress page with cross-session detection rates.

**CLT compliance:** Metadata hidden from students. Phase-appropriate UI (annotation tools hidden in reviewing). Fixed bottom bar. Spot mode uses single "Flag this" button.

**Real-time:** Socket.IO with room validation, connection tracking, live annotation feed on teacher dashboard.

### Gap Inventory

Each gap is numbered for reference in the implementation plan.

**Student interface gaps:**

| # | Gap | Model Requirement | Current State |
|---|-----|-------------------|---------------|
| G1 | No Learn mode | Bloom's Remember — vocabulary primer with quiz cards | No page or component exists |
| G2 | No Recognize mode | Bloom's Understand — pre-highlighted passages with structured responses | No component for pre-highlighted passages or response cards |
| G3 | No Locate mode | Bloom's Apply — hint cards with section emphasis | No hint card component, no section dimming capability |
| G4 | No Flaw Field Guide | ZPD static scaffolding — definitions, reading strategies, worked examples | FlawPalette shows one-line definitions only. No reading strategies. No worked examples. Not expandable on mobile |
| G5 | No discussion prompts in group phase | Peer ZPD — prompts when group members disagree on flaw types | Group phase shows annotations + confirm/unconfirm buttons only. No prompts |
| G6 | No progressive feedback | CLT — staged reveal (results first, explanations later) | Feedback view shows everything at once |
| G7 | No reflection prompts | Metacognition — auto-generated discussion questions after feedback | Neither feedback view nor projector view has reflection prompts |
| G8 | Progress page doesn't show mode trajectory | Cross-session narrative — which mode, what was the outcome | Shows detection rates and flaw type breakdown but not difficulty mode history |

**Teacher interface gaps:**

| # | Gap | Model Requirement | Current State |
|---|-----|-------------------|---------------|
| G9 | Difficulty selector has only 3 levels | 6 modes: Learn, Recognize, Locate, Spot, Classify, Analyze | Session creation form shows Spot / Classify / Full buttons |
| G10 | No mid-session difficulty change | ZPD fading — teacher changes group mode during session | Dashboard shows difficulty badge (read-only). No way to change |
| G11 | No smart scaffold suggestions | ZPD adaptive support — observations + pre-drafted scaffolds | Dashboard shows annotation counts but doesn't compare against reference to generate suggestions |
| G12 | No difficulty recommendations | Cross-session progression — suggest starting mode based on history | Session creation form has no recommendations |
| G13 | No feedback stage control | Progressive feedback — teacher controls when explanations are revealed | Single "Release Evaluation" button. No staged reveal |
| G14 | Projector view has no reflection prompts | Metacognition — discussion questions for class debrief | Shows group comparison stats and flaw breakdown only |

**CLT / UI adaptation gaps:**

| # | Gap | Model Requirement | Current State |
|---|-----|-------------------|---------------|
| G15 | UI doesn't adapt to difficulty mode | Each mode should show only what's needed | Same interface for all modes: same sidebar, same transcript view. Only bottom bar changes (Spot: single button vs. 4 buttons) |
| G16 | Sidebar shows flaw type categories in Spot mode | Redundancy effect — type info is extraneous when student doesn't classify | FlawPalette always shows 4 flaw types with descriptions |
| G17 | No mobile annotation support | CLT — accessible on tablets (common in classrooms) | FlawPalette is `hidden lg:block`. No drawer/modal alternative. No touch selection handling |

---

## Part 4: Implementation Plan

### Architecture Note for the Coding Agent

The CrossCheck app is at `CrossCheck/app/`. Key paths:

```
src/app/student/session/[id]/
  page.tsx                    — Server component (fetches data, determines which viewer to render)
  session-activity-viewer.tsx — Client component (annotation interface for Spot/Classify/Analyze)

src/app/student/activity/[id]/
  page.tsx                    — Server component (solo practice)
  activity-viewer.tsx         — Client component (simplified annotation interface)

src/components/annotation/
  flaw-toolbar.tsx            — FlawBottomBar (fixed bar at bottom)
  flaw-palette.tsx            — FlawPalette (sidebar with flaw types + annotation list)

src/components/transcript/
  presentation-view.tsx       — Renders presentation sections
  discussion-view.tsx         — Renders discussion turns
  annotatable-text.tsx        — Text spans with selection handling

src/components/feedback/
  feedback-view.tsx           — Reviewing phase feedback display

src/app/teacher/sessions/[id]/
  session-dashboard.tsx       — Teacher live dashboard (933 lines)

src/app/teacher/sessions/[id]/class-view/
  page.tsx                    — Projector view for class debrief

src/app/teacher/sessions/new/
  create-session-form.tsx     — Session creation with per-group difficulty

src/lib/
  types.ts                    — FlawType, Annotation, etc.
  matching.ts                 — 3-pass annotation matching engine
  scaffold-templates.ts       — 12 pre-loaded scaffold templates

src/hooks/
  useSessionSocket.ts         — Socket.IO event handlers
```

**Data already available in the database (no pipeline changes needed):**
- `activity.evaluation.flaws[]` — Each flaw has: `flaw_id`, `flaw_type`, `severity`, `location.references[]`, `description`, `evidence` (quoted text), `explanation`
- `activity.flawIndex[]` — Denormalized: `[{flaw_id, locations[], flaw_type, severity}]`
- `group.config` — JSONB, currently stores `{difficulty_mode: "spot"|"classify"|"full"}`

**Current difficulty mode values:** `"spot"`, `"classify"`, `"full"` (stored in `group.config.difficulty_mode`). New modes will add: `"learn"`, `"recognize"`, `"locate"`. The `"full"` value maps to the "Analyze" mode described in this document.

---

### Phase A: New Difficulty Modes + Mode-Adaptive UI

**Fixes gaps:** G1, G2, G3, G9, G15, G16

**Priority: Highest.** Without Learn/Recognize/Locate, the app is only usable by students who can already independently identify flaws.

#### A1. Schema + Data Changes

**No Prisma migration needed.** Difficulty mode is stored in `group.config` JSONB — adding new string values requires no schema change. But update validation:

File: `src/app/api/sessions/route.ts`
- The POST handler accepts `difficultyMode` per group. Currently no validation on the value. Add validation:
  ```typescript
  const VALID_MODES = ["learn", "recognize", "locate", "spot", "classify", "full"];
  ```

File: `src/app/student/session/[id]/page.tsx`
- Update the type cast: `as "learn" | "recognize" | "locate" | "spot" | "classify" | "full"`

**New model for Recognize mode responses:**

Recognize mode produces structured responses (not text-selection annotations). Create a new Prisma model:

```prisma
model FlawResponse {
  id         String   @id @default(uuid()) @db.Uuid
  groupId    String   @map("group_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  flawId     String   @map("flaw_id")       // Reference flaw ID from evaluation
  typeAnswer String   @map("type_answer")    // Student's flaw type choice
  typeCorrect Boolean @map("type_correct")   // Was the type choice correct?
  reasonAnswer String? @map("reason_answer") // Student's reason choice (optional)
  reasonCorrect Boolean? @map("reason_correct")
  createdAt  DateTime @default(now()) @map("created_at")

  group      Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])

  @@map("flaw_responses")
}
```

Add `flawResponses FlawResponse[]` to Group and User models. Run migration.

**New API route:** `POST /api/flaw-responses` — Create a flaw response (for Recognize mode). Validate group membership and session phase.

#### A2. Session Creation Form — 6 Difficulty Levels

File: `src/app/teacher/sessions/new/create-session-form.tsx`

Replace the 3-button difficulty selector in each group card with 6 options. Use a compact layout to avoid overwhelming the form:

```tsx
{[
  { value: "learn", label: "Learn", desc: "Vocabulary primer" },
  { value: "recognize", label: "Recognize", desc: "Explain shown flaws" },
  { value: "locate", label: "Locate", desc: "Find hinted flaws" },
  { value: "spot", label: "Spot", desc: "Find on your own" },
  { value: "classify", label: "Classify", desc: "Find + categorize" },
  { value: "full", label: "Analyze", desc: "Full analysis" },
].map((opt) => (
  <button ... />
))}
```

Each button is a small pill: `text-xs px-2 py-1 rounded-full`. Selected = blue border + bg. Unselected = gray border.

#### A3. Student Session Page — Mode Branching

File: `src/app/student/session/[id]/page.tsx`

The server component currently renders either `<FeedbackView>` (reviewing) or `<SessionActivityViewer>` (annotating). Add mode branching:

```tsx
if (isReviewing) {
  return <FeedbackView ... />;
}

switch (difficultyMode) {
  case "learn":
    return <LearnMode activityId={activity.id} groupId={group.id} sessionId={id} userId={session.user.id} />;
  case "recognize":
    return <RecognizeMode ... flaws={evaluationFlaws} transcript={...} agents={...} />;
  case "locate":
    return <LocateMode ... flawIndex={...} transcript={...} agents={...} />;
  default:
    return <SessionActivityViewer ... />;  // spot, classify, full
}
```

Pass the evaluation flaws and flaw index from the server component (already available as `activity.evaluation` and `activity.flawIndex`).

#### A4. New Component: LearnMode

File: `src/components/modes/learn-mode.tsx` (new)

A self-contained component with no transcript. Shows:

1. **Definitions section:** 4 cards, one per flaw type. Each card: colored badge + name + middle-school definition (from `FLAW_TYPES` constant) + one generic example passage.

2. **Quiz section:** 4-6 short passages (hardcoded generic examples, not from the current activity). Each passage is followed by:
   - "What type of flaw is this?" — 4 radio buttons
   - Submit button → shows correct/incorrect + explanation
   - "Next" button to advance

3. **Completion:** After all questions, show score and "Ready to start!" message. POST to `/api/flaw-responses` to record completion (or store locally).

**Static content needed:** Create `src/lib/learn-mode-content.ts` with 6-8 generic flaw examples. Each example:
```typescript
{ passage: string, flawType: FlawType, explanation: string }
```

Write these at a middle-school reading level. Examples:
- Reasoning: "Everyone in our neighborhood recycles, so recycling must be the best way to help the environment." (overgeneralization)
- Epistemic: "Scientists proved that eating chocolate every day makes you smarter." (overstating evidence)
- Completeness: "Our plan is to plant 100 trees in the school yard. This will solve the air quality problem." (no feasibility analysis)
- Coherence: Speaker A says "We need to use solar energy" but Speaker B's solution only uses wind power, and neither addresses the disagreement. (team inconsistency)

#### A5. New Component: RecognizeMode

File: `src/components/modes/recognize-mode.tsx` (new)

Props: `{ sessionId, groupId, userId, transcript, agents, activityType, flaws }` where `flaws` is the evaluation flaws array.

Layout:
- Full transcript rendered via `<PresentationView>` or `<DiscussionView>` (read-only, `onTextSelected` is a no-op)
- Pre-highlighted passages: for each flaw, find the text matching `flaw.evidence` in the corresponding section/turn content and render it with a colored background (e.g., `bg-yellow-100 border-l-4 border-yellow-400`)
- Below each highlighted passage, a `<ResponseCard>` component

**ResponseCard component** (`src/components/modes/response-card.tsx`, new):
- "What type of problem is this?" — 4 buttons (flaw type pills), one correct
- After selection: green highlight on correct answer, red on wrong. Show the evaluator's `explanation`
- "Why is this a problem?" — 2-3 text options (correct reason from `flaw.explanation`, distractors from other flaws' explanations). This part is optional and can be deferred.
- POST to `/api/flaw-responses` with `{ groupId, flawId, typeAnswer, typeCorrect }`

**Pre-highlighting implementation:** The transcript components (`PresentationView`, `DiscussionView`) render content via `<AnnotatableText>`. Add a `highlights` prop (array of `{start, end, flawId}`) that renders highlighted spans with a distinct style (background color, not underline — different from annotation underlines). The `AnnotatableText` component's `buildSegments` function can be extended to handle highlight ranges in addition to annotation ranges.

Alternative (simpler): Don't modify `AnnotatableText`. Instead, render the transcript as plain text (no selection handling) and insert highlighted `<mark>` elements around the evidence text. Since Recognize mode doesn't support text selection, the `AnnotatableText` component isn't needed — use a simpler read-only renderer.

**Group phase in Recognize:** After individual responses, group phase reveals all members' answers. Students discuss disagreements physically. A group submission confirms answers together.

#### A6. New Component: LocateMode

File: `src/components/modes/locate-mode.tsx` (new)

Props: `{ sessionId, groupId, userId, transcript, agents, activityType, flawIndex, readOnly, sessionPhase }`

Layout:
- **Hint card** at top (new component `src/components/modes/hint-card.tsx`):
  ```
  ┌──────────────────────────────────────────┐
  │ 🔍 Find the reasoning flaw               │
  │ Look in the Findings section.            │
  │                                          │
  │ Reasoning: "Watch for jumps from         │
  │ evidence to conclusion."                 │
  └──────────────────────────────────────────┘
  ```
  - Shows one flaw at a time (or all, configurable by teacher)
  - Flaw type badge + location reference + reading strategy for that type (from the field guide content)
  - Progress indicator: "Hint 1 of 5"

- **Transcript** rendered via `<PresentationView>` or `<DiscussionView>`, but with section emphasis:
  - Target section/turn: normal opacity
  - Other sections/turns: `opacity-40` (CSS class applied via prop)
  - To implement: add an `emphasizedItems` prop to `PresentationView` and `DiscussionView` — an array of `section_id` or `turn_id` strings. Sections/turns not in the array get `opacity-40`.

- **Bottom bar:** Single "Flag this" button (same as Spot mode). The flaw type is recorded automatically from the hint card's type.

- **Sidebar:** Hint card + annotation list (what the student has flagged so far). No flaw type legend (extraneous — type is given).

**Matching:** Location-only. The student's highlighted passage is matched against the hinted flaw's `locations[]`. If the annotation is within the correct section/turn, it's a match.

#### A7. Mode-Adaptive UI

Each mode must show only what's needed (CLT compliance).

File: `src/app/student/session/[id]/session-activity-viewer.tsx`
- Currently always renders: transcript + FlawPalette sidebar + FlawBottomBar
- For `spot` and `classify` and `full`: keep current behavior but replace FlawPalette with FlawFieldGuide (Phase B)
- For `learn`, `recognize`, `locate`: these use their own components (A4-A6), so `SessionActivityViewer` is not rendered for those modes. The branching in the server component (A3) handles this.

File: `src/components/annotation/flaw-toolbar.tsx`
- Already adapts for Spot mode (single button). Ensure it also works for Locate mode (single button, records type from hint).
- For `learn` and `recognize`: not rendered (handled by mode branching).

File: `src/components/annotation/flaw-palette.tsx`
- For `spot`: replace with FlawFieldGuide (no flaw type counts, just definitions + strategies + annotation list)
- For `classify`/`full`: show FlawFieldGuide + annotation list with flaw type badges (current behavior enhanced)
- For `learn`/`recognize`/`locate`: not rendered (handled by mode branching)

---

### Phase B: Flaw Field Guide

**Fixes gaps:** G4, G17

**Priority: High.** Supports all annotation modes (Spot, Classify, Analyze) and addresses mobile.

#### B1. New Component: FlawFieldGuide

File: `src/components/annotation/flaw-field-guide.tsx` (new)

Replaces `FlawPalette` in the sidebar for Spot/Classify/Analyze modes.

Two sections:

**1. Reference section (always available, collapsible):**
- 4 flaw type cards with:
  - Name + colored badge
  - Middle-school definition (from `FLAW_TYPES`)
  - "What to look for" reading strategy (one sentence):
    - Reasoning: "Watch for jumps from evidence to conclusion. Ask: does the proof match the claim?"
    - Epistemic: "Notice when someone sounds very sure. Ask: how do they actually know this?"
    - Completeness: "After reading, ask: who's missing? What could go wrong?"
    - Coherence: "Compare what different speakers say. Do they contradict each other?"

**2. Annotation list (below reference):**
- Same as current FlawPalette annotation list: click to scroll, hover to delete, confirm/unconfirm in group phase
- Shows flaw type badge per annotation

**Mobile drawer (addresses G17):**
- On screens < 1024px (`lg:` breakpoint), add a floating button above the bottom bar: "📖 Guide" or a book icon
- Tapping opens a slide-up drawer (fixed position, max-height 60vh, scrollable) showing the field guide content
- Close button at top of drawer
- This replaces the `hidden lg:block` sidebar with an accessible alternative

#### B2. Modify Existing Components

File: `src/app/student/session/[id]/session-activity-viewer.tsx`
- Replace `<FlawPalette ... />` with `<FlawFieldGuide ... />` for `spot`, `classify`, `full` modes
- FlawFieldGuide accepts same props as FlawPalette (`annotations`, `onAnnotationClick`, `onAnnotationDelete`, `onConfirm`, `sessionPhase`, `userId`) plus an `expanded` prop for mobile drawer state

File: `src/app/student/activity/[id]/activity-viewer.tsx`
- Same replacement for solo practice mode

---

### Phase C: Smart Scaffold Suggestions

**Fixes gaps:** G11

**Priority: High.** Makes teachers more effective during live sessions.

#### C1. Suggestion Engine

File: `src/lib/scaffold-suggestions.ts` (new)

A pure function: `generateSuggestions(groups, flawIndex, difficultyMode) → Suggestion[]`

Input: groups with their annotations + the reference flaw index + each group's difficulty mode.
Output: array of suggestions, each with:
```typescript
interface ScaffoldSuggestion {
  groupId: string;
  groupName: string;
  type: "coverage_gap" | "type_gap" | "inactivity" | "high_false_positives" | "ready_to_advance";
  message: string;           // Human-readable observation
  suggestedScaffold: string; // Pre-drafted scaffold text
  suggestedLevel: number;    // Scaffold level (1-6) adapted to group's mode
}
```

Logic per suggestion type:
- **Coverage gap:** For each reference flaw, check if any group annotation matches its location. If N+ flaws in a section/turn range have no annotations, suggest: "Group X hasn't looked at Section 3 (3 flaws there)."
- **Type gap:** Count group annotations by flaw type vs. reference flaw types. If reference has 4 epistemic flaws and group has 0 epistemic annotations, suggest: "Group X found reasoning flaws but 0 epistemic."
- **Ready to advance:** If group has found 70%+ of flaws at current mode, suggest: "Group X found 6 of 8 flaws on Locate. Consider Spot."

#### C2. Dashboard Integration

File: `src/app/teacher/sessions/[id]/session-dashboard.tsx`

Add a `<ScaffoldSuggestions>` section after the group grid and before the scaffold form:

```tsx
{suggestions.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
    <h3 className="text-sm font-medium text-amber-800 mb-2">Suggestions</h3>
    {suggestions.map((s) => (
      <div key={s.groupId + s.type} className="text-sm text-amber-700 mb-2 flex items-center justify-between">
        <span>{s.message}</span>
        <button onClick={() => { setScaffoldGroupId(s.groupId); setScaffoldText(s.suggestedScaffold); }}>
          Send
        </button>
      </div>
    ))}
  </div>
)}
```

Recompute suggestions via `useMemo` whenever `session.groups` changes (which updates via Socket.IO). No API call needed — all data is already on the dashboard.

---

### Phase D: Progressive Feedback + Reflection Prompts

**Fixes gaps:** G6, G7, G13, G14

**Priority: Medium.** Turns feedback from passive to active learning.

#### D1. Feedback Stage Control

Add `feedback_stage` to group config JSONB. Values: `1` (results only) or `2` (full explanations). Default: `1` when entering reviewing phase.

File: `src/app/api/sessions/[id]/route.ts`
- In the PATCH handler, when `status` transitions to `"reviewing"`, set `feedback_stage: 1` in all groups' config.
- Add a new action: `{ action: "reveal_explanations" }` that sets `feedback_stage: 2` for all groups. Emit Socket.IO event `session:feedback_revealed`.

File: `src/app/teacher/sessions/[id]/session-dashboard.tsx`
- In reviewing phase, show "Reveal Explanations" button (next to "Class View" and "Reopen"). When clicked, PATCH the session with `{ action: "reveal_explanations" }`.

File: `src/components/feedback/feedback-view.tsx`
- Accept a `feedbackStage` prop (1 or 2).
- Stage 1: Show match indicators (green/blue/red/yellow) and summary stats. Show "Your Annotations" with match badges. **Hide** the "Reference Evaluation" column and the explanation text on each annotation card.
- Stage 2: Show everything (current behavior).

File: `src/app/student/session/[id]/page.tsx`
- Read `feedbackStage` from group config and pass to `<FeedbackView>`.

#### D2. Reflection Prompts on Projector View

File: `src/app/teacher/sessions/[id]/class-view/page.tsx`

Add a "Discussion Questions" section at the bottom, auto-generated from match results:

```typescript
function generateReflectionPrompts(groups, flawIndex, evaluation): string[] {
  const prompts: string[] = [];

  // Most-found flaw
  const flawFoundCounts = new Map<string, number>();
  // ... count how many groups found each flaw
  const mostFound = // flaw found by most groups
  prompts.push(`${mostFoundCount} groups found the ${mostFound.flaw_type} flaw in ${mostFound.location}. What made it easy to spot?`);

  // Most-missed flaw
  const mostMissed = // flaw found by fewest groups
  prompts.push(`The most-missed flaw was a ${mostMissed.flaw_type} flaw (${mostMissed.severity}). Let's re-read it together.`);

  // Flaw type difficulty
  // ... which type had the lowest detection rate
  prompts.push(`${hardestType} flaws were the hardest — only ${rate}% found. What makes them tricky?`);

  // Bonus finds
  // ... any annotations flagged as bonus
  if (bonusCount > 0) {
    prompts.push(`${bonusCount} bonus finds — flaws students spotted that weren't in the reference. Were they real flaws?`);
  }

  return prompts;
}
```

Render as a list of cards with large text (designed for projection).

---

### Phase E: Group Discussion Prompts

**Fixes gaps:** G5

**Priority: Medium.** Enhances peer ZPD during group phase.

#### E1. New Component: DiscussionPrompt

File: `src/components/annotation/discussion-prompt.tsx` (new)

A small inline card rendered in the FlawFieldGuide or sidebar during group phase. Props: `{ annotations, members }`

Logic (computed client-side from annotation state):

```typescript
function generateDiscussionPrompts(annotations, members): DiscussionPrompt[] {
  const prompts = [];

  // Find annotations at the same location with different flaw types
  const byLocation = groupBy(annotations, a => a.location.item_id);
  for (const [itemId, anns] of byLocation) {
    const types = new Set(anns.map(a => a.flawType));
    if (types.size > 1) {
      const names = anns.map(a => members.find(m => m.user.id === a.userId)?.user.displayName).filter(Boolean);
      prompts.push({
        text: `${names[0]} and ${names[1]} chose different types for a passage in ${itemId}. Discuss: which fits better?`,
        location: itemId,
      });
    }
  }

  // Find passages where most but not all members annotated
  // ... similar logic

  return prompts;
}
```

Render as subtle cards in the sidebar:
```tsx
<div className="bg-purple-50 border border-purple-200 rounded p-2 text-xs text-purple-800">
  {prompt.text}
</div>
```

Only shown during group phase. Computed from local state (no API call).

---

### Phase F: Mid-Session Difficulty Changes + Recommendations

**Fixes gaps:** G10, G12, G8

**Priority: Medium.** Enables ZPD fading within and across sessions.

#### F1. Mid-Session Mode Change

File: `src/app/teacher/sessions/[id]/session-dashboard.tsx`
- The difficulty badge on each group card (currently read-only) becomes a clickable dropdown.
- On change: PATCH `/api/groups/[id]` with `{ config: { difficulty_mode: newMode } }`.

File: `src/app/api/groups/[id]/route.ts` (new)
- PATCH handler: validate teacher owns the session, update group config.
- Emit Socket.IO event: `io.to(\`group:${groupId}\`).emit("group:config_changed", { groupId, config })`.

File: `src/app/student/session/[id]/session-activity-viewer.tsx`
- Listen for `group:config_changed` event. On receive: show notification ("Your teacher changed your mode to Spot") and `router.refresh()` so the server component re-renders with the new mode.

File: `src/hooks/useSessionSocket.ts`
- Add `onGroupConfigChanged` handler type.

#### F2. Difficulty Recommendations

File: `src/app/teacher/sessions/new/create-session-form.tsx`

When the teacher selects an activity and creates groups, show a recommendation next to each group's difficulty selector:

- Fetch past session data for these students (query: sessions where these students participated, with match results).
- If data exists: "Based on past sessions, suggest: Locate" (small text below the selector).
- If no data: "First session — suggest: Learn or Recognize".

This requires a lightweight API endpoint or the session creation page can fetch past sessions server-side.

#### F3. Progress Page Mode Trajectory

File: `src/app/student/progress/page.tsx`
- Include the difficulty mode in each session's display.
- Show as a label next to the date: "Oct 3 — Locate mode — 62% detection".
- This helps students understand their own progression.

The data is available: join sessions → groups (where student is member) → group.config.difficulty_mode.

---

### Dependency Map and Implementation Order

```
Phase A (new modes + adaptive UI)
  ├── A1: Schema (FlawResponse model) + validation
  ├── A2: Session creation form (6 levels)
  ├── A3: Student page mode branching
  ├── A4: LearnMode component
  ├── A5: RecognizeMode + ResponseCard components
  ├── A6: LocateMode + HintCard components
  └── A7: Mode-adaptive UI cleanup
         │
Phase B (field guide) ←── can start in parallel with A
  ├── B1: FlawFieldGuide component + mobile drawer
  └── B2: Replace FlawPalette in viewers
         │
Phase C (scaffold suggestions) ←── after A (uses difficulty mode in suggestions)
  ├── C1: Suggestion engine (pure function)
  └── C2: Dashboard integration
         │
Phase D (progressive feedback) ←── independent of A-C
  ├── D1: Feedback stage control (API + dashboard + feedback view)
  └── D2: Reflection prompts on projector view
         │
Phase E (discussion prompts) ←── after B (renders in field guide sidebar)
  └── E1: DiscussionPrompt component
         │
Phase F (mid-session changes + recs) ←── after A (more modes to switch between)
  ├── F1: Mid-session mode change (API + dashboard + socket event)
  ├── F2: Difficulty recommendations on session creation
  └── F3: Progress page mode trajectory
```

### Summary Table

| Phase | Gaps Fixed | New Files | Modified Files | Schema | Effort |
|-------|-----------|-----------|---------------|--------|--------|
| A | G1, G2, G3, G9, G15, G16 | 6 components + 1 content file + 1 API route | 3 pages + 2 components | 1 model + migration | Large |
| B | G4, G17 | 1 component | 2 viewers | None | Small-Medium |
| C | G11 | 1 lib module | 1 dashboard | None | Medium |
| D | G6, G7, G13, G14 | 0 | 4 files (API, dashboard, feedback, projector) | 1 JSONB field | Medium |
| E | G5 | 1 component | 1 sidebar | None | Small |
| F | G10, G12, G8 | 1 API route | 3 files (dashboard, form, progress) | None | Medium |

---

## Part 5: The Student Journey (Semester View)

**Weeks 1-2: Learn + Recognize**
- Session 1: Learn mode (vocabulary, 5 min) → Recognize mode on a presentation
- Students see highlighted flaws, identify types, discuss why in groups
- Teacher sends metacognitive scaffolds ("Why is this a problem?")
- Feedback: immediate within Recognize mode
- Outcome: students know the 4 flaw types and what they look like

**Weeks 3-4: Locate**
- Sessions 2-3: Locate mode on presentations and discussions
- Hint cards give type + section; students search within bounded area
- Teacher sends Level 2-3 scaffolds (comparison prompts, nudges)
- Groups compare findings, confirm/reject in group phase
- Feedback: 2-stage reveal (results → explanations)
- Outcome: close reading skills, guided flaw identification

**Weeks 5-8: Spot + Classify**
- Sessions 4-7: Spot (find independently), then Classify (find + categorize)
- Teacher fades scaffolding: Level 2-3 → Level 1 as groups improve
- Group consensus central — students confirm/reject annotations
- Smart suggestions: "Group A is ready for Classify"
- Mixed modes: Group A on Classify, Group B on Spot
- Outcome: independent identification and categorization

**Weeks 9-12: Classify + Analyze**
- Sessions 8-11: Classify for most, Analyze for advanced groups
- Minimal scaffolding (Level 1 redirects only)
- Projector view reflection: "Why are epistemic flaws harder to spot?"
- Progress page shows trajectory: Learn → Recognize → Locate → Spot → Classify
- Outcome: full critical analysis with severity judgments and explanations

---

## Part 6: Design Principles

1. **The teacher is the pedagogical decision-maker.** The app surfaces information and suggests actions. It never sends scaffolds automatically or changes difficulty modes without the teacher.

2. **Less UI is more learning.** Every element on screen that isn't needed for the current task is extraneous load. Each mode shows only what that cognitive level requires.

3. **Scaffolding is temporary by design.** Every support feature has a path to removal. Hint cards disappear at Spot. The field guide is expandable, not permanent. Discussion prompts fade as groups develop habits.

4. **Physical discussion is the learning.** The app creates conditions for productive discussion and gets out of the way. Each mode generates different discussion triggers: Recognize ("Why is this a flaw?"), Locate ("Is it this passage or that one?"), Group consensus ("What type is this?").

5. **Productive struggle requires time.** A group idle for 3 minutes might be having a valuable discussion. Suggestions say "Group C has been idle" — not "Group C is stuck." The teacher decides.

6. **Feedback drives the next session.** Detection rates, type breakdowns, and mode trajectories inform the teacher's choices. The app suggests difficulty levels but doesn't prescribe them.
