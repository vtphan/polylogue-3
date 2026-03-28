# CrossCheck — Pedagogical Model

CrossCheck teaches middle school students to identify critical thinking flaws in AI-generated discourse. This document describes the pedagogical model: **a five-stage session flow (Recognize → Explain → Collaborate → Locate → Results), demand-driven hints, collaborative writing, structured disagreement, and a motivation system built on visible progress and rewards**.

---

## Part 1: Theoretical Framework

### 1.1 Independence Gradient — The Organizing Principle

CrossCheck's stages are organized by **how much the system does for the student**. Within a single session, students progress through increasing cognitive demand. The system progressively withdraws support and the student takes on more cognitive work.

This is CrossCheck's own taxonomy. It mirrors Bloom's Revised Taxonomy (see Section 1.4) for academic audiences, but the teacher-facing UI never mentions Bloom's.

| Stage | System gives | Student does | Social context |
|-------|-------------|-------------|----------------|
| **Recognize** | Highlighted turn + 4 flaw type choices | Identify flaw type | Individual (iPad, solo) |
| **Explain** | Turns the group got right + correct type | Articulate *why* it's that flaw type | Group (teach back) |
| **Collaborate** | Turns with errors + Recognize distribution | Resolve disagreement, identify correct type, write justification | Group (team building) |
| **Locate** | Full transcript + count of missed flaws | Find flaws missed in previous stages | Group (detective challenge) |

Every session runs this flow. The teacher does not select a mode — the session structure *is* the independence gradient. Teachers set pass thresholds per stage to calibrate difficulty (see Part 3).

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
- **Social scaffolding:** Increases across stages. Recognize is individual; Explain, Collaborate, and Locate are group activities. Peers provide scaffolding through verbal discussion and collaborative writing.
- **Teacher interventions:** The scaffold system lets the teacher add support within any stage.

The total scaffolding remains relatively stable across stages — it shifts from system-provided to peer-provided, keeping students in the ZPD throughout.

### 1.3 Cognitive Load Theory — The Design Constraint

CLT (Sweller, 1988) says working memory is limited. Three types of cognitive load:

- **Intrinsic load:** Inherent task difficulty. Managed by the stage progression — each stage adds cognitive demand incrementally, building on the previous stage's output.
- **Extraneous load:** Unnecessary effort from poor design. Minimized by adapting the UI per stage — each stage shows only what's needed.
- **Germane load:** Productive schema-building effort. Maximized by ZPD-calibrated scaffolding and the requirement to articulate reasoning in Explain and Collaborate.

**Role in CrossCheck:** CLT governs two design decisions:
1. **Turn-by-turn presentation** in Recognize, Explain, and Collaborate keeps intrinsic load manageable.
2. **Stage progression** ensures students build familiarity with the transcript content (Recognize), practice articulating what they understand (Explain), then tackle harder items with group support (Collaborate), before searching freely (Locate). No stage asks the student to do something they haven't been prepared for.

### 1.4 Bloom's Revised Taxonomy — The Task Dimension

Bloom's Revised Taxonomy (Anderson & Krathwohl, 2001) describes six levels of cognitive processing. It provides the theoretical backbone of the independence gradient — each stage maps to a Bloom's level, which is why the stages are ordered the way they are.

The teacher-facing UI does not mention Bloom's. The stage flow is the practitioner-facing translation of the same underlying structure.

| Stage | Bloom's Level | Rationale |
|-------|--------------|-----------|
| Learn | Remember | Recall flaw type definitions and examples |
| Recognize | Understand | Comprehend what makes a shown passage a flaw |
| Explain | Apply | Articulate known understanding in one's own words |
| Collaborate | Evaluate | Make judgments, resolve disagreement, justify decisions collaboratively |
| Locate | Analyze | Independently identify flaws through directed search of the full transcript |

### 1.5 Self-Determination Theory — The Motivation Dimension

SDT (Deci & Ryan, 1985) identifies three innate psychological needs that drive intrinsic motivation:

