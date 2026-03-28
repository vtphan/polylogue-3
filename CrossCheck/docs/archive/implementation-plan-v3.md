# Implementation Plan — Pedagogical Model v3

This plan migrates CrossCheck from the 4-mode/knob design to the three-stage session flow described in `pedagogical-model-v3.md`. It is organized into phases that can be implemented and tested independently.

---

## Current State Summary

**What exists (fully implemented):**
- 4 session modes: Recognize, Locate, Classify, Explain — each with per-mode knobs
- Recognize: pre-highlighted passages, response cards (A/B or 4-choice knob)
- Locate: sequential hint cards with directed search (sentence/section scope knob)
- Classify: full transcript annotation (detect-only/assisted/full categorization knob)
- Explain: full transcript annotation + explanation modal (guided/free-text knob)
- Teacher session creation with mode + knob picker per group
- Teacher dashboard with live Socket.IO updates
- Matching engine (3-pass: green/blue/red/yellow)
- Hint system in Classify/Explain (client-side only, reveals section + pulse)
- Group phase flow (individual → group → reviewing)
- Feedback view with match results

**What changes — summary:**
- 4 independently-selected modes → 3-stage sequential flow (Recognize → Explain → Locate)
- Teacher selects mode per group → teacher selects transcript only; all groups run same flow
- Individual + group phases within a mode → Recognize is individual, Explain and Locate are group
- Per-mode knobs → eliminated (all scaffolding via hints)
- Passage-based analysis → turn-by-turn analysis
- Explain: individual blank text box → group collaborative writing with write-then-reveal
- Recognize: "No flaw" option → productive failure for non-flawed turns
- Locate: always runs → conditional (triggers only if flaws remain unidentified)
- Locate hints: round-robin → student-targeted (section confirm/deny)
- Consensus group phase → structured disagreement from Recognize results
- Separate feedback per mode → single end-of-session results view across all stages
- Hint button: "Hint" → "Narrow it down" (strategic framing)
- Flaw Field Guide: removed from Recognize
- Session creation: mode pills + knobs → transcript selection only

---

## Phase 1: Data Layer + Stage Infrastructure

Update the database schema, types, API, and session state management to support the three-stage flow. No UI changes yet.

### 1.1 Schema Changes (`app/prisma/schema.prisma`)

**Add `HintUsage` table:**
```prisma
model HintUsage {
  id            String   @id @default(cuid())
  studentId     String
  student       User     @relation(fields: [studentId], references: [id])
  sessionId     String
  session       Session  @relation(fields: [sessionId], references: [id])
  groupId       String
  group         Group    @relation(fields: [groupId], references: [id])
  flawId        String?         // references activity.flawIndex[].flaw_id — null for non-flawed turns
  turnId        String          // which turn (item_id) the hint relates to
  hintLevel     Int             // 1, 2, or 3
  stage         String          // "recognize", "explain", "locate"
  targetSection String?         // Locate only: which section the student tapped
  createdAt     DateTime @default(now())

  @@index([studentId, sessionId])
  @@index([groupId])
}
```

**Add `Explanation` table (collaborative writing):**
```prisma
model Explanation {
  id          String   @id @default(cuid())
  turnId      String          // which turn this explains
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  groupId     String
  group       Group    @relation(fields: [groupId], references: [id])
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id])
  text        String
  revisionOf  String?         // id of the Explanation this revises (null = original)
  createdAt   DateTime @default(now())

  @@index([groupId, turnId])
  @@index([authorId])
}
```

**Modify `Group` model:**
- Add `stage String @default("recognize")` — current stage: `"recognize" | "explain" | "locate" | "results"`
- Remove `config` JSONB field's `difficulty_mode` requirement (or repurpose — all groups run the same flow)

**Modify `Annotation` table:**
- Add `hintLevel Int @default(0)` — how many hints were used before this annotation (Locate)
- Add `targetSection String?` — which section the student tapped for hints (Locate)

