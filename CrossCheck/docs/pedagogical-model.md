# CrossCheck — Pedagogical Model and Extension Plan

CrossCheck teaches middle school students to identify critical thinking flaws in AI-generated discourse. This document describes the pedagogical model that underpins the app's difficulty progression, scaffolding system, and UI design — integrating Bloom's Revised Taxonomy, Vygotsky's Zone of Proximal Development (ZPD), and Cognitive Load Theory (CLT) into a unified framework for productive struggle.

---

## Part 1: Theoretical Framework

### 1.1 Bloom's Revised Taxonomy — The Task Dimension

Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001) describes six levels of cognitive processing, from simple recall to complex creation:

| Level | Cognitive Process | In CrossCheck |
|-------|------------------|---------------|
| **Remember** | Recall facts, definitions, terminology | Learn flaw type definitions and examples |
| **Understand** | Explain ideas, interpret meaning | Explain why a shown passage is a flaw |
| **Apply** | Use knowledge in a bounded, guided context | Find a flaw given its type and location area |
| **Analyze** | Break material into parts, examine relationships | Read a transcript and independently identify flaws |
| **Evaluate** | Make judgments, justify decisions | Classify flaws by type and severity, explain reasoning |
| **Create** | Produce new work, synthesize | Write corrections, evaluate peers' work, design flaws |

Each level requires the cognitive skills of all levels below it. A student cannot Analyze (find flaws independently) without first being able to Remember (what flaw types exist), Understand (why something counts as a flaw), and Apply (use that knowledge to locate an instance).

**Role in CrossCheck:** Bloom's levels map to difficulty modes. The mode determines what cognitive work the task demands — what the student must do with the transcript.

### 1.2 Zone of Proximal Development — The Support Dimension

Vygotsky's ZPD (1978) defines three zones for any learner:

- **Zone of Actual Development:** What the learner can do independently, without help. Tasks here are too easy — no learning occurs.
- **Zone of Proximal Development:** What the learner can do with appropriate support from a More Knowledgeable Other (MKO — teacher, peer, or structured tool). This is where learning happens.
- **Beyond ZPD:** What the learner cannot do even with help. Tasks here cause frustration, not learning.

**Scaffolding** (Wood, Bruner, & Ross, 1976) is the process of providing temporary support within the ZPD that is gradually removed (faded) as the learner gains competence. Effective scaffolding has three properties:

1. **Contingent** — Calibrated to the student's current state, not one-size-fits-all
2. **Fading** — Gradually withdrawn as competence develops
3. **Transfer of responsibility** — The student eventually performs independently

**Role in CrossCheck:** The ZPD maps to the support dimension. Support comes from two sources:

- **App-provided structure:** The difficulty mode itself provides scaffolding. Recognize mode gives the flaw location (heavy support). Spot mode gives nothing (minimal support). The mode determines the baseline scaffolding level.
- **Teacher interventions:** The 6-level scaffold system (attention redirect → comparison prompt → category nudge → question prompt → flaw type hint → metacognitive prompt) lets the teacher add support within the current mode. The teacher is the primary MKO, reading the room and deciding when and how to intervene.
- **Peer scaffolding:** The individual→group phase transition creates a natural MKO relationship. Students who identified a flaw explain it to students who didn't. This is ZPD's social learning mechanism operating without teacher direction.

### 1.3 Cognitive Load Theory — The Design Constraint

CLT (Sweller, 1988) posits that working memory is limited and that learning requires managing three types of cognitive load:

- **Intrinsic load:** The inherent difficulty of the material, determined by the content's complexity and the student's prior knowledge. Intrinsic load is irreducible for a given task — but can be managed by controlling task complexity (Bloom's level).
- **Extraneous load:** Unnecessary cognitive effort imposed by poor design — confusing interfaces, irrelevant information, split attention, redundant instructions. Extraneous load contributes nothing to learning and should be minimized.
- **Germane load:** Productive cognitive effort spent building and automating mental schemas — the actual learning. Germane load should be maximized, within the constraint that total load (intrinsic + extraneous + germane) does not exceed working memory capacity.

**Role in CrossCheck:** CLT acts as a constraint on the 2D space. At any point in the Bloom's × ZPD space:

- **Intrinsic load** is determined by the Bloom's level. Recognize (Understand) has low intrinsic load — the flaw is shown; the student only needs to comprehend it. Analyze (Evaluate) has high intrinsic load — the student must find, categorize, judge, and explain.
- **Extraneous load** is determined by the app design. The UI must adapt to the difficulty mode: in Recognize mode, hide the annotation toolbar (it's not needed). In Locate mode, visually emphasize the target section. In Classify mode, the flaw palette is essential context, not clutter.
- **Germane load** is the productive struggle. ZPD scaffolding calibrates germane load: enough challenge to build schemas, not so much that working memory overflows.

**The CLT constraint:** As Bloom's level increases (more intrinsic load), the app must compensate by reducing extraneous load and calibrating support. A student doing high-Bloom's work (Analyze/Evaluate) with a cluttered UI and no scaffolding will exceed cognitive capacity. A student doing low-Bloom's work (Remember/Understand) with a stripped-down UI and heavy scaffolding has working memory to spare.

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

**Three frameworks, three roles:**

| Framework | Determines | Axis/Role |
|-----------|-----------|-----------|
| Bloom's Revised Taxonomy | What cognitive work the task requires | X-axis (task complexity) |
| Zone of Proximal Development | How much support the student receives | Y-axis (support level) |
| Cognitive Load Theory | How the experience is designed at each point | Constraint on the space (governs UI, information visibility, scaffold calibration) |

**Learning is movement through the space:**

- **Right** (increase Bloom's level): Harder tasks — from being shown flaws to finding them independently
- **Down** (reduce support): Less scaffolding — from heavy hints to no hints
- **Diagonal** (both simultaneously): Only when the student is clearly ready

**The teacher's job:** Keep each group inside the productive struggle band. Use difficulty modes to set the Bloom's level. Use scaffolds to adjust ZPD support. The app minimizes extraneous load at every point.

**Fading** is the movement down the Y-axis. Within a session, the teacher can increase or decrease scaffold intensity. Across sessions, the teacher advances the difficulty mode. The combination is how scaffolding fades: over a semester, a student moves from "Recognize + heavy scaffolds" to "Classify + no scaffolds."

---

## Part 2: Existing Features Mapped to the Model

### 2.1 Difficulty Modes (Bloom's Dimension — Existing)

CrossCheck currently implements three modes, mapping to Bloom's levels 4-5:

| Mode | Bloom's Level | What the student does | Status |
|------|---------------|----------------------|--------|
| **Spot** | Analyze (beginning) | Highlight problematic passages, no classification | Implemented |
| **Classify** | Analyze (full) | Highlight + pick flaw type from 4 categories | Implemented (default) |
| **Full** | Evaluate | Highlight + classify + severity + explanation | Partially implemented (UI shows the mode but severity/explanation fields are not fully wired) |

**Gap:** Bloom's levels 1-3 (Remember, Understand, Apply) have no corresponding modes. Students are expected to jump directly to Analyze, which requires independent identification of flaws — a high-Bloom's task with high intrinsic load. For students encountering critical thinking flaws for the first time, this is above their ZPD.

### 2.2 Scaffolding System (ZPD Dimension — Existing)

CrossCheck implements two scaffolding channels:

**App-provided structure (static scaffolding):**

| Feature | ZPD Role | Status |
|---------|---------|--------|
| Flaw type definitions in the palette sidebar | Reference support — students can look up definitions | Implemented (4 types with one-line descriptions) |
| Color-coded flaw types | Reduces extraneous load — visual distinction | Implemented |
| Agent avatars and speaker labels | Reduces extraneous load — track who said what | Implemented |
| Presentation sections / discussion stage dividers | Reduces extraneous load — structural orientation | Implemented |

**Teacher interventions (dynamic scaffolding):**

| Feature | ZPD Role | Status |
|---------|---------|--------|
| 6-level scaffold system | Contingent support — teacher chooses intensity | Implemented |
| 12 pre-loaded scaffold templates | Reduces teacher effort, ensures quality | Implemented |
| Custom free-text scaffolds | Flexibility for unique situations | Implemented |
| Real-time scaffold delivery via Socket.IO | Immediate delivery, no page refresh | Implemented |
| Scaffold acknowledgment tracking | Teacher knows if the scaffold was received | Implemented |

**Peer scaffolding (social ZPD):**

| Feature | ZPD Role | Status |
|---------|---------|--------|
| Individual → Group phase transition | Think-pair-share pedagogy | Implemented |
| Group consensus (confirm/unconfirm) | Forces verbal negotiation before committing | Implemented |
| Annotations visible across group in group phase | Creates natural "I found this, did you?" moments | Implemented |

**Gap:** Scaffolding is entirely teacher-initiated and manual. The app does not suggest scaffolds based on group state, does not adapt scaffold suggestions to the difficulty mode, and does not track scaffold effectiveness. The teacher must notice struggling groups, decide the right scaffold level, craft or select the message, and send it — all while circulating among physical groups.

### 2.3 Cognitive Load Management (CLT — Existing)

**Extraneous load reduction:**

| Feature | CLT Role | Status |
|---------|---------|--------|
| Students see content only (metadata hidden) | Prevents split attention — students focus on the text, not knowledge area labels | Implemented |
| Phase-appropriate UI (annotation tools hidden in reviewing) | Removes irrelevant controls | Implemented |
| Fixed bottom bar (not floating toolbar) | Stable, predictable interface location | Implemented |
| Text selection with visual feedback (colored underlines) | Direct manipulation — selection maps visually to annotation | Implemented |

**Intrinsic load management:**

| Feature | CLT Role | Status |
|---------|---------|--------|
| Difficulty modes (Spot/Classify/Full) | Controls how many cognitive sub-tasks the student performs | Implemented (3 modes) |
| Per-group difficulty | Different groups can work at different intrinsic load levels | Implemented |

**Gap:** The UI does not adapt to the difficulty mode. Regardless of mode, students see the same interface — the flaw palette sidebar, the same bottom bar layout, the same transcript view. In Spot mode, the flaw type buttons are replaced with a single "Flag this" button, but the sidebar still shows flaw type categories. This is extraneous information for a student who doesn't need to classify — it adds cognitive load without benefit. CLT's "redundancy effect" applies: information that is unnecessary for the current task is harmful, not neutral.

### 2.4 Feedback and Assessment (Existing)

| Feature | Pedagogical Role | Status |
|---------|-----------------|--------|
| 3-pass matching engine (green/blue/red) | Delayed feedback with clear categories | Implemented |
| Feedback view with transcript + annotations + reference | Side-by-side comparison for self-assessment | Implemented |
| Teacher comments on annotations | Personalized feedback | Implemented |
| Bonus find flags | Validates student insights beyond the reference | Implemented |
| Student progress page (cross-session) | Long-term growth tracking | Implemented |
| Class projector view | Whole-class debrief support | Implemented |

**Gap:** Feedback is binary and delayed. Students work for 20-30 minutes, then see everything at once. There is no progressive revelation, no reflection prompts, and no connection between feedback and the next session's difficulty level.

---

## Part 3: Extensions to Realize the Model

### 3.1 New Difficulty Modes (Bloom's Levels 1-3)

**Learn Mode (Remember)**

Purpose: Build vocabulary before first exposure to transcripts.

Student experience:
- Screen shows the 4 flaw types with definitions and one clear example each (not from the current activity — generic, pre-written examples)
- Interactive matching: 4-6 short passages, each followed by "Which flaw type does this show?" (4 options) with immediate feedback and explanation
- Takes 3-5 minutes. Assigned before the first session or at the teacher's discretion

CLT consideration: Very low intrinsic load (recall and match). The UI shows only definitions and examples — no transcript, no annotation tools, no sidebar. Extraneous load is near zero. Germane load is focused on building the flaw type schema.

**Recognize Mode (Understand)**

Purpose: Comprehend what makes a passage a flaw, given that the flaw is already identified.

Student experience:
- Transcript is displayed with specific passages pre-highlighted (drawn from the reference evaluation's `evidence` field)
- For each highlighted passage, a card asks:
  - "What type of problem is this?" — 4 options (flaw types)
  - "Why is this a problem?" — 2-3 options (one correct, 1-2 plausible distractors derived from the flaw's `explanation`)
- After answering, student sees the evaluator's explanation
- Group phase: students discuss their answers physically before confirming

CLT consideration: Low-to-moderate intrinsic load (comprehension, not identification). The UI shows the transcript with highlighted passages and response cards — no annotation toolbar, no flaw palette sidebar (those are extraneous at this level). The highlighted passages direct attention, reducing visual search load.

Data source: Pre-highlighted passages come from `activity.evaluation.flaws[].evidence`. Response options generated from `flaws[].explanation` and `flaws[].flaw_type`. No pipeline changes needed — all data already exists.

**Locate Mode (Apply)**

Purpose: Find a flaw given its type and general area.

Student experience:
- A hint card appears at the top: "There's a **reasoning flaw** in the **Findings** section. Can you find the passage where the logic breaks down?"
- Student reads the indicated section and highlights the passage they think contains the flaw
- The standard annotation interface is active, but only for the hinted section (other sections are visually de-emphasized)
- Hints derived from the reference evaluation: flaw type from `flaw_type`, location from `location.references`
- If the student is stuck, the teacher can send a more specific hint (Level 2: "Compare what Jordan says about the fish data with what Amara said in the introduction")

CLT consideration: Moderate intrinsic load (apply knowledge to find a specific instance). The UI constrains the search space — the hinted section is visually prominent, other sections are dimmed. This reduces visual search load (extraneous) and focuses germane load on close reading within the bounded area. The hint card uses the element interactivity effect positively: it gives the student a cognitive frame (flaw type + location) that organizes their reading.

### 3.2 Flaw Field Guide (ZPD — Static Scaffolding)

An always-available expandable reference panel that replaces or augments the current FlawPalette sidebar. Content adapts to the student's experience level:

**For all students (static content):**
- Definitions with middle-school language (existing `FLAW_TYPES` constant)
- "What to look for" reading strategies per type (one sentence each):
  - Reasoning: "Watch for jumps from evidence to conclusion. Ask: does the proof match the claim?"
  - Epistemic: "Notice when someone sounds very sure. Ask: how do they actually know this?"
  - Completeness: "After reading, ask: who's missing? What could go wrong with their plan?"
  - Coherence: "Compare what different speakers say. Do they agree with each other?"
- One generic worked example per type

**After sessions (dynamic content):**
- Worked examples from transcripts the student has analyzed, shown after feedback
- "You encountered this epistemic flaw in Session 2: Amara stated littering is the primary source without evidence."

CLT consideration: The field guide is available on demand (click to expand) — not always visible. This prevents the "split attention effect" where students divide attention between the guide and the transcript. When expanded, it provides "just-in-time" information that supports germane load (building the flaw type schema) without adding permanent extraneous load.

### 3.3 Smart Scaffold Suggestions (ZPD — Adaptive Teacher Support)

The teacher dashboard surfaces observations based on comparing group annotations against the reference evaluation. Suggestions are framed as observations, not directives — the teacher decides whether and how to act.

**Suggestion types:**

| Observation | Based on | Example |
|-------------|---------|---------|
| Coverage gap | Sections/turns with 0 annotations that contain reference flaws | "Group B hasn't annotated Sections 3-5. Those sections contain 6 flaws." |
| Type gap | Reference has flaws of a type the group hasn't found | "Group A found reasoning flaws but 0 epistemic. There are 4 epistemic flaws." |
| Inactivity | No annotations in N minutes (group may be stuck or discussing) | "Group C has been idle for 5 minutes." |
| High false positive rate | Many annotations not matching reference flaws | "Group D has 8 annotations but only 2 match reference flaws." |
| Ready to advance | High detection rate at current difficulty | "Group A found 7 of 8 hinted flaws on Locate. Consider moving to Spot." |

**Scaffold suggestions adapt to difficulty mode:**

| Group's Mode | Suggested Scaffold Range | Rationale |
|-------------|------------------------|-----------|
| Learn / Recognize | Level 6 (metacognitive) | Content hints are already provided by the mode; scaffolds should focus on thinking process |
| Locate | Level 2-3 (comparison, category nudge) | Type hints are given; scaffolds add specificity about agents or relationships |
| Spot | Level 1-3 (redirect, comparison, nudge) | No hints provided; scaffolds narrow the search space |
| Classify | Level 3-4 (nudge, question) | Student finds flaws but may misclassify; scaffolds guide categorization reasoning |
| Analyze | Level 4-5 (question, hint) | Student works independently; scaffolds only when truly stuck |

CLT consideration: Suggestions appear as a small, collapsible section on the dashboard — not as popups or notifications that interrupt the teacher's attention. The teacher checks suggestions when they look at the dashboard; the dashboard does not demand attention. This respects the teacher's own cognitive load during a live session.

### 3.4 Progressive Feedback Revelation (Two Stages)

Instead of showing the full evaluation at once, feedback is revealed in two teacher-controlled stages:

**Stage 1 — Results:** Show match indicators (green/blue/red/yellow) and summary stats ("Your group found 7 of 12 flaws"). Students see what they got right and wrong, but not the detailed explanations yet. This creates a natural discussion moment — "We found 7, which 5 did we miss?"

**Stage 2 — Explanations:** Show full reference evaluation with descriptions, evidence quotes, and explanations. Students can now compare their understanding with the expert analysis.

Each stage is a button on the teacher dashboard. Stage 1 is released when the teacher advances to Reviewing. Stage 2 is released when the teacher is ready for the detailed debrief.

CLT consideration: Revealing everything at once causes cognitive overload — 12+ flaws with descriptions, evidence, and explanations plus the student's own annotations plus match indicators. Two stages manage intrinsic load by sequencing the information. Stage 1 gives the big picture (how did we do?). Stage 2 gives the details (why did we miss those?). Each stage has lower intrinsic load than the combined whole.

### 3.5 Group Discussion Prompts (Peer ZPD)

During group phase, the app generates prompts based on annotation disagreements within the group. These support productive discussion by surfacing cognitive conflicts:

| Trigger | Prompt |
|---------|--------|
| Two students annotated the same passage with different flaw types | "Maya chose reasoning and Ethan chose epistemic for this passage. Discuss: what's the difference? Which fits better?" |
| Three students flagged a passage but one didn't | "Three of you flagged this passage. Sam, take another look — do you see what they see?" |
| A confirmed group answer has only the minimum votes | "This is a group answer with 2 confirmations. Before moving on: is everyone convinced?" |

CLT consideration: Discussion prompts appear as subtle inline cards near the relevant annotation — not as modal popups. They use the students' own names and annotations, creating the "personalization effect" (Mayer, 2009) that increases engagement without adding extraneous load.

### 3.6 Reflection Prompts on Class Projector View

After feedback, the class projector view shows auto-generated discussion questions for whole-class debrief:

- "Three groups found the coherence flaw between Section 1 and Section 4 — what tipped you off?"
- "The most-missed flaw was an epistemic flaw in Turn 7. Let's re-read it together. What makes it hard to spot?"
- "Two groups flagged a passage as a flaw that wasn't in the reference. Was it a real flaw? Let's discuss."

These drive teacher-facilitated metacognitive discussion — Bloom's Evaluate applied to the class's own experience.

CLT consideration: Reflection prompts are on the projector (shared attention), not on individual screens (split attention). The teacher facilitates, managing the class's collective cognitive load through pacing and follow-up questions.

### 3.7 Mid-Session Difficulty Changes (ZPD Fading)

The teacher can change a group's difficulty mode during a session — advancing a group that's ready or stepping back a group that's struggling. This enables ZPD fading within a single class period rather than only between sessions.

The dashboard provides a mode indicator on each group card. The teacher clicks it to change modes. Students see a notification: "Your teacher changed your mode to Spot. You're now finding flaws on your own!"

### 3.8 Difficulty Recommendations (Cross-Session Progression)

Based on detection rates across sessions, the app suggests starting difficulty modes for the next session:

- "Group A averaged 80% detection on Locate across 2 sessions → suggest Spot"
- "Group B averaged 35% detection on Spot → suggest Locate or increase scaffolding"
- "This is the class's first session → suggest Learn or Recognize"

Recommendations appear when the teacher creates a new session. They are suggestions, not defaults — the teacher always chooses.

### 3.9 Mode-Adaptive UI (CLT — Extraneous Load Reduction)

The interface adapts to the current difficulty mode, showing only what's needed:

| Mode | Transcript View | Bottom Bar | Sidebar | Extra UI |
|------|----------------|-----------|---------|----------|
| Learn | Hidden (not needed) | Hidden | Hidden | Quiz cards only |
| Recognize | Shown with pre-highlighted passages | Hidden (no annotation) | Hidden | Response cards per flaw |
| Locate | Shown with target area emphasized, other areas dimmed | Single "Flag this" button | Hint card | Progressive hint button |
| Spot | Full transcript | Single "Flag this" button | Flaw Field Guide | — |
| Classify | Full transcript | 4 flaw type buttons | Flaw Field Guide + annotation list | — |
| Analyze | Full transcript | 4 flaw type buttons + severity + explanation | Flaw Field Guide + annotation list | Severity dropdown, explanation field |

Each mode shows less UI than the mode below it. CLT's "redundancy effect": information that is unnecessary for the current task is removed, not just hidden.

---

## Part 4: Implementation Plan

### Phase A: Difficulty Level Infrastructure + Mode-Adaptive UI

**Priority: Highest.** This creates the Bloom's progression that makes the app usable for first-time students.

**Schema changes:**
- Expand difficulty values to include `learn`, `recognize`, `locate` (in addition to existing `spot`, `classify`, `full`)
- Add `student_responses` JSONB on Annotation model (for Recognize mode structured responses) — or create a new `FlawResponse` model tied to reference flaws

**New components:**
- `<LearnMode>` — Quiz cards with flaw type definitions and matching exercises
- `<RecognizeMode>` — Transcript with pre-highlighted passages + response cards
- `<LocateMode>` — Transcript with hint cards + section emphasis
- `<HintCard>` — Displays progressive hints (type → location → agent)

**Modified components:**
- Session creation form — expand difficulty selector to 6 levels
- `SessionActivityViewer` — branch on difficulty mode to render the appropriate component
- `FlawBottomBar` — adapt per mode (hidden in Learn/Recognize, single button in Locate/Spot, full in Classify/Analyze)
- `FlawPalette` — replace with `FlawFieldGuide` that adapts per mode

**Data flow:** Learn mode uses static content. Recognize and Locate modes read from `activity.evaluation` and `activity.flawIndex` — data that already exists in the database. No pipeline changes needed.

### Phase B: Flaw Field Guide

**Priority: High.** Low effort, high impact. Supports all modes.

**New component:**
- `<FlawFieldGuide>` — Expandable panel with definitions, reading strategies, and worked examples
- Static content for definitions and strategies
- Dynamic content populated from previous session feedback (worked examples)
- Mobile-friendly: expandable drawer above the bottom bar on small screens (also addresses the Tier 4.4 mobile palette gap)

**No schema changes.** Content derived from `FLAW_TYPES` constant + evaluation data.

### Phase C: Smart Scaffold Suggestions

**Priority: High.** Makes the teacher more effective during live sessions.

**New component:**
- `<ScaffoldSuggestions>` — Collapsible section on teacher dashboard
- Suggestion engine: client-side function comparing group annotations against flaw_index
- Each suggestion includes a pre-drafted scaffold adapted to the group's current difficulty mode
- Teacher taps to send (editable) or dismisses

**No schema changes.** Logic runs client-side using session data already on the dashboard.

### Phase D: Progressive Feedback + Reflection Prompts

**Priority: Medium.** Turns feedback from passive to active.

**Schema change:**
- Add `feedback_stage` integer to group config JSONB (1 = results only, 2 = full explanations)

**Modified components:**
- Teacher dashboard: "Reveal Explanations" button in reviewing phase (advances feedback_stage from 1 to 2)
- Student feedback view: filters what's shown based on feedback_stage
- Class projector view: add auto-generated reflection prompts based on match results

### Phase E: Group Discussion Prompts

**Priority: Medium.** Supports peer ZPD during group phase.

**New component:**
- `<DiscussionPrompt>` — Inline card shown near annotations where group members disagree
- Trigger logic: computed from annotation state during group phase (different types on same passage, uneven confirmation counts)

**No schema changes.** Prompts are computed client-side from annotation state.

### Phase F: Mid-Session Difficulty Changes + Recommendations

**Priority: Medium.** Enables ZPD fading within and across sessions.

**Modified components:**
- Teacher dashboard: group card mode indicator becomes a clickable selector
- API: PATCH endpoint for group config (update difficulty_mode mid-session)
- Socket.IO: emit `group:difficulty_changed` event so student UI adapts immediately
- Session creation form: show difficulty recommendations based on past performance data

**Schema:** Group config already supports `difficulty_mode` (implemented). API endpoint for mid-session changes is new.

### Dependency Map

```
Phase A (difficulty modes) ←── foundational, must come first
    ↓
Phase B (field guide) ←── independent, can parallel with A
    ↓
Phase C (scaffold suggestions) ←── benefits from A (mode-aware suggestions)
    ↓
Phase D (progressive feedback) ←── independent of A-C
    ↓
Phase E (discussion prompts) ←── independent, benefits from group consensus feature
    ↓
Phase F (mid-session changes + recommendations) ←── requires A (more modes to switch between)
                                                  ←── requires cross-session data (for recommendations)
```

### Estimated Scope

| Phase | New Components | Modified Components | Schema Changes | Effort |
|-------|---------------|-------------------|---------------|--------|
| A | 4 | 4 | 1 migration | Large |
| B | 1 | 1 | None | Small |
| C | 1 | 1 | None | Medium |
| D | 0 | 3 | 1 field | Medium |
| E | 1 | 1 | None | Small |
| F | 0 | 3 | 1 endpoint | Medium |

---

## Part 5: The Student Journey (Semester View)

To illustrate how the model works in practice across a semester at UMS:

**Weeks 1-2: Learn + Recognize**
- Session 1: Learn mode (vocabulary primer, 5 minutes) → Recognize mode on a presentation
- Students see highlighted flaws, practice identifying types and explaining why
- Teacher sends Level 6 scaffolds (metacognitive: "Why do you think this is a problem?")
- Feedback: immediate (within Recognize mode) — students build the flaw type schema
- Students leave knowing: what the 4 flaw types are, what they look like in context

**Weeks 3-4: Locate**
- Sessions 2-3: Locate mode on presentations and discussions
- Students receive hint cards (type + section), search for specific flaws
- Teacher sends Level 2-3 scaffolds (comparison prompts, category nudges)
- Groups discuss their findings physically, compare what they highlighted
- Feedback: delayed, 2-stage reveal. Students see what they found, then explanations
- Students leave knowing: how to find flaws when given guidance, close reading skills

**Weeks 5-8: Spot + Classify**
- Sessions 4-7: Spot mode first (just find), then Classify (find + categorize)
- Teacher fades scaffolding: starts at Level 2-3, drops to Level 1 as groups improve
- Group consensus becomes central — students confirm/reject each other's annotations
- App suggests difficulty advancement: "Group A is ready for Classify"
- Teacher may run mixed modes: Group A on Classify, Group B still on Spot
- Students leave knowing: how to independently identify and categorize flaws

**Weeks 9-12: Classify + Analyze**
- Sessions 8-11: Classify for most groups, Analyze for advanced groups
- Teacher sends minimal scaffolds (Level 1 redirects only)
- Student progress page shows improvement trends
- Class projector view drives metacognitive discussion: "Why are epistemic flaws harder to spot?"
- Students leave knowing: how to evaluate critically, judge severity, explain reasoning

**STRIPES Showcase (end of semester):**
- Students apply their critical thinking skills to evaluate real PBL presentations
- The journey from "I can't see any problems" to "I can identify, classify, and explain why this reasoning is flawed" is the arc

---

## Part 6: Design Principles for Implementation

These principles should guide every implementation decision:

1. **The teacher is the pedagogical decision-maker, not the app.** The app surfaces information, suggests actions, and provides tools. It never sends scaffolds automatically, never changes difficulty modes without the teacher, and never makes pedagogical judgments. The teacher reads the room — physically and digitally — and decides.

2. **Less UI is more learning.** Every element on screen that isn't needed for the current task is extraneous load. Adapt the interface to the mode. When in doubt, hide it.

3. **Scaffolding is temporary by design.** Every support feature should have a path to removal. Hint cards go away when the student advances to Spot. The field guide is expandable, not permanent. Discussion prompts fade as groups develop their own discussion habits.

4. **Physical discussion is the learning.** The app creates conditions for productive discussion and then gets out of the way. Recognize mode creates "Why is this a flaw?" discussions. Locate mode creates "Is it this passage or that one?" discussions. Group consensus creates "What type is this?" discussions. The app structures; the learning happens verbally.

5. **Productive struggle requires time.** A group being idle for 3 minutes might be having a valuable discussion. Auto-scaffolding suggestions use language like "Group C has been idle" — not "Group C is stuck." The teacher decides whether to intervene.

6. **Feedback drives the next session, not just this one.** Detection rates, type breakdowns, and progression trajectories inform the teacher's difficulty mode choice for the next session. The app suggests but doesn't prescribe.