- **Autonomy:** Feeling in control of one's actions. CrossCheck supports this through on-demand hints (student chooses when to ask for help) and optional continuation past the pass threshold.
- **Competence:** Feeling effective and capable. Supported by visible progress (goal bars), immediate positive feedback (coins for correct answers), the Explain stage (where students demonstrate what they *do* know), and achievable pass thresholds.
- **Relatedness:** Feeling connected to others. Supported by group stages (Explain, Collaborate, Locate), the "teach back" framing (peer contribution), and group coin totals (shared success).

The motivation system (coins, pass thresholds, goal bars) is designed to reinforce all three needs. Coins are earned for *learning behaviors* — correct identification, quality explanation, group consensus — not speed. There are no cross-group leaderboards.

### 1.6 The Integrated Model

```
    Support provided by system                    Social scaffolding
    ^                                             ^
    |                                             |
    |  Maximum     Recognize (individual)         |  None        Individual work on iPad
    |  support         |                          |                    |
    |                  |  Hints in every stage     |                    |
    |  High        Explain (group, teach back)    |  Low         Articulate to peers
    |  support         |                          |                    |
    |                  |                           |                    |
    |  Moderate    Collaborate (group, resolve)   |  Moderate    Discussion + writing
    |  support         |                          |                    |
    |                  |                           |                    |
    |  Minimal     Locate (group, search)         |  Maximum     Group search together
    |  support                                    |
    |                                             |
    +------------------------------------->        +------------------------------------->
                  Independence gradient                        Session progression
```

| Framework | Role | How it manifests |
|-----------|------|-----------------|
| **Bloom's** (task dimension) | Defines the independence gradient — why stages are ordered the way they are | Stage progression (Recognize → Explain → Collaborate → Locate) |
| **ZPD** (support dimension) | Determines how much help the student gets within a stage | Shift from system scaffolding to social scaffolding + on-demand hints |
| **CLT** (design constraint) | Governs the UI at each point — each stage shows only what's needed | Turn-by-turn in early stages, full transcript only in Locate |
| **SDT** (motivation dimension) | Ensures students stay engaged across stages | Coins, goal bars, teach-back framing, achievable thresholds |

The teacher makes zero mode decisions during session creation. The session structure itself enacts the independence gradient. Scaffolding within each stage is demand-driven — students self-scaffold via hints, and the teacher reads hint usage after the fact.

---

## Part 2: The Five-Stage Session Flow

Every session progresses through up to four active stages plus a results view. Recognize, Explain, and Collaborate always run. Locate is conditional. **No per-stage teacher configuration** beyond pass thresholds. Every stage starts at full difficulty; students request hints to reduce challenge incrementally.

### Unit of Analysis: The Turn

All stages operate on **turns** — individual agent contributions in the transcript. In a presentation, each turn is one agent's section. In a discussion, each turn is one agent's dialogue contribution.

- **Recognize** presents turns one at a time (system-controlled focus, individual).
- **Explain** presents selected turns one at a time (system-controlled focus, group).
- **Collaborate** presents selected turns one at a time (system-controlled focus, group).
- **Locate** shows the full transcript (student-controlled focus, group).

### Session Flow Overview

```
+---------------------------------------------------------------------+
|  Stage 1: RECOGNIZE (Individual)                                    |
|  Each student on their own iPad, turn-by-turn                       |
|  Pick flaw type from 4 choices. Every turn has a flaw.              |
|  Coins for correct answers. Goal bar tracks progress.               |
|  Teacher transitions when enough students are done.                 |
+---------------------------------------------------------------------+
        |
        v
+---------------------------------------------------------------------+
|  Stage 2: EXPLAIN (Group — Teach Back)                              |
|  Turns the group got unanimously correct in Recognize.              |
|  Students articulate *why* — "Teach your group."                    |
|  Builds confidence. Coins for explanations.                         |
+---------------------------------------------------------------------+
        |
        v
+---------------------------------------------------------------------+
|  Stage 3: COLLABORATE (Group — Team Building)                       |
|  Turns where any student was wrong in Recognize.                    |
|  Recognize distribution shown. Resolve disagreement together.       |
|  Step 1: select flaw type. Step 2: write justification.             |
|  Coins for correct group answers.                                   |
+---------------------------------------------------------------------+
        |
        v  (conditional)
+---------------------------------------------------------------------+
|  Stage 4: LOCATE (Group — Detective Challenge)                      |
|  Triggers only if flaws remain unidentified after Collaborate.      |
|  Full transcript. Group searches for missed flaws.                  |
|  Student-targeted hints (tap section -> confirm/deny).              |
|  If all flaws were caught: session skips to Results.                |
+---------------------------------------------------------------------+
        |
        v
+---------------------------------------------------------------------+
|  RESULTS                                                            |
|  End-of-session view showing the full journey across all stages.    |
+---------------------------------------------------------------------+
```

