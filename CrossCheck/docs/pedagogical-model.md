# CrossCheck — Pedagogical Model

CrossCheck teaches middle school students to identify critical thinking flaws in AI-generated discourse. This document describes the pedagogical model: **a three-stage session flow (Recognize → Explain → Locate), demand-driven hints, collaborative writing, and structured disagreement**.

---

## Part 1: Theoretical Framework

### 1.1 Independence Gradient — The Organizing Principle

CrossCheck's three stages are organized by **how much the system does for the student**. Within a single session, students progress through increasing cognitive demand: Recognize → Explain → Locate. The system progressively withdraws support and the student takes on more cognitive work.

This is CrossCheck's own taxonomy. It mirrors Bloom's Revised Taxonomy (see Section 1.4) for academic audiences, but the teacher-facing UI never mentions Bloom's.

| Stage | System gives | Student does | Social context |
|-------|-------------|-------------|----------------|
| **Recognize** | Highlighted turn + 4 flaw type choices | Identify flaw type from choices | Individual (iPad, solo) |
| **Explain** | Turns where errors occurred + Recognize results | Identify flaw type, write justification collaboratively | Group (together, verbal + writing) |
| **Locate** | Full transcript + count of missed flaws | Find flaws that the group missed | Group (together, searching) |

Every session runs this flow. The teacher does not select a mode — the session structure *is* the independence gradient.

**Learn** is a standalone vocabulary primer (accessible from the nav bar, not a session stage). It provides the prerequisite knowledge for all stages.

### 1.2 Zone of Proximal Development — The Support Dimension

Vygotsky's ZPD (1978) defines three zones:

- **Zone of Actual Development:** What the learner can do independently. Too easy — no learning.
- **Zone of Proximal Development:** What the learner can do with support. Where learning happens.
- **Beyond ZPD:** What the learner cannot do even with help. Frustration, not learning.

Scaffolding (Wood, Bruner, & Ross, 1976) is temporary support that is contingent, fading, and transfers responsibility to the learner.

**Role in CrossCheck:** Support comes from four sources, and the balance shifts across stages:

- **System scaffolding:** Decreases across stages. Recognize provides the most system support (choices, highlighting); Locate provides the least (full transcript, no guidance).
- **On-demand hints:** Every stage has a progressive hint system. Hints unlock after a try-first period to encourage initial engagement. Hint usage is tracked — teachers see how much support each student needed after the fact.
- **Social scaffolding:** Increases across stages. Recognize is individual; Explain and Locate are group activities. Peers provide scaffolding through verbal discussion and collaborative writing.
- **Teacher interventions:** The scaffold system lets the teacher add support within any stage.

The total scaffolding remains relatively stable across stages — it shifts from system-provided to peer-provided, keeping students in the ZPD throughout.

### 1.3 Cognitive Load Theory — The Design Constraint

CLT (Sweller, 1988) says working memory is limited. Three types of cognitive load:

- **Intrinsic load:** Inherent task difficulty. Managed by the stage progression — each stage adds cognitive demand incrementally, building on the previous stage's output.
- **Extraneous load:** Unnecessary effort from poor design. Minimized by adapting the UI per stage — each stage shows only what's needed.
- **Germane load:** Productive schema-building effort. Maximized by ZPD-calibrated scaffolding, false positives/productive failure, and the Explain stage's requirement to articulate reasoning.

**Role in CrossCheck:** CLT governs two design decisions:
1. **Turn-by-turn presentation** in Recognize and Explain keeps intrinsic load manageable.
2. **Stage progression** ensures students build familiarity with the transcript content (Recognize) before being asked to reason about it (Explain) or search it (Locate). No stage asks the student to do something they haven't been prepared for.

### 1.4 Bloom's Revised Taxonomy — The Task Dimension

Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001) describes six levels of cognitive processing. It provides the theoretical backbone of the independence gradient — each stage maps to a Bloom's level, which is why the stages are ordered the way they are.

The teacher-facing UI does not mention Bloom's. The three-stage flow is the practitioner-facing translation of the same underlying structure.

