# Implementation Plan: Five-Stage Flow, "No Flaw Here," and Motivation System

This plan covers four interconnected changes to the CrossCheck session flow:

1. **Five-stage flow** — Split the current Explain stage into Explain (teach back) and Collaborate (team building)
2. **"No flaw here" button** — Add a fifth option to Recognize for non-flawed turns
3. **Coins** — Reward system for learning behaviors
4. **Pass thresholds and goal bars** — Teacher-set targets with visible progress

See [Pedagogical Model](pedagogical-model.md) for design rationale and specifications.

---

## Phase 1: Schema and Type Foundation

All subsequent phases depend on these changes. Do this first.

### 1.1 Prisma Schema

**File:** `prisma/schema.prisma`

Add `collaborate` to the `SessionStage` enum:
```
enum SessionStage {
  recognize
  explain
  collaborate    // NEW
  locate
  results
}
```

Add coin tracking. Two options — choose one:

**Option A: Denormalized fields (simpler)**
- Add `coins Int @default(0)` to `FlawResponse` (Recognize and Collaborate coin awards)
- Add `coins Int @default(0)` to `Explanation` (Explain and Collaborate writing awards)
- Add `coins Int @default(0)` to `Annotation` (Locate coin awards)

**Option B: Ledger table (more flexible)**
- New model `CoinLedger { id, userId, groupId, sessionId, stage, action, coins, createdAt }`

Recommendation: **Option A** — simpler, coins are always tied to an existing action. A ledger is only needed if we want coins for actions that don't produce a record (e.g., "group completes all Explain turns" bonus). We can add the bonus via a `SessionEvent` with coins in the payload.

Add pass thresholds to session config. No schema migration needed — `Session.config` is already JSONB. Store as:
```json
{
  "thresholds": {
    "recognize": 7,
    "explain": 3,
    "collaborate": 4,
    "locate": 2
  }
}
```

### 1.2 TypeScript Types

**File:** `src/lib/types.ts`

```typescript
// Update SessionStage
export type SessionStage = "recognize" | "explain" | "collaborate" | "locate" | "results";

export const SESSION_STAGES: SessionStage[] = ["recognize", "explain", "collaborate", "locate", "results"];

export const STAGE_TRANSITIONS: Record<SessionStage, SessionStage[]> = {
  recognize: ["explain"],
  explain: ["collaborate"],           // always → collaborate
  collaborate: ["locate", "results"], // locate is conditional
  locate: ["results"],
  results: [],
};
```

Add coin constants:
```typescript
export const COIN_VALUES = {
  recognize_correct: 2,
  recognize_correct_independent: 3,   // no hints
  recognize_no_flaw_correct: 2,
  recognize_no_flaw_independent: 3,
  recognize_wrong: 0,
  explain_submission: 1,
  explain_stage_complete: 2,          // bonus per student
  collaborate_correct: 2,
  collaborate_correct_independent: 3,
  collaborate_submission: 1,
  locate_independent: 3,
  locate_one_hint: 2,
  locate_multiple_hints: 1,
} as const;

export const DEFAULT_THRESHOLDS: Record<string, number | null> = {
  recognize: null,   // null = computed as 50% of turns at runtime
  explain: 2,
  collaborate: null,  // null = computed as 50% of collaborate turns
  locate: null,       // null = computed as 50% of locate targets
};
```

Add hint types for Explain (simpler than current — only template hint):
```typescript
export interface ExplainTeachBackHintState {
  templateRevealed: boolean;
  maxHints: 1;
}
```

Update `HINT_UNLOCK_DELAY`:
```typescript
export const HINT_UNLOCK_DELAY = {
  recognize: 18_000,
  explain: 30_000,      // changed from 45s — students know the answer
  collaborate: 45_000,  // NEW — group discussion time
  locate: 18_000,
} as const;
```

### 1.3 Migration

Generate and apply migration:
```bash
npx prisma migrate dev --name five_stage_flow
```

---

## Phase 2: Turn Selection Split

Currently `turn-selection.ts` has one function `selectExplainTurns()` that returns turns where any student was wrong. Split it into two functions.

### 2.1 Turn Selection Logic

**File:** `src/lib/turn-selection.ts`

Rename `selectExplainTurns()` → keep it but add a new function. The file should export:

