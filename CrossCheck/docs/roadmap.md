# CrossCheck — Roadmap

---

## Active: Five-Stage Flow and Motivation System

### Five-Stage Session Flow

**Problem:** The three-stage flow (Recognize → Explain → Locate) had structural motivation issues. Explain only surfaced errors, making it feel like punishment. Students who did well got less to do. The flow was subtractive rather than additive.

**Solution:** Split into five stages: Recognize → Explain → Collaborate → Locate → Results.

- **Explain** becomes "Teach Back" — only unanimously correct items. Students articulate *why* they were right. Positive framing, confidence building.
- **Collaborate** is new — "Team Building." Takes over old Explain's error-correction role. Students resolve disagreement and work through items where anyone was wrong.
- **Locate** reframed as "Detective Challenge" with positive framing.

**Implementation scope:**
- New `"collaborate"` stage value in `SessionStage` enum (Prisma + types)
- Split `turn-selection.ts` into Explain set (unanimously correct) and Collaborate set (any error)
- New `collaborate-stage.tsx` component (based on current `explain-stage.tsx`)
- Simplify `explain-stage.tsx` (remove type selection step, show correct type, writing only)
- Update `locate-trigger.ts` to check Collaborate responses instead of Explain
- Update stage transition logic in `/api/groups/[id]/stage`
- Update `session-activity-viewer.tsx` to render all five stages
- Update Results view with Explain and Collaborate tabs

### Remove False Positives from Recognize

**Problem:** Recognize included non-flawed turns (via "productive failure" or "No flaw here" button). This violated the independence gradient — detection (is this flawed?) is Bloom's Analyze level, but Recognize is Bloom's Understand. It also increased cognitive load by requiring two decisions per turn (is it flawed? + what type?) instead of one.

**Solution:** Remove non-flawed turns from Recognize entirely. Every Recognize turn has exactly one flaw. Students focus on one task: identify the type. Detection skill is practiced in Locate, where the full transcript naturally includes non-flawed turns.

**Implementation scope:**
- Remove `selectFalsePositives()` call from `recognize-stage.tsx`
- Remove productive failure feedback paths
- Deprecate or remove `false-positives.ts` and `FALSE_POSITIVE_RATIO`
- Simplify hint logic (no null-flaw case)

### Motivation System: Coins

**Problem:** No visible reward for correct answers. No sense of accumulation or progress within a stage.

**Solution:** Coin economy earned for learning behaviors (correct identification, explanations, flaw discoveries). Per-student and per-group totals. No cross-group leaderboards.

**Implementation scope:**
- New `coins` field on `FlawResponse` and `Explanation` models (or separate `CoinLedger` model)
- Coin award logic per stage (see pedagogical model for values)
- Coin display component (per-turn animation, running total in stage header)
- Coin totals in Results view
- Coin totals on teacher dashboard group cards

### Motivation System: Pass Thresholds and Goal Bars

**Problem:** No win condition within a stage. Students with many flaws to work through felt overwhelmed.

**Solution:** Teachers set pass thresholds per stage at session creation. Goal bar shows progress. Hitting the threshold triggers celebration but doesn't stop the student.

**Implementation scope:**
- Add threshold fields to `Session.config` JSONB (or `Group.config`)
- Threshold configuration UI in session creation form
- Goal bar component shown in each stage
- Celebration animation when threshold is reached
- Default thresholds when teacher doesn't set them

---

## Tier 4: Future Improvements

### 4.1 Scenario Ingestion from UI

**Problem:** Activities are imported via CLI only (`npx tsx scripts/ingest-registry.ts --all`).

**Solution:** Add a "Refresh activities" button for teachers or researchers to trigger ingestion from the browser.

---

### 4.2 SessionEvent Analysis

**Problem:** Events are logged to the `session_events` table (phase changes, scaffold sends, annotation creates) but never queried or displayed. Rich data for researchers.

**Solution:** Add event timeline to researcher session view and include in CSV export.

---

### 4.3 Scaffold Outcome Computation

**Problem:** The `outcome` field on scaffolds is nullable and never populated. Designed for post-session analysis correlating scaffold timestamps with subsequent annotation timestamps.

**Solution:** Post-session batch script to compute `annotations_after_5min`, `target_section_annotated`, `flaw_found_at_target`. Add to researcher scaffold export.

---

### 4.4 Mobile/Tablet Flaw Palette

**Problem:** The FlawPalette sidebar is `hidden lg:block`. Tablet users only have the bottom bar — no way to see the annotation list or delete annotations. No touch event handling for text selection.

**Solution:** Collapsible panel above the bottom bar on smaller screens. Add `onTouchEnd` handling for mobile text selection.

---

### 4.5 "Full" Practice Mode Completion

**Problem:** The schema has `severity` and `explanation` fields on annotations. The UI shows 3 practice modes but "Full" (severity + explanation) isn't fully wired.

**Solution:** Add severity dropdown and explanation textarea to the bottom bar in Full mode. Include severity accuracy in feedback comparison.

---

### 4.6 IndexedDB Offline Annotation Queue

**Problem:** If WiFi drops, annotations made during disconnection are lost (HTTP fetch fails). Socket.IO auto-reconnects but doesn't replay failed HTTP requests.

**Solution:** Store annotations in IndexedDB when fetch fails. Drain queue on reconnect. Server deduplicates by (groupId, userId, location, flawType).

**Status:** Deferred — Socket.IO auto-reconnection handles brief drops. Classroom WiFi is reliable enough for now.

---

### 4.7 Idle Detection on Teacher Dashboard

**Problem:** Connection status shows only active (connected) vs disconnected. No "connected but idle for N minutes" state.

**Solution:** Server tracks `lastActivity` timestamps. Dashboard shows yellow dot for idle groups (connected but no events in N minutes).

---

### 4.8 Legacy Mode Removal

**Problem:** The app supports both v1 modes (Recognize, Locate, Classify, Explain as independent teacher-selected modes) and v3 stages (three-stage sequential flow). Dual-path routing in `student/session/[id]/page.tsx`.

**Solution:** Migrate all legacy sessions, remove v1 mode types from `types.ts`, remove legacy routing branch, remove `scripts/migrate-classify-to-locate.ts`.