### Stage Transitions

| Transition | Trigger | Mechanism |
|------------|---------|-----------|
| Recognize → Explain | Teacher-triggered | Dashboard shows "X/Y students complete." Teacher reads the room and presses "Move to Explain." |
| Explain → Collaborate | Automatic | After the group completes all Explain turns, the system transitions to Collaborate. |
| Collaborate → Locate | Automatic, conditional | After the group completes Collaborate, the system checks: are there flaws that still have no correct identification from any student (Recognize) or from the group (Collaborate)? If yes → Locate. If no → Results. |
| Collaborate → Results | Automatic, conditional | If all flaws were caught across Recognize and Collaborate → skip Locate. |
| Locate → Results | Group completes or teacher ends | Group finds remaining flaws, or teacher ends the session. |

**Fast students in Recognize:** Students who finish early see a "Waiting for your group" screen with their individual stats and coins earned. The teacher manages pacing — this is normal classroom practice with individual-pace activities.

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
| **Student experience** | Transcript displayed turn by turn. Each turn is highlighted. Student picks from 4 flaw type choices. Every turn has exactly one flaw. Goal bar shows progress toward the teacher-set pass threshold |
| **Starting state** | 4 flaw type choices |
| **Hints** | Each hint eliminates one incorrect choice. Minimum 2 choices remaining. Max 2 hints per turn. Try-first delay: ~18 seconds |
| **Non-flawed turns** | Not included. Recognize only presents flawed turns. Detection skill (distinguishing flawed from non-flawed content) is practiced in Locate, where the full transcript naturally includes non-flawed turns and the task operates at the appropriate Bloom's level (Analyze) |
| **Transcript** | Shown turn by turn. Current turn highlighted |
| **Flaw Field Guide** | Not available (prevents lookup-table behavior; preserves pattern recognition) |
| **Matching** | Per-turn: correct type = green. Multi-attempt with elimination |
| **Coins** | Correct flaw type: 2 coins (3 if no hints used). Wrong answer: 0 coins |
| **CLT** | Low intrinsic load (comprehension, not identification). Turn-by-turn focus directs attention. One decision per turn (flaw type only) keeps extraneous load minimal |

#### Recognize — Hint Progression

| State | Choices shown | Student's task |
|-------|--------------|----------------|
| **Start** | 4 flaw types | Pick from 4 options |
| **Hint 1** | 3 flaw types | Pick from 3 options (1 wrong type removed) |
| **Hint 2** | 2 flaw types | Pick from 2 options (minimum) |

#### What Recognize Produces

Each student's per-turn selections become the input for the Explain/Collaborate split. The system uses this data to:
- **Explain:** Turns where *every* student selected the correct flaw type (unanimously correct).
- **Collaborate:** Turns where *any* student selected the wrong type (any error).

---

### Stage 2: Explain (Group — Teach Back)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Build confidence by articulating what the group already understands. Practice explaining *why* a passage is flawed. Earn coins for clear explanations |
| **Framing** | "Teach your group — explain why this is a [flaw type] flaw" |
| **Social context** | Group — students sit together, discuss verbally, each writes on their own iPad |
| **Turn selection** | Turns where *every* student selected the correct flaw type in Recognize. If a turn was unanimously correct, it appears here. Non-flawed turns are excluded |
| **Student experience** | Turns presented one at a time. The correct flaw type is shown (the group already knows it). Students write explanations of *why* it's that type. No type-selection step — they go straight to writing |
| **Starting state** | Highlighted turn + correct flaw type badge + writing area |
| **Hints** | Hint 1: guided template ("This is a [type] flaw because ___"). Max 1 hint per turn. Try-first delay: ~30 seconds |
| **Transcript** | Shown turn by turn. Current turn highlighted |
| **Flaw Field Guide** | Available (sidebar/drawer) |
| **Coins** | Submitting an explanation: 1 coin per student. Group completes all Explain turns: 2 bonus coins per student |
| **CLT** | Low-to-moderate intrinsic load. Students already know the answer — the cognitive work is articulation, not identification. The correct type is visible, removing the "blank page" problem |