**Modify `FlawResponse` table:**
- Add `hintLevel Int @default(0)` — how many hints were used before this response (Recognize)

Note: `flawId` is nullable on `HintUsage` because for non-flawed turns in Recognize, there is no flaw. The server looks up `flawId` from `turnId` and `activity.flawIndex`.

### 1.2 Type Changes (`app/src/lib/types.ts`)

```typescript
// Remove
type DifficultyMode = "learn" | "recognize" | "locate" | "classify" | "explain"
type SessionMode = "recognize" | "locate" | "classify" | "explain"
interface RecognizeConfig { response_format: "ab" | "multiple_choice" }
interface LocateConfig { hint_scope: "sentence" | "section" }
interface ClassifyConfig { categorization: "detect_only" | "assisted" | "full" }
interface ExplainConfig { explanation_format: "guided" | "free_text" }
// All of MODE_KNOB_INFO

// Add
type SessionStage = "recognize" | "explain" | "locate" | "results"

// Hint state per stage
interface RecognizeHintState {
  eliminatedChoices: FlawType[]  // which wrong choices have been removed
  maxHints: 2
}

interface ExplainHintState {
  flawTypeRevealed: boolean      // Hint 1: reveals correct flaw type
  templateRevealed: boolean      // Hint 2: shows guided template
  maxHints: 2
}

interface LocateHintState {
  sectionConfirmed: string | null   // section id confirmed by student-targeted hint
  turnRevealed: string | null       // turn item_id
  flawTypeRevealed: boolean
  maxHints: 3
}

// Design parameters
const HINT_UNLOCK_DELAY = {
  recognize: 18_000,    // 18 seconds (individual)
  explain: 45_000,      // 45 seconds (group discussion)
  locate: 18_000,       // 18 seconds (per interaction)
} as const

const FALSE_POSITIVE_RATIO = 0.25   // ~1 non-flawed turn per 3-4 flawed turns
const WRITE_THEN_REVEAL_MS = 75_000 // ~75 seconds individual writing period
```

### 1.3 Stage Transition Infrastructure

**Stage state machine:**
```
recognize → explain → locate → results
                  └──────────→ results  (if no missed flaws)
```

**Socket.IO events:**
- `stage:transition` — emitted by server when a group's stage changes. Payload: `{ groupId, fromStage, toStage }`
- `hint:used` — emitted when a student requests a hint. Payload: `{ groupId, studentId, turnId, stage, hintLevel }`
- `explanation:submitted` — emitted when a student submits an explanation. Payload: `{ groupId, turnId, authorId }`
- `explanation:revealed` — emitted when the write-then-reveal period ends. Payload: `{ groupId, turnId }`

**API endpoints for transitions:**
- `POST /api/sessions/[id]/groups/[groupId]/transition` — Teacher triggers Recognize → Explain. Server validates all/enough students have completed Recognize.
- The Explain → Locate transition is automatic (server-side, after group completes Explain turns).

### 1.4 API: Hint Endpoint

**`POST /api/hints`** — Record a hint request, return hint content.

```typescript
// Request
{ sessionId, groupId, turnId, stage, targetSection? }
// No flawId in request — server looks up from turnId + activity.flawIndex

// Response (varies by stage)
// Recognize: { hintLevel: 1, eliminatedChoice: "coherence" }
// Explain:   { hintLevel: 1, flawType: "reasoning", autoCompleteStep1: true }
//            { hintLevel: 2, template: "This is a reasoning flaw because ___" }
// Locate:    { hintLevel: 1, sectionHasFlaw: true, section: "findings" }
//            { hintLevel: 1, sectionHasFlaw: false }  // free — not counted
//            { hintLevel: 2, turnId: "turn-7" }
//            { hintLevel: 3, flawType: "epistemic" }
```

Server-side logic:
1. Look up current hint level for this student + turn from `HintUsage` table
2. Compute next hint content from `activity.flawIndex` and `activity.transcript`
3. **Locate:** If `targetSection` provided, check for unresolved flaws in that section. Section denials are free (no `HintUsage` record).
4. **Non-flawed turns (Recognize):** Hints eliminate real flaw types. `flawId` is null.
5. Insert `HintUsage` record
6. Return hint content + new hint level

