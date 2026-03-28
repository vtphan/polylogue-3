# CrossCheck — Pedagogical Model v3

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
    ↑                                             ↑
    │                                             │
    │  Maximum     Recognize (individual)         │  None        Individual work on iPad
    │  support         │                          │                    │
    │                  │  Hints in every stage     │                    │
    │  Moderate    Explain (group)                │  Moderate    Verbal discussion +
    │  support         │                          │              collaborative writing
    │                  │                           │                    │
    │  Minimal     Locate (group, conditional)    │  Maximum     Group search together
    │  support                                    │
    │                                             │
    └─────────────────────────────────────→        └─────────────────────────────────────→
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
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 1: RECOGNIZE (Individual)                                    │
│  Each student on their own iPad, turn-by-turn                       │
│  Pick flaw type from 4 choices. Productive failure on clean turns.  │
│  Teacher transitions when enough students are done.                 │
├─────────────────────────────────────────────────────────────────────┤
│  Stage 2: EXPLAIN (Group)                                           │
│  Students sit together, discuss verbally, write collaboratively     │
│  System surfaces turns where errors occurred in Recognize.          │
│  Step 1: select flaw type. Step 2: write justification.             │
│  Multiple students can write explanations simultaneously.           │
├─────────────────────────────────────────────────────────────────────┤
│  Stage 3: LOCATE (Group, Conditional)                               │
│  Triggers only if flaws remain unidentified after Explain.          │
│  Full transcript. Group searches for missed flaws together.         │
│  Student-targeted hints (tap section → confirm/deny).               │
│  If all flaws were caught: session ends after Explain.              │
├─────────────────────────────────────────────────────────────────────┤
│  RESULTS                                                            │
│  End-of-session view showing the full journey across all stages.    │
└─────────────────────────────────────────────────────────────────────┘
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
| **Data source** | Static content: `FLAW_TYPES` constant + pre-written generic examples |
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
| **Data source** | `activity.evaluation.flaws[].evidence` for flaw identification |
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
| **Data source** | `activity.flawIndex[]` for hint content. Student Recognize responses for distribution display |
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

**What the teacher sees:** Explanation count per student across all turns. Who is writing, who is not. This surfaces social loafing without requiring the system to enforce participation.

#### Structured Disagreement

When the group's Recognize results show disagreement on a turn, the system facilitates structured disagreement:

1. **Surface the disagreement.** Display the Recognize distribution: "2 said reasoning, 1 said epistemic — discuss before selecting."
2. **Minority voice first.** The student(s) in the minority are prompted (on their iPad) to share their reasoning first. This prevents majority steamrolling.
3. **Perspective-taking.** After discussion, each student can optionally respond: "I now understand the other perspective because ___." This is captured but not required.
4. **No forced consensus.** The group selects a flaw type for Step 1, but individual students retain their original Recognize answers in the data. The group selection is a separate record.

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
| **Data source** | `activity.flawIndex[]` for hint system. Recognize + Explain results to determine which flaws are "missed" |
| **CLT** | Highest intrinsic load (search across full transcript). Mitigated by: (a) students already read every turn in Recognize, so the content is familiar; (b) the number of missed flaws is known, giving a goal; (c) group discussion distributes the search; (d) student-targeted hints align with actual search behavior |

#### Locate — Hint Progression

| State | Group sees | Group's task |
|-------|-----------|-------------|
| **Start** | Full transcript + "X flaws remaining" | Find missed flaws anywhere |
| **Hint 1** | Student taps a section → system confirms or denies flaw presence | Narrow search based on confirmation |
| **Hint 2** | Specific turn highlighted within confirmed section | Confirm this turn is flawed |
| **Hint 3** | Flaw type revealed | Understand what kind of flaw it is |

**Section denial is free.** If a student taps a section and the system says "No flaws here," that does not count as a hint used. It's directional guidance that prevents wasted effort. Only confirmations and narrowing count as hints.

#### Why Student-Targeted Hints

Round-robin hints (system picks the next unfound flaw) can point students to a section they haven't read yet, which feels arbitrary. Student-targeted hints respond to *where the group is actually looking* — they say "we've been searching here and can't find it," which is exactly the right moment for scaffolding. This aligns the hint system with the group's actual search process.

#### Why Locate is Conditional

Locate only triggers when the group missed flaws. This makes it:
- **Earned, not assigned.** The group enters Locate because they missed something, not because the teacher selected a mode. This feels like a natural consequence, not a punishment.
- **Gamified.** "You missed 2 flaws — find them" is a challenge, not an assignment. The known count creates a goal.
- **Efficient.** Strong groups that caught everything skip Locate entirely. The session adapts to the group's performance.
- **Contextual.** Students already read every turn in Recognize. They discussed error turns in Explain. Now they're searching for what they missed — they have full context. This is fundamentally different from cold-searching a transcript they've never seen.