#### Why Explain Comes Before Collaborate

1. **Confidence building.** Students start the group phase by demonstrating what they *do* know. Every item in Explain is one they got right. This creates positive momentum.
2. **Vocabulary practice.** Articulating "why" on easy items builds the language students need for harder Collaborate items.
3. **Social warmth.** The group's first shared activity is celebration of success, not confrontation of failure. This establishes psychological safety before Collaborate introduces disagreement.
4. **SDT alignment.** Explain directly satisfies the competence need — students feel effective. It also satisfies relatedness — they contribute to the group's understanding.

#### Collaborative Writing in Explain

Multiple students write explanations simultaneously, each on their own iPad. The system tracks authorship.

**Mechanic — Write-then-reveal:**
1. **Individual writing period (~45–60 seconds).** Each student writes their explanation independently. Other students' writing is not visible yet.
2. **Reveal.** All explanations become visible to the group simultaneously. Each explanation is attributed to its author.
3. **Brief discussion.** Students can read each other's explanations and discuss verbally. Revisions are optional.

**Advancing to next turn:** The group advances when at least one explanation has been submitted and the group marks the turn as discussed. The teacher sees contribution counts in the dashboard.

#### What Explain Produces

Written explanations (attributed per student). These are formative — not graded, but visible in Results and to the teacher. Explain does not change any flaw identifications.

---

### Stage 3: Collaborate (Group — Team Building)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Work together to resolve errors from Recognize. Build on the confidence and vocabulary from Explain |
| **Framing** | "These ones stumped some of us — let's figure them out together" |
| **Social context** | Group — students sit together, discuss verbally, each writes on their own iPad |
| **Turn selection** | Turns where *any* student selected the wrong flaw type in Recognize. This includes turns with disagreement and turns where everyone was wrong. The system does not reveal *which* students triggered inclusion |
| **Student experience** | Turns presented one at a time. For each turn: system shows the group's Recognize distribution (e.g., "2 said reasoning, 1 said epistemic"). **Step 1:** Group selects the flaw type (4 choices). **Step 2:** Students write justifications collaboratively |
| **Starting state** | Step 1: 4 flaw type choices with Recognize distribution shown. Step 2: writing area |
| **Hints** | Hint 1: reveals the correct flaw type (completes Step 1). Hint 2: provides a guided template. Max 2 hints per turn. Try-first delay: ~45 seconds (longer for group discussion). Any group member can request; visible to all |
| **Non-flawed turns** | Not included. Collaborate only presents flawed turns where errors occurred |
| **Transcript** | Shown turn by turn. Current turn highlighted |
| **Flaw Field Guide** | Available (sidebar/drawer) |
| **Coins** | Correct group type selection: 2 coins per student (3 if no hints). Submitting an explanation: 1 coin per student |
| **CLT** | Moderate intrinsic load. Step 1 provides a foothold (builds on Recognize). Social scaffolding from group discussion reduces individual cognitive burden. Collaborative writing distributes the articulation task |

#### Collaborate — Hint Progression

| State | Group sees | Group's task |
|-------|-----------|-------------|
| **Start** | Highlighted turn + Recognize distribution + Step 1 choices + Step 2 writing area | Discuss, select flaw type, write explanations |
| **Hint 1** | Correct flaw type revealed (Step 1 completed) | Write explanations knowing the type |
| **Hint 2** | Guided template shown ("This is a [type] flaw because ___") | Fill in the template |

#### Collaborative Writing in Collaborate

Same write-then-reveal mechanic as Explain:

1. **Individual writing period (~60–90 seconds).** Each student writes their explanation independently.
2. **Reveal.** All explanations become visible simultaneously, attributed to their authors.
3. **Discussion and revision.** Students discuss the revealed explanations verbally. Any student may revise their explanation or write a new one. Revisions are tracked.

**Why write-then-reveal:** Prevents copying while preserving collaboration. The individual period ensures every student engages with the task. The reveal creates a natural discussion catalyst — "you wrote X but I wrote Y, let's talk about it." The revision period lets students improve their thinking based on peers' perspectives.