**`GET /api/hints?sessionId=X&groupId=Y`** — Fetch all hint records for state restoration on page reload.

### 1.5 Turn Selection Logic (`src/lib/turn-selection.ts`)

Determines which turns appear in Explain after Recognize completes:

```typescript
function selectExplainTurns(
  flawIndex: FlawIndexEntry[],
  recognizeResponses: FlawResponse[],  // all students' responses
  falsePositiveTurnIds: string[]
): ExplainTurn[] {
  // 1. Exclude non-flawed turns (productive failure handled them)
  // 2. For each flawed turn: check if ANY student selected the wrong type
  // 3. If yes → include in Explain (without revealing why)
  // 4. If all students correct → skip
  // Return included turns in transcript order
}
```

### 1.6 Locate Trigger Logic (`src/lib/locate-trigger.ts`)

Determines whether Locate stage activates after Explain:

```typescript
function getLocateTargets(
  flawIndex: FlawIndexEntry[],
  recognizeResponses: FlawResponse[],
  explainGroupSelections: FlawResponse[]  // group's Step 1 selections in Explain
): LocateTarget[] {
  // For each flaw: was it correctly identified by any student in Recognize
  //   OR correctly selected by the group in Explain?
  // If neither → it's a Locate target
  // Return targets (empty array = skip Locate, go to Results)
}
```

### 1.7 False Positive Generation (`src/lib/false-positives.ts`)

Shared logic used by both client (rendering) and server (hint API):

```typescript
function generateFalsePositives(
  sessionId: string,
  groupId: string,
  allTurns: Turn[],
  flawIndex: FlawIndexEntry[],
  ratio: number = FALSE_POSITIVE_RATIO
): string[] {
  // Deterministic seed: hash(sessionId + groupId)
  // Select non-flawed turns at the configured ratio
  // Return turn IDs of false positive turns
}
```

### 1.8 Migration Script

- Migrate existing `group.config` values: `"classify"` → `"locate"`, strip knob keys
- Add `stage` column to `Group` with default `"recognize"`
- Prisma migration for new tables and modified columns

### 1.9 Deliverables
- [ ] Prisma schema updated + migration run (`HintUsage`, `Explanation`, Group `stage`, Annotation/FlawResponse `hintLevel`)
- [ ] Types updated in `types.ts` (remove modes/knobs, add `SessionStage`)
- [ ] Stage transition API + Socket.IO events
- [ ] `/api/hints` POST and GET endpoints
- [ ] `turn-selection.ts` — Explain turn selection logic
- [ ] `locate-trigger.ts` — Locate trigger condition logic
- [ ] `false-positives.ts` — shared deterministic generation
- [ ] Migration script for existing data
- [ ] Unit tests: hint progression (each stage), turn selection, Locate trigger, false positive determinism

---

## Phase 2: Recognize Stage (Individual, Turn-by-Turn)

Rewrite the Recognize component for the individual warm-up stage.

### 2.1 Current → New

| Aspect | Current | New |
|--------|---------|-----|
| Context | Standalone mode, teacher-selected | Stage 1 of every session, individual |
| Unit | Pre-highlighted passages | One turn at a time, sequential |
| Choices | 4-choice or A/B (knob) | Always 4 flaw types (no "No flaw") |
| Hints | None | Eliminate 1 wrong choice per hint. "Narrow it down" button with 18s delay |
| Non-flawed turns | "No flaw" option | Productive failure (all choices wrong → surprise feedback) |
| Field Guide | Available | Not available |
| End state | Session ends | Data feeds into Explain stage |

### 2.2 Component (`app/src/components/stages/recognize-stage.tsx`)