| Stage | Bloom's Level | Rationale |
|-------|--------------|-----------|
| Learn | Remember | Recall flaw type definitions and examples |
| Recognize | Understand | Comprehend what makes a shown passage a flaw |
| Explain | Evaluate | Make judgments, justify decisions with written reasoning |
| Locate | Analyze + Apply | Independently identify flaws through directed search of the full transcript |

### 1.5 The Integrated Model

```
    Support provided by system                    Social scaffolding
    ^                                             ^
    |                                             |
    |  Maximum     Recognize (individual)         |  None        Individual work on iPad
    |  support         |                          |                    |
    |                  |  Hints in every stage     |                    |
    |  Moderate    Explain (group)                |  Moderate    Verbal discussion +
    |  support         |                          |              collaborative writing
    |                  |                           |                    |
    |  Minimal     Locate (group, conditional)    |  Maximum     Group search together
    |  support                                    |
    |                                             |
    +------------------------------------->        +------------------------------------->
                  Independence gradient                        Session progression
```

| Framework | Role | How it manifests |
|-----------|------|-----------------|
| **Bloom's** (task dimension) | Defines the independence gradient — why stages are ordered the way they are | Stage progression (Recognize → Explain → Locate) |
| **ZPD** (support dimension) | Determines how much help the student gets within a stage | Shift from system scaffolding to social scaffolding + on-demand hints |
| **CLT** (design constraint) | Governs the UI at each point — each stage shows only what's needed | Turn-by-turn in early stages, full transcript only in Locate |

The teacher makes zero mode decisions during session creation. The session structure itself enacts the independence gradient. Scaffolding within each stage is demand-driven — students self-scaffold via hints, and the teacher reads hint usage after the fact.

---

## Part 2: The Three-Stage Session Flow

Every session progresses through three stages. The first two always run; the third is conditional. **No per-stage teacher configuration.** Every stage starts at full difficulty; students request hints to reduce challenge incrementally.

### Unit of Analysis: The Turn

All stages operate on **turns** — individual agent contributions in the transcript. In a presentation, each turn is one agent's section. In a discussion, each turn is one agent's dialogue contribution.

- **Recognize** presents turns one at a time (system-controlled focus, individual).
- **Explain** presents selected turns one at a time (system-controlled focus, group).
- **Locate** shows the full transcript (student-controlled focus, group).

### Session Flow Overview

```
+---------------------------------------------------------------------+
|  Stage 1: RECOGNIZE (Individual)                                    |
|  Each student on their own iPad, turn-by-turn                       |
|  Pick flaw type from 4 choices. Productive failure on clean turns.  |
|  Teacher transitions when enough students are done.                 |
+---------------------------------------------------------------------+
|  Stage 2: EXPLAIN (Group)                                           |
|  Students sit together, discuss verbally, write collaboratively     |
|  System surfaces turns where errors occurred in Recognize.          |
|  Step 1: select flaw type. Step 2: write justification.             |
|  Multiple students can write explanations simultaneously.           |
+---------------------------------------------------------------------+
|  Stage 3: LOCATE (Group, Conditional)                               |
|  Triggers only if flaws remain unidentified after Explain.          |
|  Full transcript. Group searches for missed flaws together.         |
|  Student-targeted hints (tap section -> confirm/deny).              |
|  If all flaws were caught: session ends after Explain.              |
+---------------------------------------------------------------------+
|  RESULTS                                                            |
|  End-of-session view showing the full journey across all stages.    |
+---------------------------------------------------------------------+
```

### Phase Transitions

| Transition | Trigger | Mechanism |
|------------|---------|-----------|
| Recognize → Explain | Teacher-triggered | Dashboard shows "X/Y students complete." Teacher reads the room and presses "Move to Explain." |
| Explain → Locate | Automatic, conditional | After the group completes Explain, the system checks: are there flaws that still have no correct identification from any student? If yes → Locate. If no → Results. |
| Locate → Results | Group completes or teacher ends | Group flags remaining flaws, or teacher ends the session. |