- `selectExplainTurns()` — returns turns where **every** student was correct (unanimously correct). These are the "teach back" turns.
- `selectCollaborateTurns()` — returns turns where **any** student was wrong. These are the "team building" turns. (This is what the current `selectExplainTurns()` does.)

The two sets are mutually exclusive. Together they cover all flawed turns.

`selectExplainTurns()` changes:
- Flip the filter: include turns where `!anyWrong` (all students correct)
- Remove `recognizeDistribution` and `hasDisagreement` from ExplainTurn (not needed — students already know the answer)
- Keep `correctFlawType` and `flawId`

New `selectCollaborateTurns()`:
- Same logic as current `selectExplainTurns()` (turns where any student was wrong)
- Returns `CollaborateTurn` type (same shape as current `ExplainTurn` — has distribution and disagreement)

### 2.2 Locate Trigger Update

**File:** `src/lib/locate-trigger.ts`

Update `getLocateTargets()`:
- Parameter name change: `explainGroupSelections` → `collaborateGroupSelections`
- Logic unchanged — a flaw is "missed" if no student got it in Recognize AND the group didn't get it in Collaborate
- The function doesn't need to know about Explain at all (Explain doesn't change any flaw identifications)

---

## Phase 3: "No Flaw Here" in Recognize

### 3.1 Recognize Stage Component

**File:** `src/components/stages/recognize-stage.tsx`

Add a "No flaw here" button below the 4 flaw type buttons. Distinct styling (e.g., outlined, gray/green) to visually separate it from the flaw type choices.

Update `handleSelectType()`:
- Accept `"no_flaw"` as a valid answer
- For flawed turns: `"no_flaw"` is always wrong → show correction with correct type
- For non-flawed turns (false positives): `"no_flaw"` is correct → show positive feedback ("Sharp eye!")
- For non-flawed turns: any flaw type selection is wrong → show "This turn is actually fine"

### 3.2 Hint Logic Update

**File:** `src/lib/hints.ts`

Update `computeRecognizeHint()`:
- Current: eliminates one flaw type choice. New: eliminates one wrong option from the full 5-option set.
- For flawed turns: hints eliminate wrong flaw types. "No flaw here" is a wrong option and CAN be eliminated.
- For non-flawed turns: hints eliminate flaw types (which are all wrong). "No flaw here" is NEVER eliminated.
- After 2 hints, minimum 2 options remain (could be 1 flaw type + "No flaw here", or 2 flaw types).

### 3.3 Flaw Response API

**File:** `src/app/api/flaw-responses/route.ts`

The `VALID_FLAW_TYPES` array already includes `"no_flaw"`. Verify the correctness check handles it:
- `typeCorrect` should be `true` when `typeAnswer === "no_flaw"` and the turn is a false positive
- `typeCorrect` should be `false` when `typeAnswer === "no_flaw"` and the turn has a flaw

### 3.4 False Positive Update

**File:** `src/lib/false-positives.ts`

No changes needed. The function selects which non-flawed turns to include — it doesn't know about the UI buttons.

---

## Phase 4: Coins

### 4.1 Coin Computation Utility

**New file:** `src/lib/coins.ts`

Pure functions that compute coin awards:
```typescript
export function computeRecognizeCoins(correct: boolean, hintCount: number): number
export function computeExplainCoins(action: "submission" | "stage_complete"): number
export function computeCollaborateCoins(action: "correct_selection" | "submission", hintCount: number): number
export function computeLocateCoins(hintCount: number): number
```

### 4.2 Integrate Coins into API Routes

**File:** `src/app/api/flaw-responses/route.ts`
- After saving a FlawResponse, compute coins and update the record's `coins` field
- Emit a `coins:awarded` socket event to the student's group room

**File:** `src/app/api/explanations/route.ts`
- After saving an Explanation, compute coins and update the record's `coins` field
- Emit `coins:awarded` event

### 4.3 Coin Display Component

**New file:** `src/components/shared/coin-display.tsx`

Two variants:
- **Inline:** "+3 coins!" animation shown after an action (per-turn feedback)
- **Header:** Running total shown in stage header bar (individual + group)

### 4.4 Coin Totals API