**Rewrite:**
- Accept array of turns (from `activity.transcript` items)
- Inject non-flawed turns using `false-positives.ts` (deterministic seed)
- Display one turn at a time with navigation
- 4 flaw type buttons (no "No flaw")
- "Narrow it down" button: disabled for 18 seconds, then calls `/api/hints`, removes one wrong choice
- **Productive failure flow:**
  - Student selects any type on non-flawed turn → distinct feedback (warm, not punitive): "This turn is actually fine — not every statement has a problem."
  - After max hints on non-flawed turn: 2 choices remain, both wrong. Any selection triggers productive failure feedback
  - Visual treatment: different from wrong-answer feedback on flawed turns (different color, different icon)
- Track per-turn state: `{ answered, correct, hintsUsed, productiveFailure }`
- Progress bar: turns completed / total
- **No Flaw Field Guide** in this stage
- **Completion state:** "Waiting for your group" screen after all turns answered. Dashboard shows student as complete.

### 2.3 Waiting Screen (`app/src/components/stages/waiting-screen.tsx`)

Simple screen shown when a student finishes Recognize before the teacher transitions to Explain:
- "Nice work! Waiting for your group to finish."
- Shows own completion stats (X/Y correct, Z hints used) — lightweight, no full results
- Listens for `stage:transition` Socket.IO event to auto-navigate to Explain

### 2.4 Student Session Page Routing

Update `page.tsx`:
- Read `group.stage` to determine which stage component to render
- `"recognize"` → `recognize-stage.tsx`
- `"explain"` → `explain-stage.tsx`
- `"locate"` → `locate-stage.tsx`
- `"results"` → `results-view.tsx`
- Listen for `stage:transition` events to re-route automatically

### 2.5 Deliverables
- [ ] `recognize-stage.tsx` (turn-by-turn, hint elimination, productive failure)
- [ ] `waiting-screen.tsx`
- [ ] Updated `page.tsx` routing by `group.stage`
- [ ] Productive failure feedback component
- [ ] "Narrow it down" button with try-first delay
- [ ] State restoration on page reload
- [ ] Manual test: walk through 5+ turns including non-flawed turns, use hints, verify productive failure, verify waiting screen

---

## Phase 3: Explain Stage (Group, Collaborative Writing)

Build the Explain stage with two-step flow, collaborative writing, and structured disagreement.

### 3.1 Current → New

| Aspect | Current | New |
|--------|---------|-----|
| Context | Standalone mode, individual or group phase | Stage 2 of every session, always group |
| Unit | Full transcript, student selects text | Selected turns (where Recognize errors occurred), one at a time |
| Task | Find + categorize + explain | Step 1: select flaw type (with Recognize results shown). Step 2: write justification collaboratively |
| Writing | Individual, one explanation per student | Collaborative: all students write simultaneously, write-then-reveal |
| Hints | Section reveal | Hint 1: reveal flaw type. Hint 2: guided template. 45s delay |
| Disagreement | Consensus-based | Structured: minority voice first, perspective-taking |

### 3.2 Components

**`app/src/components/stages/explain-stage.tsx`** — Main stage component:
- Receives turns from `turn-selection.ts` (only turns where Recognize errors occurred)
- Displays one turn at a time
- Shows Recognize distribution for current turn (e.g., "2 said reasoning, 1 said epistemic")
- **Step 1:** 4 flaw type buttons + "No flaw." Recognize distribution shown. If disagreement exists, minority voice prompt appears.
- **Step 2:** Collaborative writing area (see below). Flaw type badge shown above.
- "Narrow it down" button: 45-second delay, then Hint 1 reveals correct type (completes Step 1), Hint 2 shows template
- Advance to next turn: when group marks turn as discussed (at least one explanation submitted)

**`app/src/components/explain/collaborative-editor.tsx`** — Multi-student writing:
- Shows writing area for the current student
- **Write phase (~60-90 seconds):** Student writes independently. Other students' text not visible. Countdown shown.
- **Reveal phase:** Timer ends or all students submit → all explanations appear simultaneously, each attributed to author
- **Revision phase:** Students can edit their explanation or write additional ones. Revisions tracked via `revisionOf` field
- Real-time sync via Socket.IO (`explanation:submitted`, `explanation:revealed`)