**Fast students in Recognize:** Students who finish early see a "Waiting for your group" screen. The teacher manages pacing — this is normal classroom practice with individual-pace activities.

### Learn (Standalone)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Build vocabulary before first transcript exposure |
| **Student experience** | Screen shows 4 flaw types with definitions and one example each. Interactive quiz: 8 short passages → "Which flaw type?" → immediate feedback with explanation |
| **Duration** | 3–5 minutes. Accessible from nav bar at any time |
| **Transcript** | Not shown |
| **Session stage?** | No — standalone page, not part of the session flow |
| **Flaw Field Guide** | Available |
| **CLT** | Very low intrinsic load. Zero extraneous load. Germane load focused on building the flaw type schema |

---

### Stage 1: Recognize (Individual)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Warm up. Build familiarity with the transcript. Form initial judgments about each turn |
| **Social context** | Individual — each student on their own iPad |
| **Student experience** | Transcript displayed turn by turn. Each turn is highlighted. Student picks from 4 flaw type choices. Some turns are **non-flawed** — all 4 choices are wrong for these turns (productive failure) |
| **Starting state** | 4 flaw type choices (no "No flaw" option) |
| **Hints** | Each hint eliminates one incorrect choice. Minimum 2 choices remaining. Max 2 hints per turn. Try-first delay: ~18 seconds |
| **Non-flawed turns** | When a turn has no flaw, every choice is wrong. The student selects one, gets feedback: "This turn is actually fine — not every statement has a problem. Knowing when something isn't flawed is part of critical thinking." Teaches discrimination through productive failure |
| **Transcript** | Shown turn by turn. Current turn highlighted |
| **Flaw Field Guide** | Not available (prevents lookup-table behavior; preserves pattern recognition) |
| **Matching** | Per-turn: correct type = green. Multi-attempt with elimination |
| **CLT** | Low intrinsic load (comprehension, not identification). Turn-by-turn focus directs attention. Non-flawed turns add productive germane load through surprise feedback |

#### Recognize — Hint Progression

| State | Choices shown | Student's task |
|-------|--------------|----------------|
| **Start** | 4 flaw types | Pick from 4 options |
| **Hint 1** | 3 flaw types | Pick from 3 options (1 wrong type removed) |
| **Hint 2** | 2 flaw types | Pick from 2 options (minimum) |

For non-flawed turns, hints still eliminate choices. After max hints, 2 choices remain — both wrong. Any selection triggers the productive failure feedback.

#### What Recognize Produces

Each student's per-turn flaw type selections become the input for Explain. The system uses this data to determine which turns the group needs to discuss.

---

### Stage 2: Explain (Group)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Discuss and articulate *why* passages are flawed. Build on Recognize results through verbal discussion and collaborative writing |
| **Social context** | Group — students sit together, discuss verbally, each writes on their own iPad |
| **Turn selection** | System surfaces turns where any student was wrong in Recognize. Turns where everyone was correct are skipped. The system does not reveal *which* errors triggered inclusion — the group just sees "discuss this turn" |
| **Student experience** | Turns presented one at a time. For each turn: system shows the group's Recognize results (e.g., "2 said reasoning, 1 said epistemic, 1 said completeness"). **Step 1:** Group selects the flaw type (4 choices + "No flaw"). **Step 2:** Students write justifications collaboratively (see Collaborative Writing below) |
| **Starting state** | Step 1: 4 flaw type choices + "No flaw," with Recognize distribution shown. Step 2: writing area showing all group members' explanations |
| **Hints** | Hint 1: reveals the correct flaw type (completes Step 1). Hint 2: provides a guided template ("This is a [type] flaw because ___"). Max 2 hints per turn. Try-first delay: ~45 seconds (longer for group discussion). Any group member can request; visible to all |
| **Non-flawed turns** | Not included. Productive failure in Recognize is the complete handling for non-flawed turns |
| **Transcript** | Shown turn by turn. Current turn highlighted |
| **Flaw Field Guide** | Available (sidebar/drawer) |
| **CLT** | Moderate intrinsic load. Step 1 provides a foothold (builds on Recognize). Social scaffolding from group discussion reduces individual cognitive burden. Collaborative writing distributes the articulation task |