Add coin aggregation to existing endpoints:
- `GET /api/sessions/[id]` — include per-group coin totals (for teacher dashboard)
- Stage components fetch their own coin totals from existing data

---

## Phase 5: Explain Stage (Teach Back)

### 5.1 Simplify Explain Stage Component

**File:** `src/components/stages/explain-stage.tsx`

Major simplification — remove type selection (Step 1), keep only writing (Step 2):

- Remove the flaw type selection buttons (group already knows the type)
- Show the correct flaw type as a badge/label
- Show the turn content
- Show the collaborative writing interface (write-then-reveal)
- Framing text: "Teach your group — explain why this is a [type] flaw"
- Goal bar showing explanations submitted / threshold

Hint changes:
- Remove Hint 1 (was: reveal correct type — already shown)
- Keep template hint as the only hint (max 1 per turn)
- Try-first delay: 30 seconds

The `onComplete` callback triggers automatic transition to Collaborate.

### 5.2 Explain Turn Data

The stage component receives `explainTurns` from the server page. Update the server page (`src/app/student/session/[id]/page.tsx`) to:
- Call the new `selectExplainTurns()` (unanimously correct turns)
- Pass `explainTurns` to the component

---

## Phase 6: Collaborate Stage (Team Building)

### 6.1 New Collaborate Stage Component

**New file:** `src/components/stages/collaborate-stage.tsx`

This is essentially the current `explain-stage.tsx` with updated framing:
- Copy current explain-stage logic (type selection + collaborative writing)
- Update framing text: "These ones stumped some of us — let's figure them out together"
- Show Recognize distribution
- Keep structured disagreement (minority voice first)
- Goal bar showing correct group selections / threshold
- Coins for correct selections and explanation submissions

The `onComplete` callback calls `/api/groups/[id]/stage` to determine Locate vs Results.

### 6.2 Collaborate Hint Logic

**File:** `src/lib/hints.ts`

Add `computeCollaborateHint()` — same as current `computeExplainHint()`:
- Hint 1: reveal correct flaw type (complete Step 1)
- Hint 2: show guided template
- Max 2 hints per turn
- Try-first delay: 45 seconds

### 6.3 Collaborate Turn Data

Update the server page to:
- Call the new `selectCollaborateTurns()` (any-error turns)
- Pass `collaborateTurns` to the component

---

## Phase 7: Stage Transition Logic

### 7.1 Update Stage API

**File:** `src/app/api/groups/[id]/stage/route.ts`

Update the transition logic:

| Current Transition | New Transition |
|---|---|
| recognize → explain (teacher) | recognize → explain (teacher) — unchanged |
| explain → locate/results (auto) | explain → collaborate (auto, always) |
| — | collaborate → locate/results (auto, conditional) |
| locate → results (manual/auto) | locate → results — unchanged |

Key changes:
- When transitioning from `explain`: always go to `collaborate`. No Locate check here.
- When transitioning from `collaborate`: check Locate trigger. Use `getLocateTargets()` with Collaborate responses.
- Compute and store `collaborateTurns` (for the component) and `locateTargets` (for Locate).

Handle edge cases:
- If `selectExplainTurns()` returns empty (no unanimously correct turns): auto-skip Explain → Collaborate.
- If `selectCollaborateTurns()` returns empty (all turns unanimously correct): auto-skip Collaborate → check Locate trigger.

### 7.2 Update Phase Logic

Phase mapping:
- `recognize` → `individual`
- `explain` → `group`
- `collaborate` → `group`
- `locate` → `group`
- `results` → `reviewing`

No change needed if current logic already maps non-recognize stages to `group`.

---

## Phase 8: Pass Thresholds and Goal Bars

### 8.1 Session Creation Form

**File:** `src/app/teacher/classes/[classId]/sessions/new/page.tsx` and `create-session-form.tsx`

Add an optional "Pass Thresholds" section:
- 4 number inputs (Recognize, Explain, Collaborate, Locate)
- Placeholder text showing defaults
- Stored in `Session.config.thresholds` JSONB

### 8.2 Goal Bar Component

**New file:** `src/components/shared/goal-bar.tsx`

Horizontal progress bar:
- Shows "X / Y" (current / threshold)
- Fill animation
- Color transition: gray → green when threshold reached
- Celebration animation (brief confetti or glow) on threshold hit

