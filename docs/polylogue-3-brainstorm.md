# Polylogue 3: Brainstorm

Working notes toward a coherent architecture. This document captures ideas and directions — not final decisions.

**Polylogue 2** is in `../Polylogue-2/`

---

## What Polylogue 2 Does Well

Polylogue 2 models how **interaction** produces critical thinking flaws. Agents have stable dispositions; sensitivities trigger disposition shifts during conversation; fallacies emerge from those shifts rather than being scripted. Evaluation is perspectival — the same utterance is judged differently by different evaluators. This models real-world evaluation faithfully.

## What Polylogue 3 Should Address

Four gaps motivate the transition:

**1. Only one discourse mode.** Polylogue 2 generates multi-party conversations. But PBL at University Middle also involves group presentations — a structurally different speech event. Students need to evaluate both.

**2. Flaw taxonomy is too narrow.** Polylogue 2's flaws are essentially fallacies (ad hominem, hasty generalization, appeal to authority, etc.). Real student work shows a broader range of critical thinking problems: gaps in reasoning chains, missing components in a project plan, overstated assumptions treated as facts, incomplete stakeholder analysis, proposals without feasibility consideration. These aren't fallacies — they're failures of thorough thinking.

**3. No model of what agents know.** Polylogue 2 models *how* agents think (dispositions) but not *what* they know. In practice, many critical thinking flaws come from knowledge gaps: shallow understanding confidently presented, misconceptions treated as facts, blind spots that leave entire dimensions of a problem unaddressed.

**4. Topic comes too late.** Polylogue 2's workflow is: design agents → pick a topic → generate conversation. This makes it hard to ensure that pedagogically relevant flaws surface for a given PBL topic. The topic should drive agent design, not the other way around.

---

## Core Insight: Two Sources of Flaws

Critical thinking flaws have two distinct origins:

**Knowledge-driven flaws** arise from what agents know or don't know — misconceptions, shallow understanding, blind spots, gaps in domain knowledge. These flaws exist *before* any interaction. They're embedded in how an agent understands (or fails to understand) the topic.

**Interaction-driven flaws** arise from how agents respond to each other during live exchange — doubling down when challenged, attacking the person instead of the argument, appealing to emotion under pressure, abandoning valid points due to social dynamics. These flaws don't exist in any single agent's head; they emerge from the interaction.