**Advancing to next turn:** The group advances when at least one explanation has been submitted and the group marks the turn as discussed. No minimum per-student requirement — the teacher sees contribution counts in the dashboard.

#### Structured Disagreement

When the group's Recognize results show disagreement on a turn, the system facilitates structured disagreement:

1. **Surface the disagreement.** Display the Recognize distribution: "2 said reasoning, 1 said epistemic — discuss before selecting."
2. **Minority voice first.** The student(s) in the minority are prompted (on their iPad) to share their reasoning first. This prevents majority steamrolling.
3. **Perspective-taking.** After discussion, each student can optionally respond: "I now understand the other perspective because ___." This is captured but not required.
4. **No forced consensus.** The group selects a flaw type for Step 1, but individual students retain their original Recognize answers in the data.

Structured disagreement is a natural consequence of surfacing Recognize results — it doesn't require a separate component. The disagreement *is* the discussion.

#### Why Two Steps in Collaborate

The two-step flow separates identification from articulation:
- **Step 1 (select flaw type):** Builds directly on Recognize. The group already has individual opinions from Recognize; Step 1 asks them to converge (or discover they disagree).
- **Step 2 (write justification):** The harder cognitive task. By the time students write, they've already selected the type — they know *what* they're explaining. This removes the "blank page" problem.

For middle schoolers, this separation is important. A student might perceive the flaw correctly but produce a weak written explanation — not because they lack critical thinking skill, but because written expression is hard at 12. Step 1 captures the thinking; Step 2 captures the articulation. The teacher can distinguish between the two.

#### What Collaborate Produces

Group flaw type selections and written explanations. These feed the Locate trigger: flaws that remain unidentified after both Recognize and Collaborate become Locate targets.

---

### Stage 4: Locate (Group — Detective Challenge, Conditional)

| Aspect | Specification |
|--------|--------------|
| **Purpose** | Find flaws that the group missed in Recognize and Collaborate |
| **Framing** | "X flaws are still hiding in the transcript — can your team find them?" |
| **Trigger** | Automatic: activates only if flaws remain unidentified (no student selected the correct type in Recognize, and the group did not correct it in Collaborate). If all flaws were caught, session proceeds directly to Results |
| **Social context** | Group — students search together, discuss where flaws might be |
| **Student experience** | Full transcript displayed. System shows the number of missed flaws. Students read and flag turns they believe contain missed flaws |
| **Starting state** | Full transcript, no guidance. Number of missed flaws shown |
| **Hints** | Student-targeted: a student taps a section they're searching, then requests a hint. Hint 1: confirms or denies a flaw is in that section. Hint 2: highlights the specific turn. Hint 3: reveals the flaw type. Max 3 hints per flaw. Try-first delay: ~18 seconds per interaction. Any group member can request; visible to all |
| **Transcript** | Full transcript, no emphasis or dimming |
| **Flaw Field Guide** | Available (sidebar/drawer) |
| **Coins** | Finding a flaw independently: 3 coins. Finding with 1 hint: 2 coins. Finding with 2+ hints: 1 coin |
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
- **Earned, not punishing.** The positive framing ("detective challenge") makes it aspirational. The group enters Locate with momentum from Explain and Collaborate — they've already succeeded at many items.
- **Efficient.** Strong groups that caught everything skip Locate entirely — they earned their shortcut.
- **Contextual.** Students have already read every turn (Recognize), articulated their understanding (Explain), and discussed errors (Collaborate). Searching a familiar transcript is fundamentally different from cold-searching one they've never seen.

---

## Part 3: Motivation System

### 3.1 Design Principles

The motivation system serves three purposes:
1. **Make progress visible.** Students see how far they've come, not just how far they have to go.
2. **Create achievable win conditions.** Pass thresholds ensure most students experience success.
3. **Reward learning behaviors.** Coins reinforce correct identification, quality articulation, and group collaboration — not speed.

Three constraints:
- **No cross-group competition.** No leaderboards, no group rankings. Coins are per-student and per-group only.
- **No speed incentives.** Coins are never awarded for being first. The try-first delay on hints already prevents rushing.
- **Continuation past threshold.** Hitting the pass threshold is celebrated but does not stop the student. They can keep going for more coins.