### 8.3 Integrate Goal Bar into Stage Components

Each stage component receives its threshold (from session config) and tracks progress:
- **Recognize:** correct answers / threshold
- **Explain:** explanations submitted / threshold
- **Collaborate:** correct group selections / threshold
- **Locate:** flaws found / threshold

Threshold is computed at render time: if teacher set an explicit value, use it. Otherwise, compute default (50% of turns for Recognize/Collaborate/Locate, 2 for Explain).

---

## Phase 9: Results View Update

### 9.1 Update Results Tabs

**File:** `src/components/stages/results-view.tsx`

Add Collaborate tab between Explain and Locate:

| Tab | Content |
|---|---|
| Summary | Updated journey narrative with 4 active stages |
| Recognize | Per-student accuracy, coins, "No flaw" detection, hints |
| Explain | Per-turn explanations (attributed), coins |
| Collaborate | Per-turn group selections, explanations, disagreement, coins |
| Locate | Missed/found counts, hints, coins (if triggered) |

Summary stats update:
- "Caught in Recognize" — correct Recognize answers
- "Explained in Explain" — teach-back explanations written
- "Corrected in Collaborate" — errors fixed by the group
- "Found in Locate" — missed flaws discovered
- Total coins per student and per group

### 9.2 Results Data Aggregation

The server page needs to fetch and compute:
- Explain results: explanations for unanimously-correct turns
- Collaborate results: group type selections + explanations for error turns
- Coin totals per stage

---

## Phase 10: Teacher Dashboard Updates

### 10.1 Group Card Updates

**File:** `src/app/teacher/sessions/[id]/session-dashboard.tsx`

- Show current stage name (now 5 possible values instead of 4)
- Show group coin total
- Show goal bar progress for current stage
- "Move to Explain" button (same as current)
- Collaborate and Locate transitions are automatic (no teacher button needed)

### 10.2 Socket Events

Add `coins:awarded` event handling:
- Teacher dashboard: update group coin total in real time
- Student UI: animate coin award

---

## Phase 11: Waiting Screen and Edge Cases

### 11.1 Waiting Screen Update

**File:** `src/components/stages/waiting-screen.tsx`

Update stats display:
- Show coins earned in Recognize
- Show "No flaw" detection count

### 11.2 Edge Cases

- **Empty Explain:** If no turns are unanimously correct, skip straight to Collaborate. The stage API should handle `explain → collaborate` with zero Explain turns.
- **Empty Collaborate:** If all turns are unanimously correct, skip Collaborate. Check Locate trigger (likely no targets → skip to Results).
- **Student joins mid-session:** Student enters at current stage. If mid-Collaborate, they see the current turn and can participate.
- **Stage value migration:** Existing sessions have `explain` stage values. These should continue to work (legacy Explain = old behavior). New sessions created after deployment use the new flow. No data migration needed — legacy routing handles old sessions.

---

## Implementation Order

The phases above are ordered for incremental, testable progress:

| Phase | What | Depends on | Testable milestone |
|---|---|---|---|
| 1 | Schema + types | — | Migration runs, types compile |
| 2 | Turn selection split | 1 | Unit tests: explain/collaborate turn sets are correct and mutually exclusive |
| 3 | "No flaw here" | 1 | Recognize stage shows 5 buttons, false positives handled correctly |
| 4 | Coins utility + API | 1 | Coins computed and stored on FlawResponse/Explanation records |
| 5 | Explain stage (teach back) | 1, 2 | Explain shows only correct turns, writing-only UI, 1 hint max |
| 6 | Collaborate stage | 1, 2, 5 | Collaborate shows error turns, type selection + writing, 2 hints |
| 7 | Stage transitions | 1, 5, 6 | Full flow: Recognize → Explain → Collaborate → Locate/Results |
| 8 | Pass thresholds + goal bars | 1, 4 | Goal bar visible, celebration on threshold |
| 9 | Results view | 5, 6 | All 5 tabs render with correct data |
| 10 | Teacher dashboard | 4, 7 | Dashboard shows coins, new stage names |
| 11 | Edge cases + polish | All | Empty stages skip, legacy sessions unaffected |

Phases 3 and 4 can run in parallel with phases 5 and 6.