---

## Part 3: Cross-Cutting Features

### Universal Hint System

The hint system is the primary scaffolding mechanism across all stages. It follows four principles:

1. **Start at full difficulty.** Every student/group begins each turn/task at the hardest level for that stage.
2. **Try first.** Hints unlock after a try-first period, encouraging engagement before requesting support. The button is visible but disabled during the try-first period, with a subtle countdown.
3. **Self-scaffold on demand.** Students request hints when stuck. Each hint removes one layer of challenge.
4. **Track everything.** Hint usage is recorded per student, per turn. Teachers see this in the dashboard.

#### Try-First Delay

| Stage | Delay | Rationale |
|-------|-------|-----------|
| Recognize (individual) | ~18 seconds | Time to read the turn and consider choices |
| Explain (group) | ~45 seconds | Time for group discussion to begin before hinting |
| Locate (group) | ~18 seconds | Per-interaction delay; group is already searching |

The delay addresses two failure modes in middle school help-seeking behavior (Ryan, Pintrich, & Midgley, 2001):
- **Help abuse:** Students who click hints immediately to minimize effort.
- **Normalization:** The visible countdown communicates "everyone waits" — it's how the system works, not a judgment.

#### Hint Framing

The hint button uses strategic language rather than rescue language. The button is labeled **"Narrow it down"** instead of "Hint." The teacher dashboard frames hint usage as "used strategic support" rather than implying deficiency.

Why: Middle schoolers are acutely sensitive to peer perception. If hints feel like admitting failure, students won't use them. If they feel like a strategic tool, usage normalizes.

#### Hint Summary

| Stage | Hint 1 | Hint 2 | Hint 3 | Max hints |
|-------|--------|--------|--------|-----------|
| **Recognize** | Remove 1 wrong choice | Remove 1 more wrong choice | — | 2 per turn |
| **Explain** | Reveal correct flaw type (complete Step 1) | Show guided template | — | 2 per turn |
| **Locate** | Confirm/deny flaw in tapped section | Highlight specific turn | Reveal flaw type | 3 per flaw |

**UI pattern:** One "Narrow it down" button, consistent across all stages. Each tap makes the task easier in a stage-appropriate way. The button shows remaining count (e.g., "Narrow it down (2)"). Grayed with countdown during try-first period.

**Group hint requesting (Explain and Locate):** Any group member can request a hint. The request and result are visible to the entire group. The teacher dashboard shows who requested each hint.

#### Hint Usage as Assessment Signal

Because scaffolding is demand-driven rather than preset, **hint count becomes the primary signal of student independence**:

| Hint usage | Interpretation |
|------------|---------------|
| 0 hints | Completed independently |
| 1–2 hints | Used strategic support |
| Max hints | Needed heavy scaffolding |

Two students in the same session may have very different hint profiles in Recognize, giving the teacher fine-grained data about individual readiness.

### False Positives and Productive Failure

**Recognize:** Non-flawed turns are included in the turn sequence without a "No flaw" escape hatch. All 4 flaw type choices are wrong — selecting any one triggers productive failure feedback: "This turn is actually fine — not every statement has a problem." This teaches discrimination through surprise rather than a pattern-matching shortcut.

**Explain:** Non-flawed turns are not included. Productive failure in Recognize already handled them. Explain only surfaces turns where errors occurred.

**Locate:** Clean turns are naturally present in the full transcript.

**False positive ratio:** Approximately 1 non-flawed turn per 3–4 flawed turns in Recognize. This ratio balances two risks: too many erode student confidence; too few and students assume every turn is flawed. This is a design parameter, tunable during testing.

**Implementation:** Generated at render time with a deterministic seed (`hash(sessionId + groupId)`). Consistent across page refreshes. Shared logic between client and server (the hint API must know which turns are non-flawed).

### Flaw Field Guide

A reference panel showing flaw type definitions, examples, and reading strategies:

| Stage | Available? | Rationale |
|-------|-----------|-----------|
| Learn | Yes | Supports vocabulary building |
| Recognize | No | Prevents definition-matching; preserves pattern recognition |
| Explain | Yes | Supports articulation — students can reference definitions while writing |
| Locate | Yes | Supports search — students can review what they're looking for |

- **Desktop:** Sidebar panel (collapsible).
- **Mobile/iPad:** Floating drawer (swipe up).

### Results View

A single end-of-session view showing the group's journey across all stages:

**Recognize results (individual):**
- Per-student accuracy: "Jayden: 7/10 correct, 2 with strategic support"
- Turns where productive failure occurred (non-flawed turns correctly handled)
- Individual hint usage profile

**Explain results (group):**
- Per-turn: group's flaw type selection + all written explanations (attributed)
- Which turns had disagreements and how they were resolved
- Hint usage in Explain (who requested, which turns)
- Writing contribution count per student

