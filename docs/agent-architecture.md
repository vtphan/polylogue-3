# Polylogue 3: Agent Architecture

How agents are defined, and why.

---

## Design Goal

An agent in Polylogue 3 is an AI participant that exhibits critical thinking flaws in ways that support teaching critical thinking to middle school students doing PBL projects. Agents participate in two activities: **group presentations** and **group discussions**.

The agent definition should be:
- **Tight** — no unnecessary dimensions or abstractions
- **Pedagogically grounded** — every element exists because it produces identifiable, teachable flaws
- **PBL-aligned** — designed with real project contexts in mind, not abstract scenarios

## Agent Definition: Three Components

An agent is defined by three things: **context**, **knowledge profile**, and **disposition**.

```
Agent = Context + Knowledge Profile + Disposition
```

### 1. Context

Context is the situation the agent is in. It answers: *who is this agent, and what are they working on?*

Context operates at graduated levels of specificity:

| Level | Example | What it constrains |
|-------|---------|-------------------|
| **Broad** | Middle school student | Age-appropriate vocabulary, developing reasoning, partial knowledge |
| **Project type** | Middle school student working on a STEM project | PBL structure (driving question, team roles, research → prototype → presentation) |
| **Domain** | ...exploring ecosystems and environmental threats | Which knowledge areas are relevant; what misconceptions are plausible |
| **Specific** | ...designing a community awareness campaign about water pollution | The particular angle the team has chosen; what "good work" would look like |

Not every agent needs the most specific level. The architecture supports all levels — the designer chooses how far to go based on pedagogical intent.

**Why context matters:**

Context does three things at once:

*It constrains the knowledge profile.* If the context is "6th graders exploring ecosystems," the knowledge profile only needs to address ecology, community action, and data literacy — not everything the agent could possibly know. This keeps knowledge profiles manageable.

*It shapes how dispositions manifest.* A confident middle schooler sounds different from a confident adult expert. Context tells the agent generation system what "confident" looks like for this person in this situation.

*It defines what counts as a flaw.* A vague claim about ecosystems might be fine in an early brainstorming discussion but is a flaw in a final presentation. Context establishes the standard against which behavior is evaluated.

**Rationale for graduated specificity:** UMS runs two types of PBL projects — STEM and Humanities — each with different driving questions and products. A fully topic-independent agent would be too generic to produce realistic flaws. A fully topic-specific agent would be too narrow to reuse. Graduated context lets the same architectural pattern serve a 6th grade ecosystem project, a 7th grade sensory design project, or an 8th grade capstone, by adjusting the context level.

---

### 2. Knowledge Profile

The knowledge profile specifies what the agent knows and doesn't know, *relative to the context*. It is the primary driver of critical thinking flaws, especially in presentation mode.

Four categories of knowledge:

| Category | What it means | Example (ecosystem context) |
|----------|--------------|----------------------------|
| **Strong understanding** | Knows the material well; can reason correctly about it | Understands how invasive species disrupt food webs |
| **Shallow understanding** | Knows vocabulary and surface facts; can't explain mechanisms or handle follow-up questions | Can name types of pollution but can't explain how runoff enters waterways |
| **Misconception** | Holds a specific wrong belief and treats it as true | Believes recycling alone can reverse habitat loss |
| **Blind spot** | Doesn't know this area exists as relevant; wouldn't think to address it | Hasn't considered economic costs of proposed solutions |

**How knowledge profiles produce flaws:**

Each knowledge category maps naturally to flaw types:

| Knowledge category | Likely flaw types |
|---|---|
| Shallow understanding | Overstating evidence, vague claims presented as substance, inability to connect evidence to conclusions |
| Misconception | Wrong claims stated as fact, flawed reasoning built on false premises, misleading evidence |
| Blind spot | Missing components, incomplete stakeholder analysis, proposals without feasibility consideration, unaddressed tradeoffs |

This is the primary flaw-generation mechanism in Polylogue 3. In presentation mode, knowledge-driven flaws account for most of what students will identify. In discussion mode, they interact with disposition-driven dynamics (see below).

**Design principle — backward from target flaws:** Knowledge profiles are designed *backward* from the flaws we want students to practice identifying. If the pedagogical goal is for students to catch "proposal without feasibility analysis," we create an agent whose blind spot is implementation logistics. The flaw isn't scripted — it emerges naturally because the agent genuinely doesn't have that knowledge — but the conditions are intentionally created.

**Scope and granularity:** A knowledge profile should be short — perhaps 4-8 items total across the four categories. It only needs to cover the knowledge areas that are relevant to the context and that will produce the target flaws. Unspecified areas default to "age-appropriate general knowledge" — the agent knows roughly what a typical middle schooler would know.

---

### 3. Disposition