#### Explain — Hint Progression

| State | Group sees | Group's task |
|-------|-----------|-------------|
| **Start** | Highlighted turn + Recognize distribution + Step 1 choices + Step 2 writing area | Discuss, select flaw type, write explanations |
| **Hint 1** | Correct flaw type revealed (Step 1 completed) | Write explanations knowing the type |
| **Hint 2** | Guided template shown ("This is a reasoning flaw because ___") | Fill in the template |

#### Collaborative Writing

Multiple students write explanations simultaneously, each on their own iPad. The system tracks authorship.

**Mechanic — Hybrid write-then-reveal:**
1. **Individual writing period (~60–90 seconds).** Each student writes their explanation independently. Other students' writing is not visible yet.
2. **Reveal.** All explanations become visible to the group simultaneously. Each explanation is attributed to its author.
3. **Discussion and revision.** Students discuss the revealed explanations verbally. Any student may revise their explanation or write a new one. Revisions are tracked.

**Why write-then-reveal:** Prevents copying while preserving collaboration. The individual period ensures every student engages with the task. The reveal creates a natural discussion catalyst — "you wrote X but I wrote Y, let's talk about it." The revision period lets students improve their thinking based on peers' perspectives.

**Advancing to next turn:** The group advances when at least one explanation has been submitted and the teacher or group marks the turn as discussed. No minimum per-student requirement — the teacher sees contribution counts in the dashboard.

#### Structured Disagreement

When the group's Recognize results show disagreement on a turn, the system facilitates structured disagreement:

1. **Surface the disagreement.** Display the Recognize distribution: "2 said reasoning, 1 said epistemic — discuss before selecting."
2. **Minority voice first.** The student(s) in the minority are prompted (on their iPad) to share their reasoning first. This prevents majority steamrolling.
3. **Perspective-taking.** After discussion, each student can optionally respond: "I now understand the other perspective because ___." This is captured but not required.
4. **No forced consensus.** The group selects a flaw type for Step 1, but individual students retain their original Recognize answers in the data.

Structured disagreement is a natural consequence of surfacing Recognize results — it doesn't require a separate phase or component. The disagreement *is* the discussion.

#### Why Two Steps in Explain

The two-step flow separates identification from articulation:
- **Step 1 (select flaw type):** Builds directly on Recognize. The group already has individual opinions from Recognize; Step 1 asks them to converge (or discover they disagree).
- **Step 2 (write justification):** The harder cognitive task. By the time students write, they've already selected the type — they know *what* they're explaining. This removes the "blank page" problem.

For middle schoolers, this separation is important. A student might perceive the flaw correctly but produce a weak written explanation — not because they lack critical thinking skill, but because written expression is hard at 12. Step 1 captures the thinking; Step 2 captures the articulation. The teacher can distinguish between the two.

---

### Stage 3: Locate (Group, Conditional)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Find flaws that the group missed in Recognize and Explain |
| **Trigger** | Automatic: activates only if flaws remain unidentified (no student selected the correct type in Recognize, and the group did not correct it in Explain). If all flaws were caught, session proceeds directly to Results |
| **Social context** | Group — students search together, discuss where flaws might be |
| **Student experience** | Full transcript displayed. System shows: "Your group missed X flaws — they're somewhere in the transcript. Find them." Students read and flag turns they believe contain missed flaws |
| **Starting state** | Full transcript, no guidance. Number of missed flaws shown |
| **Hints** | Student-targeted: a student taps a section they're searching, then requests a hint. Hint 1: confirms or denies a flaw is in that section. Hint 2: highlights the specific turn. Hint 3: reveals the flaw type. Max 3 hints per flaw. Try-first delay: ~18 seconds per interaction. Any group member can request; visible to all |
| **Transcript** | Full transcript, no emphasis or dimming |
| **Flaw Field Guide** | Available (sidebar/drawer) |
| **CLT** | Highest intrinsic load (search across full transcript). Mitigated by: (a) students already read every turn in Recognize, so the content is familiar; (b) the number of missed flaws is known, giving a goal; (c) group discussion distributes the search; (d) student-targeted hints align with actual search behavior |