**Locate results (group, if triggered):**
- "Your group missed X flaws" → "You found Y of X"
- Per-flaw: how many hints were needed to find it
- If Locate didn't trigger: "Your group caught all flaws — Locate was not needed"

**Summary:**
- Total flaws in transcript: N
- Caught in Recognize: X
- Corrected in Explain: Y
- Found in Locate: Z
- Remaining unfound: N - X - Y - Z (if any)

---

## Part 4: Design Decisions and Rationale

### Why a Single Flow (Not Teacher-Selected Modes)

The previous design required the teacher to pick a mode per session (Recognize, Explain, or Locate). This had three problems:

1. **Wrong mode risk.** A teacher might keep struggling students in Recognize for weeks, or put unprepared students in Locate. The mode decision required predicting student readiness.
2. **Individual→group mismatch.** Recognize produced only labels (no reasoning), making the group phase awkward. Explain as a standalone mode asked students to write cold, without warm-up.
3. **Cross-session progression burden.** The teacher had to manually progress groups through modes across sessions, using hint data to judge readiness. Few teachers would do this consistently.

The three-stage flow eliminates all three problems. Every session runs the full gradient. The teacher's only session-level decision is which transcript to assign. The flow self-adapts: strong groups skip Locate; struggling groups get more time in Explain.

### Why Recognize is Individual and Explain is Group

Recognize is a warm-up — fast, low stakes, builds familiarity with the transcript. Individual work ensures every student reads every turn and forms their own opinions before social influence.

Explain requires articulation, which is harder. The group context provides social scaffolding: students can talk through their reasoning before writing. Seeing others' Recognize results creates natural discussion catalysts. The collaborative writing mechanic distributes the cognitive load of writing across the group.