### 3.2 Coins

Coins are the primary reward unit. They are earned individually but contribute to a visible group total.

| Stage | Action | Coins | Bonus |
|-------|--------|-------|-------|
| **Recognize** | Correct flaw type | 2 | +1 if no hints used |
| **Recognize** | Wrong answer | 0 | — |
| **Explain** | Submit explanation | 1 | — |
| **Explain** | Group completes all turns | 2 per student | — |
| **Collaborate** | Correct group type selection | 2 per student | +1 if no hints |
| **Collaborate** | Submit explanation | 1 | — |
| **Locate** | Find flaw independently | 3 | — |
| **Locate** | Find flaw with 1 hint | 2 | — |
| **Locate** | Find flaw with 2+ hints | 1 | — |

Coins are displayed:
- **Per turn:** Immediate feedback after each action ("+ 3 coins!")
- **Running total:** Visible in the stage header (individual count and group count)
- **Results view:** Final tally per stage with breakdown

### 3.3 Pass Thresholds

Teachers set a **pass threshold** for each stage at session creation. The threshold is the number of correct answers needed to "pass" the stage. It appears as a **goal bar** in the student UI.

| Stage | Threshold unit | Example |
|-------|---------------|---------|
| **Recognize** | Correct flaw type identifications | "Get 7 of 12 correct" |
| **Explain** | Explanations submitted | "Write 3 explanations" |
| **Collaborate** | Correct group type selections | "Get 4 of 8 correct as a team" |
| **Locate** | Flaws found | "Find 2 of 3 missed flaws" |

**Defaults:** If the teacher does not set thresholds, the system uses sensible defaults (e.g., 50% for Recognize, 2 for Explain, 50% for Collaborate, 50% for Locate).

**Behavior when threshold is reached:**
- Goal bar fills and a brief celebration animation plays.
- Student can continue working on remaining turns for more coins.
- Threshold does not auto-advance the group — the teacher or system still controls stage transitions.

**Why not auto-advance on threshold?** Some students want to keep going. The threshold is a milestone, not a gate. The teacher reads the room and decides when to move on.

### 3.4 Goal Bar

Each stage shows a **goal bar** — a horizontal progress indicator showing:
- Current correct count / threshold (e.g., "5 / 7")
- Visual fill proportional to progress
- Color change when threshold is reached (gray → green)
- Coin count alongside

The goal bar is the student's primary sense of "how am I doing?" within a stage.

---

## Part 4: Cross-Cutting Features

### Universal Hint System

The hint system is the primary scaffolding mechanism across all stages. Four principles:

1. **Start at full difficulty.** Every student/group begins each turn/task at the hardest level for that stage.
2. **Try first.** Hints unlock after a try-first period. The button is visible but disabled during the period, with a subtle countdown.
3. **Self-scaffold on demand.** Students request hints when stuck. Each hint removes one layer of challenge.
4. **Track everything.** Hint usage is recorded per student, per turn. Hint usage reduces coin rewards.

#### Try-First Delay

| Stage | Delay | Rationale |
|-------|-------|-----------|
| Recognize (individual) | ~18 seconds | Time to read the turn and consider choices |
| Explain (group) | ~30 seconds | Shorter — students already know the answer, just need to articulate |
| Collaborate (group) | ~45 seconds | Time for group discussion to begin before hinting |
| Locate (group) | ~18 seconds | Per-interaction delay; group is already searching |

#### Hint Framing

The hint button is labeled **"Narrow it down"** instead of "Hint." The teacher dashboard frames hint usage as "used strategic support" rather than implying deficiency. Middle schoolers are acutely sensitive to peer perception — if hints feel like admitting failure, students won't use them.

#### Hint Summary

| Stage | Hint 1 | Hint 2 | Hint 3 | Max hints |
|-------|--------|--------|--------|-----------|
| **Recognize** | Remove 1 wrong choice | Remove 1 more wrong choice | — | 2 per turn |
| **Explain** | Show guided template | — | — | 1 per turn |
| **Collaborate** | Reveal correct flaw type (complete Step 1) | Show guided template | — | 2 per turn |
| **Locate** | Confirm/deny flaw in tapped section | Highlight specific turn | Reveal flaw type | 3 per flaw |