**`app/src/components/explain/recognize-distribution.tsx`** — Shows Recognize results:
- Bar/chip display: "Jayden: reasoning, Aisha: reasoning, Marcus: epistemic"
- Highlights disagreement when present

**`app/src/components/explain/disagreement-prompt.tsx`** — Minority voice prompt:
- When distribution shows a minority position, prompt that student: "You saw this differently — share your thinking first"
- Shown on the minority student's iPad only
- Optional perspective-taking response: "I now understand the other perspective because ___"

### 3.3 Deliverables
- [ ] `explain-stage.tsx` (two-step flow, turn selection, structured disagreement)
- [ ] `collaborative-editor.tsx` (write-then-reveal, attribution, revision tracking)
- [ ] `recognize-distribution.tsx` (Recognize results display)
- [ ] `disagreement-prompt.tsx` (minority voice prompting)
- [ ] Socket.IO events for collaborative writing (`explanation:submitted`, `explanation:revealed`)
- [ ] "Narrow it down" button with 45s delay
- [ ] `Explanation` records saved with authorship and revision tracking
- [ ] Stage auto-transition: after last Explain turn, trigger Locate check → `stage:transition` to either `"locate"` or `"results"`
- [ ] State restoration on page reload
- [ ] Manual test: walk through Explain turns, verify Recognize results shown, collaborative writing works, disagreement prompts appear, auto-transition fires

---

## Phase 4: Locate Stage (Group, Conditional)

Build the conditional Locate stage with student-targeted hints.

### 4.1 Current → New

| Aspect | Current | New |
|--------|---------|-----|
| Context | Standalone mode, teacher-selected | Stage 3, conditional, only if flaws were missed |
| Trigger | Teacher creates session with Locate mode | Automatic: system detects missed flaws after Explain |
| View | One hint card at a time, section dimming | Full transcript + "X flaws remaining" counter |
| Hints | Type + location given upfront | Student-targeted: tap section → confirm/deny → turn → type. 18s delay |
| Entry context | Cold — students may not have read transcript | Warm — students read every turn in Recognize, discussed errors in Explain |

### 4.2 Component (`app/src/components/stages/locate-stage.tsx`)

**Build:**
- Display full transcript (all sections, all turns)
- Header: "Your group missed X flaws — they're somewhere in the transcript. Find them."
- Flaw counter updates as flaws are found
- Student taps/clicks a turn to flag it as flawed
- Flagged turns appear in sidebar (reuse `flaw-palette.tsx` pattern)
- **Student-targeted hints:**
  - Student taps a section of the transcript
  - "Narrow it down" button (18s delay) sends `targetSection` to `/api/hints`
  - Hint 1: confirm/deny flaw presence. Denial is free (not counted as hint)
  - Hint 2: highlight/pulse specific turn within confirmed section
  - Hint 3: show flaw type badge on the turn
  - Any group member can request; result visible to all
- Annotations saved with `hintLevel` and `targetSection`
- **Flaw Field Guide** available
- **Completion:** All missed flaws found → auto-transition to Results. Or teacher ends session manually.

### 4.3 Deliverables
- [ ] `locate-stage.tsx` (full transcript, flaw counter, student-targeted hints)
- [ ] Section-tap interaction for hint targeting
- [ ] Hint progression logic (confirm/deny → turn → type; denial is free)
- [ ] Flagging interaction (tap turn → flag/unflag)
- [ ] Sidebar for flagged turns
- [ ] "Narrow it down" button with 18s delay
- [ ] Auto-transition to Results when all flaws found
- [ ] State restoration on page reload
- [ ] Manual test: verify Locate only triggers when flaws missed, section-targeted hints work, flaw counter decrements

---

## Phase 5: Results View + Teacher UI

Build the end-of-session results view and update teacher-facing UI.

### 5.1 Results View (`app/src/components/stages/results-view.tsx`)

Single end-of-session view showing the group's journey:

**Recognize section (individual results):**
- Per-student accuracy: "Jayden: 7/10 correct, 2 with strategic support"
- Productive failure turns flagged (non-flawed turns correctly handled)
- Hint usage profile per student

**Explain section (group results):**
- Per-turn: group's flaw type selection + all written explanations (attributed to authors)
- Disagreements: how Recognize distribution looked → what the group selected → perspective-taking responses
- Hint usage (who requested, which turns)
- Writing contribution count per student

**Locate section (if triggered):**
- "Your group missed X flaws → You found Y of X"
- Per-flaw: how many hints were needed
- If Locate didn't trigger: "Your group caught all flaws — no search needed"

**Summary:**
- Total flaws: N
- Caught in Recognize: X (individual accuracy)
- Corrected in Explain: Y (group correction)
- Found in Locate: Z (group search)
- Remaining unfound: N - X - Y - Z

### 5.2 Session Creation Form (`create-session-form.tsx`)

**Simplify dramatically:**
- Select class → select activity (transcript) → assign groups → start
- **No mode picker.** All groups run the three-stage flow.
- **No knob pickers.** Remove `MODE_KNOB_INFO` and all knob-related UI.
- Brief description of the session flow: "Students will work through three stages: Recognize (individual) → Explain (group) → Locate (if needed)"

**Group config output:** `{ }` — no mode or knob keys. Stage is tracked on the `Group` model directly.

### 5.3 Session Dashboard (`session-dashboard.tsx`)