Disposition describes how the agent communicates — their style, tendencies, and reactive patterns. It is *not* the primary source of flaws in Polylogue 3 (that's the knowledge profile), but it shapes **how flaws are expressed** and, in discussion mode, **how agents behave under pressure**.

**Simplified from Polylogue 2.** Polylogue 2 defined 12 disposition dimensions and 18 sensitivities. That level of detail was necessary because dispositions were the *only* flaw-generation mechanism — everything had to come from disposition-interaction dynamics. In Polylogue 3, knowledge profiles carry the primary flaw-generation load, so dispositions can be simpler.

Three disposition dimensions:

| Dimension | Low end | High end | What it affects |
|-----------|---------|----------|----------------|
| **Confidence** | Hedging, tentative, qualifies claims | Assertive, definitive, states things as certain | How knowledge gaps are *expressed* — confidently or cautiously |
| **Engagement style** | Collaborative, builds on others' ideas, defers | Competitive, challenges, defends position | How the agent *interacts* in discussions — especially under disagreement |
| **Expressiveness** | Data-focused, analytical, restrained | Story-driven, emotional, emphatic | What kind of *evidence and framing* the agent gravitates toward |

**Why three dimensions are enough:**

These three dimensions accomplish what dispositions need to do in Polylogue 3:

*Make agents sound distinct.* Four agents with different confidence/engagement/expressiveness profiles will sound like four different people presenting or discussing, even if they have similar knowledge.

*Determine how knowledge gaps manifest.* The same misconception sounds very different from a high-confidence agent ("This is definitely how it works") vs. a low-confidence agent ("I think maybe this is how it works?"). Students learn that flaw detection depends on presentation — a hedged misconception is harder to catch than a confident one.

*Drive interaction-driven flaws in discussion mode.* A high-confidence, competitive agent who gets challenged will double down. A low-confidence, collaborative agent who gets challenged will concede too quickly, even if they were right. These patterns produce the interaction-driven flaws that distinguish discussion from presentation.

**Reactive tendency:** Rather than 18 separate sensitivities with individual trigger mappings, each agent has a brief description of how they respond when challenged or when the discussion gets tense. This is a qualitative description, not a dimensional score. For example: "When challenged, tends to get louder and more absolute rather than engaging with the criticism" or "When disagreed with, shifts to personal stories rather than addressing the argument directly."

**Rationale for simplification:** The 12-dimension system in Polylogue 2 risks becoming a distraction for scenario designers. A teacher creating a scenario about ecosystems should be thinking about what knowledge gaps will produce what flaws — not whether `precision_orientation` should be 0.3 or 0.7. Three dimensions plus a qualitative reactive tendency captures what matters for producing diverse, recognizable agent behavior without requiring expertise in a complex dimensional space.

---

## How the Three Components Work Together

A concrete example, using the 6th grade STEM context:

**Context:** Middle school students working on a STEM project about environmental threats to local ecosystems. The team is creating a presentation and escape room to raise community awareness about water pollution.

**Agent: Kenji (the enthusiastic researcher)**
- *Disposition:* High confidence, collaborative engagement, high expressiveness
- *Knowledge:*
  - Strong understanding: types of water pollutants and their sources
  - Shallow understanding: how pollutants move through watersheds (knows the terms but not the process)
  - Misconception: believes that if you clean up one section of a river, downstream sections automatically improve
  - Blind spot: hasn't considered that different communities along the waterway are affected differently

**What this produces in a presentation:** Kenji confidently presents research on pollutant types (solid), then explains watershed dynamics with surface-level correctness that doesn't hold up under scrutiny (shallow understanding expressed confidently → epistemic flaw). He proposes a river cleanup as the solution without considering downstream communities (blind spot → completeness flaw). His enthusiasm makes the presentation engaging but also makes the flaws harder to catch — things *sound* right.

**What this produces in a discussion:** Same knowledge-driven flaws, plus — when another agent questions the river cleanup idea, Kenji's collaborative nature means he tries to incorporate their concern rather than defend his position, but his shallow understanding of watersheds means he can't actually integrate the feedback coherently (interaction-driven flaw: superficial accommodation that doesn't resolve the underlying problem).

---

## Relationship to Polylogue 2

| Aspect | Polylogue 2 | Polylogue 3 | Rationale |
|--------|-------------|-------------|-----------|
| Primary flaw source | Disposition-interaction dynamics | Knowledge profiles | Broader flaw types (not just fallacies); works for presentations, not just discussions |
| Disposition dimensions | 12 | 3 | Knowledge profiles carry the flaw-generation load; dispositions shape expression and interaction |
| Sensitivities | 18 with trigger mappings | Qualitative reactive tendency | Simpler to author; sufficient for discussion dynamics |
| Topic/context | External to agent definition | Part of agent definition | Enables topic-first design; constrains knowledge profiles to manageable scope |
| Agent reusability | Fully topic-independent | Reusable within a context level | Realistic tradeoff between generality and flaw specificity |

**What carries over from Polylogue 2:** The core principle that flaws *emerge* from agent characteristics rather than being scripted. The insight that the same behavior can be appropriate or problematic depending on context. The perspectival evaluation model (different evaluators judge differently). The sparse representation philosophy (agents defined by what makes them distinctive, not exhaustive specification).

**What changes:** The flaw-generation mechanism shifts from disposition-only to knowledge-primary. The disposition system simplifies. Context becomes part of the agent definition. The design workflow inverts from agent-first to topic-first.

---

## Open Questions

1. **Is three disposition dimensions the right number?** Could be two (confidence + engagement style, with expressiveness folded into the qualitative description). Could be four (adding something about how the agent handles uncertainty — do they acknowledge gaps or paper over them?). Need to test with concrete scenarios.

2. **How are knowledge profiles authored?** By a teacher using a template? By an AI system given a context and target flaws? Both? The authoring workflow matters for adoption.

3. **How do team roles interact with agent definitions?** In presentation mode, agents have roles (researcher, designer, presenter). Is the role part of the agent definition, part of the context, or assigned separately at the scenario level?

4. **Should the reactive tendency be more structured?** A qualitative description is flexible but might produce inconsistent behavior across runs. A small set of reactive patterns (escalate, deflect, accommodate, redirect) might be more reliable while still being simple.

5. **How does this connect to evaluation?** The evaluation layer needs to know about the flaw taxonomy (reasoning, epistemic, completeness, coherence flaws) but probably doesn't need to know about agent internals. The evaluator sees the output, not the profile. But should the evaluation framework be aware of the discourse mode (presentation vs. discussion) to adjust what it looks for?