#### Hint Usage as Assessment Signal

Because scaffolding is demand-driven rather than preset, **hint count becomes the primary signal of student independence**:

| Hint usage | Interpretation |
|------------|---------------|
| 0 hints | Completed independently |
| 1–2 hints | Used strategic support |
| Max hints | Needed heavy scaffolding |

### Why No False Positives in Recognize

Earlier designs included non-flawed turns in Recognize (either via "productive failure" where all choices were wrong, or via a "No flaw here" fifth button). Both approaches were removed for three reasons:

1. **Cognitive load mismatch.** Recognize is the warm-up stage — the lowest point on the independence gradient. But deciding "this has no flaw" requires evaluating the turn against all four flaw types and concluding none apply — that's closer to Bloom's Analyze level, which belongs in Locate, not Recognize. Including it violates the stage's CLT design constraint of one decision per turn.

2. **Muddied purpose.** Recognize trains flaw *type* discrimination: given that a turn is flawed, what kind? False positive detection trains a different skill: *whether* something is flawed at all. Mixing the two in one stage splits the student's attention between two different cognitive tasks.

3. **Detection belongs in Locate.** Locate already presents the full transcript, which naturally includes non-flawed turns. Students must decide which turns to flag — the "is this flawed?" question is organically embedded in Locate's search task, at the appropriate Bloom's level (Analyze), with group support available.

**Every turn in Recognize has exactly one flaw.** Students know this. Their task is purely classification: which of the 4 flaw types?

Non-flawed turns appear in Explain and Collaborate turn selection? No — both stages only present flawed turns (unanimously correct or any-error, respectively). Non-flawed content is only encountered in Locate (full transcript) and in the standalone Learn page.

### Flaw Field Guide

| Stage | Available? | Rationale |
|-------|-----------|-----------|
| Learn | Yes | Supports vocabulary building |
| Recognize | No | Prevents definition-matching; preserves pattern recognition |
| Explain | Yes | Supports articulation — students can reference definitions while writing |
| Collaborate | Yes | Supports articulation and disagreement resolution |
| Locate | Yes | Supports search — students can review what they're looking for |

### Results View

A single end-of-session view showing the group's journey across all stages:

- **Recognize results (individual):** Per-student accuracy, coins earned, individual hint usage
- **Explain results (group):** Per-turn explanations (attributed), writing contribution counts, coins earned
- **Collaborate results (group):** Per-turn flaw type selection, written explanations (attributed), disagreement resolution, hint usage, coins earned
- **Locate results (group, if triggered):** Missed flaw count, found count, hints needed per flaw, coins earned
- **Summary:** Total flaws, caught in Recognize, explained in Explain, corrected in Collaborate, found in Locate, remaining unfound. Total coins per student and per group

---

## Part 5: Design Decisions and Rationale

### Why a Single Flow (Not Teacher-Selected Modes)

Three problems with the previous mode-selection approach:

1. **Wrong mode risk.** A teacher might keep struggling students in one mode for weeks, or put unprepared students in another. The mode decision required predicting student readiness.
2. **Individual→group mismatch.** Some modes produced only labels (no reasoning), making the group phase awkward.
3. **Cross-session progression burden.** The teacher had to manually progress groups through modes across sessions.

The five-stage flow eliminates all three problems. Every session runs the full gradient. The teacher's only session-level decisions are which transcript to assign and what pass thresholds to set. The flow self-adapts: strong groups skip Locate; struggling groups get more time in Collaborate.

### Why Recognize is Individual and Group Stages Follow

Recognize is a warm-up — fast, low stakes, builds familiarity. Individual work ensures every student reads every turn and forms their own opinions before social influence.

Explain follows immediately and is group — but exclusively positive (teach back). This means the first group interaction is about demonstrating competence, not confronting failure. By the time Collaborate surfaces errors, the group has already established a pattern of productive collaboration.

### Why Explain and Collaborate are Separate Stages

A single "group discussion" stage that mixes correct and incorrect items has two problems:

1. **Motivational:** Starting with items you got wrong is deflating. Students who struggled in Recognize walk into an error-focused discussion.
2. **Pedagogical:** The cognitive task is different. Explaining *why you were right* (articulation) is fundamentally different from figuring out *where you went wrong* (error correction). Mixing them creates extraneous cognitive load.