**Stage-aware display:**
- Per-group: current stage indicator (Recognize / Explain / Locate / Results)
- Recognize: student completion progress (X/Y done), per-student accuracy live
- Explain: current turn being discussed, writing activity (who's writing)
- Locate: flaws remaining counter, hint usage
- "Move to Explain" button per group (teacher transition trigger)
- "End Session" button (forces transition to Results from any stage)

**Hint usage display:**
- Per-group summary: "X% completed without strategic support"
- Per-student detail: hint count per stage
- Activity feed: "Student A used strategic support on Turn 3 (Recognize)" events

**Socket.IO events consumed:**
- `stage:transition` — update group stage indicator
- `hint:used` — update hint activity feed
- `explanation:submitted` — update writing activity indicator

**Remove:**
- Mode picker / mode display on group cards
- Knob display
- Mode change modal

### 5.4 Deliverables
- [ ] `results-view.tsx` (full journey view across all stages)
- [ ] Simplified `create-session-form.tsx` (no modes, no knobs)
- [ ] Stage-aware `session-dashboard.tsx` (stage indicators, transition button, hint display)
- [ ] "Move to Explain" transition button wired to `/api/sessions/[id]/groups/[groupId]/transition`
- [ ] Dashboard Socket.IO listeners for new events
- [ ] Manual test: create session → students complete all stages → teacher views dashboard throughout → results view accurate

---

## Phase 6: Cleanup and Matching

Remove dead code. Update matching engine for stage-based flow.

### 6.1 Remove Dead Code

- Delete `session-activity-viewer.tsx` — replaced by `explain-stage.tsx` and `locate-stage.tsx`
- Delete `hint-card.tsx` — replaced by student-targeted hint system
- Delete `flaw-toolbar.tsx` — no longer needed
- Remove `"classify"` from all type definitions, routing, and UI
- Remove `MODE_KNOB_INFO`, all mode config interfaces
- Remove knob-related code from API routes
- Remove mode-selection components from session creation
- Remove `group.config.difficulty_mode` handling (replaced by `group.stage`)
- Clean up `explanation-prompt.tsx` — extract template logic for `explain-stage.tsx`
- Remove old group phase components (consensus-based) — replaced by structured disagreement

### 6.2 Matching Engine (`app/src/lib/matching.ts`)

**Update for stage-based flow:**
- Recognize: match by turn + flaw type (from individual `FlawResponse` records)
  - Non-flawed turns: productive failure is always "correct" (the student engaged)
- Explain: match by turn + group flaw type selection (Step 1). Explanation quality (Step 2) is teacher-reviewed, not auto-matched
- Locate: match by turn (from `Annotation`), with `hintLevel` metadata
- Remove `locationOnly` flag
- Add hint level and stage to match results
- Results view consumes match results across all three stages

### 6.3 Deliverables
- [ ] Dead code removed (classify mode, knobs, old components, consensus group phase)
- [ ] Matching engine updated for stage-based flow + hint metadata + productive failure
- [ ] Full regression test: complete session flow end-to-end (all 3 stages + Results)

---

## Phase 7: Polish and Analytics

### 7.1 Analytics API

**`GET /api/sessions/[id]/analytics`** — Aggregate data across all stages.

```typescript
{
  groups: [{
    groupId,
    currentStage: SessionStage,
    recognize: {
      students: [{
        studentId, displayName,
        turns: [{ turnId, correct, hintsUsed, productiveFailure }],
        summary: { total, correct, independent, withSupport }
      }]
    },
    explain: {
      turns: [{
        turnId,
        recognizeDistribution: { [flawType]: number },
        groupSelection: FlawType | "no_flaw",
        explanations: [{ authorId, text, revisedFrom? }],
        hintsUsed: number,
        disagreement: boolean
      }],
      writingContributions: { [studentId]: number },
      summary: { turnsDiscussed, hintsUsed, independenceRate }
    },
    locate: {
      triggered: boolean,
      targets: number,
      found: number,
      perFlaw: [{ flawId, hintsUsed, foundBy: studentId }],
      summary: { completionRate, avgHintsPerFlaw }
    } | null,
    summary: {
      recognizeAccuracy,     // individual
      explainCorrectionRate, // how many Recognize errors were fixed in Explain
      locateTriggered,
      locateCompletionRate,
      overallFlawCoverage    // % of all flaws correctly identified across all stages
    }
  }]
}
```

### 7.2 Export Updates

Update CSV export (`/api/export/*`) to include:
- Per-stage hint usage
- Explanation texts with authorship
- Productive failure indicators
- Stage progression data (time per stage, Locate triggered yes/no)
- Replace `"classify"` with `"locate"` in historical data

### 7.3 Polish

**"Narrow it down" button:**
- Subtle pulse when available (try-first period ended)
- Disabled state with countdown during try-first period (non-anxious: circular progress, not ticking clock)
- Exhausted state when all hints used

**Productive failure (Recognize):**
- Warm feedback animation — distinct from wrong-answer red
- Different color scheme (e.g., amber/gold) and icon (e.g., lightbulb)

**Turn transitions:**
- Slide/fade between turns in Recognize and Explain

**Collaborative writing (Explain):**
- Write-then-reveal countdown (subtle, not pressuring)
- Reveal animation (explanations appear with gentle fade-in)
- Attribution styling (color-coded by author)

**Stage transitions:**
- Smooth transition animation between stages
- Brief interstitial explaining the next stage ("Now you'll work with your group to explain the flaws you found")

**Mobile/iPad optimization:**
- Turn-by-turn view optimized for iPad portrait
- Collaborative editor responsive on iPad
- Section-tap targets large enough for touch (Locate)

**Accessibility:**
- Keyboard navigation for turn-by-turn
- Screen reader labels for "Narrow it down" button and countdown
- ARIA announcements for stage transitions
- Color-blind safe indicators for productive failure vs wrong answer

### 7.4 Late-Joining Students

Handle students who miss Recognize but join for Explain:
- Participate in group Explain and Locate normally
- Recognize data is null — flagged as "joined late" in Results and analytics
- No catch-up Recognize required (the group fills them in verbally)
- Dashboard shows late-join indicator

### 7.5 Deliverables
- [ ] Analytics API endpoint
- [ ] Updated CSV exports
- [ ] UI polish (button states, animations, transitions, iPad optimization)
- [ ] Late-join handling
- [ ] Accessibility pass
- [ ] Flaw Field Guide conditional availability (Explain, Locate, Learn only)

---

## Dependency Graph

```
Phase 1 (Data Layer + Stage Infrastructure)
  ├── Phase 2 (Recognize Stage)
  ├── Phase 3 (Explain Stage)
  └── Phase 4 (Locate Stage)
        │
        └── Phase 5 (Results View + Teacher UI)  ← needs all 3 stages working
              └── Phase 6 (Cleanup + Matching)
                    └── Phase 7 (Polish + Analytics)
```

Phases 2, 3, and 4 can be built in parallel after Phase 1. Phase 5 needs all stages working to build the results view and test the full flow. Phase 6 is cleanup — safest after all stages are live. Phase 7 is polish.

Note: Phase 5's session creation simplification (removing mode picker) has no dependency on Phases 2-4 and could be done alongside Phase 1.

---

## Risk and Considerations

### Data Migration
- Existing sessions with mode-based design need migration. `group.config.difficulty_mode` → `group.stage` set to `"results"` for completed sessions, `"recognize"` for new ones.
- In-progress sessions: consider freezing on old design or forcing completion before migration.
- Knob values in `group.config` become dead keys. Safe to leave or strip.

### New Complexity
- **Stage transitions:** New state machine with Socket.IO coordination. The Recognize → Explain transition is teacher-triggered; Explain → Locate/Results is automatic. Both need error handling (what if the transition event is missed? polling fallback).
- **Turn selection logic:** Determines which turns appear in Explain. Must handle edge cases: what if ALL students were wrong on every turn? (All turns appear in Explain.) What if no students were wrong? (Explain shows nothing → skip to Locate check → likely skip to Results.)
- **Collaborative writing:** Real-time multi-user writing with write-then-reveal. Requires Socket.IO event coordination, timer synchronization across clients, and revision tracking. This is the most complex new feature.
- **Locate trigger logic:** Must correctly determine missed flaws by checking Recognize responses AND Explain group selections. Test thoroughly with edge cases.
- **Productive failure:** New feedback path for non-flawed turns in Recognize. Distinct from wrong-answer feedback. Must handle hints on non-flawed turns correctly (eliminating choices that are all wrong).

### Client/Server Agreement
Both client and server must agree on:
- Which turns are false positives (`false-positives.ts` with deterministic seed)
- Which turns should appear in Explain (`turn-selection.ts` — server computes, client consumes)
- Whether Locate should trigger (`locate-trigger.ts` — server computes)

### Testing Strategy
- **Unit tests:** Hint progression (each stage), turn selection, Locate trigger, false positive determinism, productive failure on non-flawed turns with hints
- **Integration tests:** Stage transitions (Recognize → Explain → Locate → Results), collaborative writing sync, hint API across all stages
- **Manual tests per phase:** Each phase has explicit manual test checkpoint
- **Edge cases to test:**
  - All students correct on every turn → Explain shows nothing → Locate doesn't trigger → straight to Results
  - All students wrong on every turn → all turns in Explain → many Locate targets
  - Non-flawed turns with max hints in Recognize → both remaining choices wrong → productive failure
  - Student joins late (misses Recognize) → participates in Explain with null Recognize data
  - Section denial in Locate → not counted as hint → student taps another section
  - Write-then-reveal timer: what if a student hasn't typed anything when reveal happens? (Show empty/placeholder)
  - Teacher triggers transition before all students complete Recognize (warning or block?)
- **End-to-end:** Teacher creates session → students complete Recognize → teacher transitions → Explain with collaborative writing → Locate triggers → Results view accurate → analytics API returns correct data

### What We're Not Changing
- Learn mode (standalone page) — untouched
- Socket.IO infrastructure — adding new events, but existing event system stays
- Scaffold system — untouched (teacher can still send scaffolds in any stage)
- Matching algorithm structure (green/blue/red/yellow) — updated inputs, same core logic
- Authentication, classes, activities — untouched
- Activity data model (`activity.flawIndex`, `activity.transcript`) — untouched (consumed, not modified)