#### Locate — Hint Progression

| State | Group sees | Group's task |
|-------|-----------|-------------|
| **Start** | Full transcript + "X flaws remaining" | Find missed flaws anywhere |
| **Hint 1** | Student taps a section → system confirms or denies flaw presence | Narrow search based on confirmation |
| **Hint 2** | Specific turn highlighted within confirmed section | Confirm this turn is flawed |
| **Hint 3** | Flaw type revealed | Understand what kind of flaw it is |

**Section denial is free.** If a student taps a section and the system says "No flaws here," that does not count as a hint used. Only confirmations and narrowing count as hints.

#### Why Locate is Conditional

Locate only triggers when the group missed flaws. This makes it:
- **Earned, not assigned.** The group enters Locate because they missed something — a natural consequence, not a punishment.
- **Gamified.** "You missed 2 flaws — find them" is a challenge, not an assignment.
- **Efficient.** Strong groups that caught everything skip Locate entirely.
- **Contextual.** Students have already read every turn (Recognize) and discussed error turns (Explain). Searching a familiar transcript is fundamentally different from cold-searching one they've never seen.

---

## Part 3: Cross-Cutting Features

### Universal Hint System

The hint system is the primary scaffolding mechanism across all stages. Four principles:

1. **Start at full difficulty.** Every student/group begins each turn/task at the hardest level for that stage.
2. **Try first.** Hints unlock after a try-first period. The button is visible but disabled during the period, with a subtle countdown.
3. **Self-scaffold on demand.** Students request hints when stuck. Each hint removes one layer of challenge.
4. **Track everything.** Hint usage is recorded per student, per turn.

#### Try-First Delay

| Stage | Delay | Rationale |
|-------|-------|-----------|
| Recognize (individual) | ~18 seconds | Time to read the turn and consider choices |
| Explain (group) | ~45 seconds | Time for group discussion to begin before hinting |
| Locate (group) | ~18 seconds | Per-interaction delay; group is already searching |

#### Hint Framing

The hint button is labeled **"Narrow it down"** instead of "Hint." The teacher dashboard frames hint usage as "used strategic support" rather than implying deficiency. Middle schoolers are acutely sensitive to peer perception — if hints feel like admitting failure, students won't use them.

#### Hint Summary

| Stage | Hint 1 | Hint 2 | Hint 3 | Max hints |
|-------|--------|--------|--------|-----------|
| **Recognize** | Remove 1 wrong choice | Remove 1 more wrong choice | — | 2 per turn |
| **Explain** | Reveal correct flaw type (complete Step 1) | Show guided template | — | 2 per turn |
| **Locate** | Confirm/deny flaw in tapped section | Highlight specific turn | Reveal flaw type | 3 per flaw |

#### Hint Usage as Assessment Signal

Because scaffolding is demand-driven rather than preset, **hint count becomes the primary signal of student independence**:

| Hint usage | Interpretation |
|------------|---------------|
| 0 hints | Completed independently |
| 1–2 hints | Used strategic support |
| Max hints | Needed heavy scaffolding |

### False Positives and Productive Failure

**Recognize:** Non-flawed turns are included without a "No flaw" escape hatch. All 4 flaw type choices are wrong — selecting any one triggers productive failure feedback. This teaches discrimination through surprise rather than a pattern-matching shortcut.

**Explain:** Non-flawed turns are not included.

**Locate:** Clean turns are naturally present in the full transcript.

**False positive ratio:** Approximately 1 non-flawed turn per 3–4 flawed turns in Recognize. Generated at render time with a deterministic seed (`hash(sessionId + groupId)`), consistent across page refreshes.