Separating them lets each stage have a clear framing and purpose. Explain is warm ("teach your group"). Collaborate is challenging but social ("figure this out together"). The transition from one to the other feels like progression, not punishment.

### Why Every Recognize Turn Has a Flaw (Not False Positives)

Recognize deliberately excludes non-flawed turns. Three reasons:

1. **One task per turn.** The student's only question is "which flaw type?" — not "is this flawed?" This keeps cognitive load low and the stage fast.
2. **Confidence building.** Every turn has a correct answer from the 4 flaw types. Students never encounter a turn where every option is wrong (the earlier "productive failure" design) or where they must make a meta-judgment about the turn's validity.
3. **Stage purity.** Detection (is this flawed?) is a different skill from classification (what kind of flaw?). Detection is practiced in Locate, where the full transcript naturally includes non-flawed content and the task operates at the right Bloom's level.

### Why Coins (Not Grades or Points)

Coins are deliberately informal. They are not grades, not percentages, not letter scores. Middle schoolers respond to concrete, immediate rewards. Coins make correct answers feel like achievements without creating test anxiety.

Coins are earned for behaviors, not outcomes: submitting an explanation earns a coin even if the explanation isn't perfect. This encourages participation over perfectionism.

---

## Part 6: Architecture Reference

### Session Stage Values

Stored in `group.stage`:
- `"recognize"` — Stage 1 (individual)
- `"explain"` — Stage 2 (group, teach back)
- `"collaborate"` — Stage 3 (group, team building)
- `"locate"` — Stage 4 (group, conditional)
- `"results"` — Session complete, results view

The teacher triggers Recognize → Explain. The system triggers Explain → Collaborate. The system triggers Collaborate → Locate (or Collaborate → Results). The teacher or group triggers Locate → Results.

### Explain Turn Selection Logic

After Recognize completes, the system splits turns into two sets:

**Explain set** (unanimously correct):
1. For each flawed turn: check if *every* student selected the correct flaw type. If yes → include in Explain.

**Collaborate set** (any error):
1. For each flawed turn: check if *any* student selected the wrong flaw type. If yes → include in Collaborate.
2. The system does not reveal *which* errors triggered inclusion.

(Since Recognize only presents flawed turns, there are no non-flawed turns to exclude.)

These two sets are mutually exclusive and together cover all flawed turns.

### Locate Trigger Logic

After Collaborate completes, the system checks:

1. For each flaw in `activity.flawIndex[]`: did any student select the correct flaw type in Recognize, or did the group select the correct type in Collaborate?
2. Flaws with no correct identification → Locate targets.
3. If zero Locate targets → skip to Results.

### Design Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Hint try-first delay (Recognize) | ~18 seconds | Individual reading + consideration time |
| Hint try-first delay (Explain) | ~30 seconds | Students know the answer; just need to start writing |
| Hint try-first delay (Collaborate) | ~45 seconds | Group discussion needs more time to start |
| Hint try-first delay (Locate) | ~18 seconds | Per-interaction; group is already searching |
| Write-then-reveal period (Explain) | ~45-60 seconds | Shorter — articulating a known answer |
| Write-then-reveal period (Collaborate) | ~60-90 seconds | Longer — reasoning through uncertainty |
| Default pass threshold (Recognize) | 50% of turns | Most students can reach this |
| Default pass threshold (Explain) | 2 explanations | Low bar encourages participation |
| Default pass threshold (Collaborate) | 50% of turns | Achievable with group support |
| Default pass threshold (Locate) | 50% of missed flaws | Partial success is still success |
| Coin: correct Recognize answer | 2 (3 independent) | Primary individual reward |
| Coin: Explain submission | 1 | Rewards participation |
| Coin: Explain stage completion | 2 per student | Group milestone bonus |
| Coin: correct Collaborate selection | 2 (3 independent) | Group achievement |
| Coin: Collaborate submission | 1 | Rewards participation |
| Coin: Locate find (independent) | 3 | Highest reward — hardest task |
| Coin: Locate find (1 hint) | 2 | Partial independence |
| Coin: Locate find (2+ hints) | 1 | Participation reward |