**The key observation:** In a group presentation, flaws are predominantly knowledge-driven. The team has prepared; what you see is the product of their thinking. Gaps, overstatements, and missing components reflect what they knew (or didn't) during preparation. Dispositions affect *how* flaws are expressed (confidently, vaguely, etc.) but don't generate the flaws themselves.

In a group discussion, both sources are active. Agents still have knowledge gaps, but on top of that, the dynamic interaction produces additional flaws through the disposition-sensitivity-trigger mechanism from Polylogue 2.

This distinction has direct pedagogical implications:

- **Presentation evaluation is cognitively simpler.** Flaws are static — embedded in the content, available for careful analysis. Students can pause, reread, and think.
- **Discussion evaluation is cognitively harder.** Flaws are both static (knowledge-driven) and dynamic (interaction-driven). Students must track what's being said *and* why it's being said in response to what provocation.

This suggests a **scaffolded progression**: presentations first (identify knowledge-driven flaws), then discussions (add interaction-driven flaws to the picture).

---

## Two Discourse Modes

### Presentation Mode

A team of agents delivers a prepared presentation on a PBL topic. The presentation has a planned arc — unlike a discussion, it's not reactive or negotiated.

Flaw generation is primarily driven by **agent knowledge profiles**: what each agent knows well, knows shallowly, misconceives, or is blind to. Dispositions shape expression (e.g., how confidently a misconception is stated) but the flaw itself comes from the knowledge gap.

Possible phases: framing, claim-building, evidence/demonstration, limitations, closing. (These need further thought — see open questions.)

Team roles could differentiate agents within the presentation: lead presenter, evidence handler, Q&A responder, etc. This mirrors real PBL group dynamics and enables a type of flaw that's unique to team presentations — **coordination gaps**, where different team members' contributions don't cohere.

### Discussion Mode

Multiple agents discuss a topic. This is essentially Polylogue 2's mode, enriched with knowledge profiles.

Flaw generation is driven by **both** knowledge profiles and **disposition-sensitivity-trigger dynamics**. An agent might state a misconception (knowledge-driven), then double down on it when challenged (interaction-driven), producing a cascade of flaws.

Phases can follow Polylogue 2's model (opening, exploratory, deepening, assertive, tension, synthesis, closing) or be reconsidered.

### Q&A as a Bridge

After a presentation, a Q&A session creates a hybrid zone. The presentation content has knowledge-driven flaws; probing questions can reveal interaction-driven flaws as presenters respond under pressure. This could serve as a pedagogical bridge — students have already identified static flaws, and now see how those same knowledge gaps produce dynamic flaws when challenged.

Whether to build Q&A as a formal third mode or treat it as a variant of discussion mode is an open question.

---

## Knowledge Profiles

A new layer in agent definition, parallel to dispositions. For a given topic, a knowledge profile specifies:

- **Strong understanding**: areas the agent knows well and can reason about correctly
- **Shallow understanding**: knows the vocabulary but not the mechanics; can sound right without being right
- **Misconceptions**: actively wrong beliefs the agent treats as true
- **Blind spots**: areas the agent doesn't know about and doesn't know they don't know about

Knowledge profiles are **topic-specific** — the same agent disposition (e.g., high certainty, low precision) produces different flaws depending on what they know about the specific topic.

### How Knowledge Profiles Interact with Dispositions

An agent's dispositions determine how their knowledge gaps *manifest*:

| Knowledge gap | + High certainty | + High hedging |
|---|---|---|
| Shallow understanding | States half-truths confidently | Vaguely gestures at ideas without committing |
| Misconception | Asserts wrong claims as fact | Tentatively introduces wrong ideas |
| Blind spot | Doesn't mention it (with confidence in completeness) | Doesn't mention it (without claiming completeness) |

The same knowledge gap produces different observable behaviors depending on disposition. This preserves the Polylogue 2 principle that behavior is not prescribed — it emerges from the combination of agent characteristics and context.

---

## Broader Flaw Taxonomy

Polylogue 2's flaws are classical fallacies. Polylogue 3 needs a broader taxonomy. Working categories (not final):

**Reasoning flaws** — problems in the logic of an argument
- Classical fallacies (ad hominem, hasty generalization, etc.)
- Missing premises — unexplained jumps from evidence to conclusion
- Circular reasoning
- False equivalence

**Epistemic flaws** — problems in how knowledge is handled
- Overstating evidence (claiming more than the evidence supports)
- Treating assumptions as established facts
- Failing to acknowledge uncertainty
- Selective evidence (presenting only what supports the claim)
- Conflating correlation with causation

**Completeness flaws** — problems of omission
- Missing stakeholder analysis
- No consideration of counterexamples or alternative explanations
- Proposal without feasibility analysis
- No discussion of tradeoffs
- Ignoring resource constraints

**Coherence flaws** — problems in how parts fit together (especially relevant for team presentations)
- Evidence doesn't actually support the stated claims
- Different sections contradict each other
- Stated goals don't match proposed methods
- Conclusions don't follow from the body of work

This taxonomy needs refinement. The categories should be grounded in what middle school students actually encounter in PBL contexts.

---

## Topic-First Design

Polylogue 2: design agents → pick topic → generate discourse.
Polylogue 3: pick topic → identify target flaws → design agents to produce those flaws.

A **scenario** defines:
- The PBL topic
- The discourse mode (presentation, discussion, or both)
- Target flaws that are pedagogically relevant for this topic
- Constraints on agent composition (how many agents, what knowledge/disposition combinations would naturally produce the target flaws)

Agent knowledge profiles are then designed *backward* from the target flaws: if you want students to identify "proposal without feasibility analysis," you create an agent whose blind spot is implementation logistics.

This is more intentional than Polylogue 2 without being scripted — you're creating conditions for flaws to emerge, not dictating when they appear.

---

## Grounding in UMS PBL Practice

(Based on PBL documents from University Middle School — see `../Polylogue-2/PBL/`)

### How PBL Works at UMS

UMS projects follow a three-phase arc:

1. **Project Launch** — Entry event (a hands-on challenge), driving question introduced, teams formed, roles assigned, students generate "need to know" questions.
2. **Build Knowledge & Develop/Critique** (~11 weeks) — Research, prototyping, peer-to-peer constructive feedback, revision cycles, expert visits. This is the longest phase and where most learning happens.
3. **Present Products** (STRIPES Showcase) — Group presentation of final products to an authentic public audience, audience feedback collected, student self-reflection.

Students work in collaborative groups with assigned roles (e.g., "prototype design engineer," "operations engineer," "product design engineer" in the 6th grade STEM project).

### Driving Questions (Current)

- **6th STEM**: "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?"
- **7th STEM**: "How do our senses influence our actions and decisions, both now and in the future?"
- **8th Capstone**: Self-directed, yearlong projects in clusters (STEM, Arts/Humanities, Community Issues, Sports/Health Sciences).

### What This Means for Polylogue 3

**Polylogue 3 should mirror the PBL arc.** The Develop/Critique phase is where students practice evaluating each other's work-in-progress. Polylogue 3 could serve this phase directly: AI teams present or discuss topics similar to students' own projects, and students practice critique on the AI output before critiquing peers. Lower stakes, same skills.

**Team roles are already part of PBL.** We don't need to invent the idea of differentiated roles in presentations — UMS students already have them. Polylogue 3 agents in presentation mode should have roles that mirror real PBL team structures.

**Driving questions are multi-dimensional.** Answering "What are the major threats to our global environment?" well requires scientific knowledge, community context, feasibility thinking, and communication. This is exactly the kind of question where knowledge gaps in different areas produce different types of critical thinking flaws. A team that knows the science but has a blind spot on community implementation will produce completeness flaws. A team that overstates a single study's findings will produce epistemic flaws.

**Products are diverse** — digital presentations, prototypes, escape rooms, websites, public service announcements. Polylogue 3's presentation mode should be flexible enough to represent different product types, not just slide presentations.

**The peer critique cycle is central.** UMS projects include structured peer feedback (gallery walks, constructive feedback sessions, revision). Polylogue 3's evaluation framework should model the kind of feedback students are being taught to give — not just "identify the fallacy" but "what's missing?" "does the evidence support the claim?" "is this feasible?"

### Scenario Design Aligned to PBL Topics

The topic-first design approach becomes concrete here. A Polylogue 3 scenario could be:

> **Topic**: Environmental threats to local ecosystems (aligned to 6th STEM driving question)
> **Mode**: Group presentation
> **Team**: 4 agents with roles (researcher, solution designer, community liaison, presenter)
> **Target flaws**: Overstating a single study (epistemic), proposing solutions without feasibility analysis (completeness), evidence that doesn't connect to the proposed solution (coherence)
> **Knowledge design**: Researcher knows the science but has a blind spot on community context. Solution designer has shallow understanding of the science but knows implementation. Community liaison has misconceptions about what local organizations can do. Presenter knows a bit of everything but nothing deeply.

This produces a presentation with realistic, identifiable flaws that are directly relevant to what 6th graders will encounter in their own project work.

---

## Open Questions

1. **How much of Polylogue 2's disposition system carries over?** The 12 dimensions and 18 sensitivities are well-designed. Knowledge profiles are additive — they don't replace dispositions. But should the disposition set be adjusted for the new flaw taxonomy? Some dispositions map cleanly to reasoning flaws but not to completeness flaws.

2. **How are presentation phases defined?** Discussion phases in Polylogue 2 are well-motivated. Presentation phases need similar care — they affect what behaviors are appropriate/inappropriate at each stage.

3. **Should agents have persistent identity across modes?** Can the same agent (with the same dispositions and knowledge profile) appear in both a presentation and a follow-up discussion? This would let students see how the same underlying characteristics manifest differently in different discourse contexts.

4. **How does evaluation change?** Polylogue 2 has 5 perspectives with 15 criteria. The broader flaw taxonomy likely needs additional perspectives (pragmatic? completeness-oriented?) and revised criteria. But we should avoid an explosion of evaluator complexity.

5. **How to handle the scenario design layer without over-engineering?** The scenario concept is pedagogically important but could become a complex meta-layer. It might be sufficient to treat scenarios as documented recipes (a markdown template) rather than a formal specification with its own commands and validation.

6. **What's the right scope for knowledge profiles?** Too detailed and they become unwieldy to author. Too sparse and they don't produce differentiated behavior. Need to find the right level of granularity.

7. **Interactive evaluation (students ask questions)?** Valuable pedagogically but adds significant architectural complexity. Defer to a later phase?

---

## Next Steps

- Refine the flaw taxonomy with concrete examples from PBL contexts
- Design the knowledge profile structure (what fields, what granularity)
- Sketch presentation mode phases
- Decide what carries over unchanged from Polylogue 2
- Think through a concrete scenario end-to-end (pick a PBL topic and walk through the full workflow)