### Flaw Field Guide

| Stage | Available? | Rationale |
|-------|-----------|-----------|
| Learn | Yes | Supports vocabulary building |
| Recognize | No | Prevents definition-matching; preserves pattern recognition |
| Explain | Yes | Supports articulation — students can reference definitions while writing |
| Locate | Yes | Supports search — students can review what they're looking for |

### Results View

A single end-of-session view showing the group's journey across all stages:

- **Recognize results (individual):** Per-student accuracy, productive failure turns, individual hint usage
- **Explain results (group):** Per-turn flaw type selection, written explanations (attributed), disagreement resolution, hint usage, writing contribution counts
- **Locate results (group, if triggered):** Missed flaw count, found count, hints needed per flaw
- **Summary:** Total flaws, caught in Recognize, corrected in Explain, found in Locate, remaining unfound

---

## Part 4: Design Decisions and Rationale

### Why a Single Flow (Not Teacher-Selected Modes)

Three problems with the previous mode-selection approach:

1. **Wrong mode risk.** A teacher might keep struggling students in one mode for weeks, or put unprepared students in another. The mode decision required predicting student readiness.
2. **Individual→group mismatch.** Some modes produced only labels (no reasoning), making the group phase awkward.
3. **Cross-session progression burden.** The teacher had to manually progress groups through modes across sessions.

The three-stage flow eliminates all three problems. Every session runs the full gradient. The teacher's only session-level decision is which transcript to assign. The flow self-adapts: strong groups skip Locate; struggling groups get more time in Explain.

### Why Recognize is Individual and Explain is Group

Recognize is a warm-up — fast, low stakes, builds familiarity. Individual work ensures every student reads every turn and forms their own opinions before social influence.

Explain requires articulation, which is harder. The group context provides social scaffolding: students can talk through their reasoning before writing. The collaborative writing mechanic distributes the cognitive load.

### Why Productive Failure (Not "No Flaw")

Including "No flaw" as a fifth choice in Recognize creates a pattern-matching escape hatch — students who are unsure select it as a safe default. Productive failure forces genuine engagement.

"No flaw" appears in Explain (Step 1) because the context is different: social cost of opting out is higher, and the Explain turns were surfaced because someone got them wrong.

### Why Collaborative Writing (Not Single-Recorder)

Everyone writes on their own iPad. This preserves individual accountability within group work. The write-then-reveal mechanic prevents copying while enabling collaboration. The teacher sees who contributed.

---

## Part 5: Architecture Reference

### Session Stage Values

Stored in `group.stage`:
- `"recognize"` — Stage 1 (individual)
- `"explain"` — Stage 2 (group)
- `"locate"` — Stage 3 (group, conditional)
- `"results"` — Session complete, results view

The teacher triggers Recognize → Explain. The system triggers Explain → Locate (or Explain → Results). The teacher or group triggers Locate → Results.

### Explain Turn Selection Logic

After Recognize completes, the system selects turns for Explain:

1. For each flawed turn: check if *any* student selected the wrong flaw type. If yes → include in Explain.
2. Non-flawed turns: exclude (productive failure already handled).
3. Turns where every student was correct: skip (nothing to discuss).
4. The system does not reveal *why* a turn was included.

### Locate Trigger Logic

After Explain completes, the system checks:

1. For each flaw in `activity.flawIndex[]`: did any student select the correct flaw type in Recognize, or did the group select the correct type in Explain?
2. Flaws with no correct identification → Locate targets.
3. If zero Locate targets → skip to Results.

### Design Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Hint try-first delay (Recognize) | ~18 seconds | Individual reading + consideration time |
| Hint try-first delay (Explain) | ~45 seconds | Group discussion needs more time to start |
| Hint try-first delay (Locate) | ~18 seconds | Per-interaction; group is already searching |
| False positive ratio | ~1:3-4 (non-flawed : flawed turns) | Balances discrimination practice against confidence |
| Write-then-reveal period | ~60-90 seconds | Long enough for a few sentences; short enough to maintain pace |