If Explain were individual, students would face a blank text box alone — the hardest possible starting point for a 12-year-old. If Recognize were group, social loafing would undermine the warm-up (some students would coast on others' answers).

### Why Productive Failure (Not "No Flaw")

Including "No flaw" as a fifth choice in Recognize creates a pattern-matching escape hatch. Students who are unsure select "No flaw" as a safe default — it requires no commitment to a specific flaw type. This undermines the mode's purpose.

Productive failure forces genuine engagement: the student must commit to a flaw type, and the feedback reveals the turn was actually fine. This teaches through surprise — a more durable lesson than selecting a label.

"No flaw" appears in Explain (Step 1) because the context is different: the group is discussing, the social cost of opting out is higher, and the Explain turns were surfaced because *someone* got them wrong — the group needs to determine whether the turn is actually flawed or everyone was confused.

### Why Locate is Conditional

Making Locate conditional serves three purposes:

1. **Gamification.** "You missed 2 — find them" is a challenge. Students enter Locate with a goal and motivation, not an assignment.
2. **Efficiency.** Strong groups finish faster. Weak groups get more practice. The session adapts without teacher intervention.
3. **Context.** Students have already read every turn (Recognize) and discussed error turns (Explain). Searching for missed flaws in a familiar transcript is fundamentally different from cold-searching an unfamiliar one. The difficulty is appropriate because of what came before.

### Why Turn-by-Turn Analysis

The turn is the natural unit of a transcript. Each turn is one agent's contribution — a manageable chunk for middle schoolers to read and evaluate. Turn-by-turn presentation in Recognize and Explain:
- Focuses attention on one piece of content at a time (CLT: reduces extraneous load)
- Creates a clear rhythm: read → evaluate → next
- Makes non-flawed turns a natural part of the sequence (Recognize)

Locate uses the full transcript because the core skill *is* scanning and finding — constraining the view would undermine the purpose.

### Why Collaborative Writing (Not Shared-Screen or Single-Recorder)

Three options for group writing in Explain:

| Option | Problem |
|--------|---------|
| One shared iPad | Only one student writes. Others disengage. No individual accountability |
| One designated recorder | The recorder does all the cognitive work of writing. Others talk but don't commit to text |
| Everyone writes on their own iPad | Every student is accountable. The teacher sees who contributed. Multiple perspectives are captured |

The third option — everyone writes — is the right choice because it preserves individual accountability within group work. The write-then-reveal mechanic prevents copying while still enabling collaboration.

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
2. For each non-flawed turn: exclude (productive failure already handled).
3. Turns where every student was correct: skip (nothing to discuss).
4. The system does not reveal *why* a turn was included. The group sees "discuss this turn" — they don't know whether it was included because of disagreement or unanimous error.

### Locate Trigger Logic

After Explain completes, the system checks:

1. For each flaw in `activity.flawIndex[]`: did any student select the correct flaw type in Recognize, or did the group select the correct type in Explain?
2. Flaws with no correct identification from any source → Locate targets.
3. If zero Locate targets → skip to Results.
4. Maximum Locate targets: uncapped (the number of missed flaws is the number of targets). If the group missed many flaws, the full count is shown — this is accurate feedback, not punishment.

### Key Paths

```
src/app/student/session/[id]/
  page.tsx                    — Server component (fetches data, routes to stage component)

src/components/stages/
  learn-mode.tsx              — Standalone vocabulary primer (not a session stage)
  recognize-stage.tsx         — Turn-by-turn with flaw type choices + hint elimination (individual)
  explain-stage.tsx           — Turn-by-turn with two-step flow + collaborative writing (group)
  locate-stage.tsx            — Full transcript with student-targeted hints (group)
  results-view.tsx            — End-of-session results across all stages
  waiting-screen.tsx          — "Waiting for your group" (shown to fast Recognize finishers)

src/components/shared/
  hint-button.tsx             — Universal "Narrow it down" button (shared across all stages)
  flaw-field-guide.tsx        — Reference panel (Explain, Locate, Learn only)
  turn-display.tsx            — Single turn renderer (shared by Recognize and Explain)

src/components/explain/
  collaborative-editor.tsx    — Multi-student writing area with attribution
  recognize-distribution.tsx  — Shows group's Recognize results for a turn
  disagreement-prompt.tsx     — Minority voice prompt for structured disagreement

src/components/locate/
  section-tap-target.tsx      — Section interaction for student-targeted hints
  flaw-counter.tsx            — "X flaws remaining" display

src/lib/
  types.ts                    — SessionStage, HintState
  matching.ts                 — Matching engine
  hints.ts                    — Hint progression logic per stage
  false-positives.ts          — Deterministic false positive generation (seeded, shared client/server)
  turn-selection.ts           — Explain turn selection logic
  locate-trigger.ts           — Locate trigger condition logic
```

### Data Model

- `group.stage` — Current stage: `"recognize" | "explain" | "locate" | "results"`
- `group.phase` — Within-stage phase: `"individual" | "group"` (Recognize is always individual; Explain and Locate are always group)
- `HintUsage` — Tracks hint requests: `{ student_id, session_id, group_id, turn_id, flaw_id?, hint_level, stage, target_section?, timestamp }`
- `FlawResponse` — Stores Recognize answers (individual) and Explain responses (group). Explain stores `typeAnswer` (Step 1) + `reasonAnswer` (Step 2) + `authorId`. `hintLevel` records hints used
- `Explanation` — Stores collaborative writing entries: `{ turn_id, author_id, group_id, session_id, text, revision_of?, created_at }`
- `Annotation` — Stores Locate flags: `{ turn_id, group_id, student_id, hint_level, target_section? }`
- `activity.flawIndex[]` — `[{ flaw_id, locations[], flaw_type, severity }]`. Used by hint system, turn selection, and Locate trigger logic

### Design Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Hint try-first delay (Recognize) | ~18 seconds | Individual reading + consideration time |
| Hint try-first delay (Explain) | ~45 seconds | Group discussion needs more time to start |
| Hint try-first delay (Locate) | ~18 seconds | Per-interaction; group is already searching |
| False positive ratio | ~1:3-4 (non-flawed : flawed turns) | Balances discrimination practice against confidence |
| Write-then-reveal period | ~60-90 seconds | Long enough for a few sentences; short enough to maintain pace |

---

## Previous Design Superseded

- ~~Teacher-selected modes (Recognize OR Explain OR Locate)~~ → Single three-stage session flow (Recognize → Explain → Locate). Every session runs the full gradient.
- ~~4 modes (Recognize, Locate, Classify, Explain)~~ → 3 stages in sequence. Classify absorbed.
- ~~1 teacher knob per mode~~ → 0 configuration. Session structure is fixed.
- ~~Teacher mode selection decision~~ → Teacher's only decision is which transcript to assign.
- ~~Locate as standalone mode~~ → Locate is conditional, triggered by missed flaws.
- ~~Individual work in all modes~~ → Recognize is individual; Explain and Locate are group.
- ~~Blank text box start in Explain~~ → Two-step flow: select flaw type (builds on Recognize), then write justification.
- ~~Individual writing in Explain~~ → Collaborative writing with write-then-reveal + attribution.
- ~~Consensus-based group phase~~ → Structured disagreement emerging from Recognize result distribution.
- ~~Separate individual and group phases per mode~~ → Individual (Recognize) and group (Explain, Locate) are different stages, not phases within a stage.
- ~~"No flaw" option in Recognize~~ → Productive failure for non-flawed turns.
- ~~"Hint" button~~ → "Narrow it down" (strategic framing).
- ~~Flaw Field Guide in all modes~~ → Excluded from Recognize.
- ~~Cross-session mode recommendations~~ → Not needed; every session runs the full gradient.
- ~~Response time tracking~~ → Removed (poor signal-to-noise for middle schoolers).
