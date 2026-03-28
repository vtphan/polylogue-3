# Flaw Type Glossary

Definitions and examples for the four critical thinking flaw types. Referenced by scenario-generator, evaluator, and all agents that need consistent flaw classification.

---

## Reasoning Flaws

**What it is:** Problems in the logic of an argument — the structure of how claims connect to evidence and to each other.

**Subtypes:**

| Subtype | Description | PBL Example |
|---------|------------|-------------|
| Fallacy | Classical logical fallacy (ad hominem, straw man, appeal to authority, etc.) | "Dr. Smith said this is the best approach, so it must be right" |
| Missing premise | Unexplained jump from evidence to conclusion | "Pollution levels are high, so we should build a filtration system" (why filtration specifically?) |
| Overgeneralization | Drawing broad conclusions from narrow evidence | "Our river study shows pollution is decreasing everywhere" |
| False equivalence | Treating unequal things as equal | "Both sides of the recycling debate have good points" (when evidence strongly favors one side) |
| Circular reasoning | Conclusion restates the premise | "Our solution works because it's effective" |

**Causal misconceptions in discussions.** A particularly productive subtype is the causal misconception — an incorrect belief about a cause-effect relationship (e.g., "waste heat from cars causes urban heat islands" when the real driver is surface absorption). Causal misconceptions generate reasoning flaws when defended in discussion, because the agent must construct arguments with faulty premises. When challenged, agents with causal misconceptions tend to escalate — producing circular reasoning, missing-premise dismissals, and unfalsifiable reframings. By contrast, factual misconceptions (e.g., "blue light is calming") tend to produce epistemic flaws (assumption-as-fact) because the agent simply states the wrong thing confidently. For discussions, at least one agent should hold a causal misconception to ensure reasoning flaws emerge from debate.

**Primary source:** Both knowledge-driven (misconceptions lead to flawed reasoning) and interaction-driven (pressure leads to fallacious arguments).

---

## Epistemic Flaws

**What it is:** Problems in how knowledge and evidence are handled — the relationship between what is claimed and what is actually known or supported.

**Subtypes:**

| Subtype | Description | PBL Example |
|---------|------------|-------------|
| Overstating evidence | Claiming more than the evidence supports | "Our survey proves that the community wants a cleanup" (survey of 10 people) |
| Assumption as fact | Treating an assumption as an established fact | "Everyone knows that recycling reduces pollution" (stated without evidence) |
| Unacknowledged uncertainty | Failing to note what is uncertain or unknown | Presenting preliminary findings as definitive conclusions |
| Selective evidence | Presenting only evidence that supports the claim | Citing studies that support the proposal while ignoring contradictory findings |
| Correlation as causation | Treating correlation as proof of causal relationship | "Pollution went down after the cleanup campaign, so the campaign caused the reduction" |

**Primary source:** Knowledge-driven. Agents with shallow understanding or misconceptions produce epistemic flaws naturally — they don't know enough to recognize the gap between what they claim and what the evidence supports.

---

## Completeness Flaws

**What it is:** Problems of omission — important things that are missing from the analysis, proposal, or argument.

**Subtypes:**

| Subtype | Description | PBL Example |
|---------|------------|-------------|
| Missing stakeholders | Not considering who is affected by or involved in the issue | Proposing a river cleanup without consulting downstream communities |
| No feasibility analysis | Proposing solutions without considering whether they can be implemented | "Install filters on every drain" (cost? who does the work? maintenance?) |
| Unaddressed tradeoffs | Not acknowledging what is lost or risked by the proposed approach | Proposing a solution without noting its downsides |
| Missing counterexamples | Not considering cases that challenge the claim | "Green spaces always improve community health" (without considering exceptions) |
| Ignored constraints | Not accounting for resource, time, regulatory, or practical limitations | Designing a prototype without considering available materials or budget |

**Primary source:** Knowledge-driven. Agents with blind spots produce completeness flaws — they don't mention what they don't know is relevant.

---

## Coherence Flaws

**What it is:** Problems in how parts of an argument, presentation, or discussion fit together — internal consistency and logical flow.

**Subtypes:**

| Subtype | Description | PBL Example |
|---------|------------|-------------|
| Evidence-claim disconnect | Evidence presented doesn't actually support the stated claims | Research section discusses water chemistry; solution section proposes a social media campaign |
| Internal contradiction | Different parts of the work contradict each other | Introduction says the problem is local; conclusion claims global impact |
| Goal-method mismatch | Stated goals don't align with proposed methods | Goal is community awareness; method is building a filtration prototype |
| Conclusion overreach | Conclusions go beyond what the body of work supports | A study of one river concluding "we can solve water pollution in Memphis" |
| Team inconsistency | Different team members present conflicting information (presentations) | Researcher says data is preliminary; designer presents it as confirmed |

**Primary source:** In presentations, coherence flaws are knowledge-driven (different agents have different knowledge, producing inconsistencies). In discussions, they can also be interaction-driven (superficial agreement that doesn't resolve real disagreements).

**Connector pattern (presentations):** Coherence flaws are the hardest flaw type to produce reliably in presentations because they depend on relationships between sections, not on any single agent's knowledge gaps. The most reliable mechanism is a connector or synthesizer agent — one who covers cross-cutting sections (Approach, Conclusion) and whose knowledge gaps include weak synthesis or shallow comparative analysis. When this agent tries to tie together other agents' contributions without fully understanding them, coherence flaws emerge naturally: conclusions that don't follow from findings, superficial summaries that paper over contradictions, and evidence-claim disconnects between sections. See the scenario-generator's Connector Pattern guidance for design details.

---

## Flaw Source Classification

Every identified flaw should be classified by source:

| Source | Definition | When it occurs |
|--------|-----------|---------------|
| **Knowledge-driven** | Flaw arises from the agent's knowledge profile (misconception, shallow understanding, or blind spot) | Both presentations and discussions |
| **Interaction-driven** | Flaw arises from how agents respond to each other during live exchange | Discussions only |

A flaw may have elements of both. When classifying, use the primary source — what mainly caused this flaw to appear?

---

## Interaction-Driven Flaw Patterns

These patterns occur only in discussions, when the dynamics of the exchange produce or amplify flaws. Each pattern maps to one or more parent flaw types.

| Pattern | What happens | Parent flaw type(s) | PBL Example |
|---------|-------------|---------------------|-------------|
| **Escalation** | Agent is challenged and responds by doubling down — becoming more absolute rather than engaging with the criticism | Reasoning (overgeneralization, fallacy), Epistemic (overstating evidence) | When questioned about the cleanup's effectiveness, agent insists "it definitely works" and dismisses the challenge rather than addressing it |
| **Deflection** | Agent is challenged and changes the subject or appeals to something irrelevant rather than addressing the argument | Reasoning (fallacy — red herring, appeal to authority) | When asked for evidence, agent responds "well, our teacher said this was a good approach" |
| **Conformity** | Agent abandons a valid point because the group isn't receptive — social pressure overrides reasoning | Completeness (lost perspective, unaddressed tradeoff) | Agent raises a legitimate concern about cost, but drops it when other agents push back, leaving feasibility unexamined |
| **Superficial consensus** | Agents agree without resolving underlying disagreements — surface harmony masks real conflicts | Coherence (internal contradiction), Completeness (unaddressed tradeoffs) | Group agrees on a solution without noticing that two members have contradictory understandings of why it works |
| **Abandonment** | Agent gives up a line of reasoning prematurely — not because it was refuted, but because the discussion moved on or pressure mounted | Completeness (missing analysis), Coherence (conclusion overreach) | Agent starts to question the data quality but drops the point after being talked over, leading the group to conclusions the data doesn't support |

These patterns are identified by the evaluator through cross-turn analysis — they span multiple turns and are visible only when tracking how positions shift (or fail to shift) across the arc of the discussion.

---

## Grade Band Considerations

Flaw types don't map to difficulty levels — every type has easy and hard instances. What changes by grade is the **concreteness** of flaws and the **working memory** required to detect them.

| Grade | What flaws look like | What students can reasonably catch |
|-------|---------------------|-----------------------------------|
| **6th** | Concrete and observable. Misconceptions are about visible things ("plastic gets in the river because people litter"). Overgeneralizations are from small, obvious samples. Missing elements are things students can name from everyday experience (cost, who does the work). | Single-section/single-turn flaws. "They only tested 8 people." "They never said how much it costs." "They said it was proven but didn't show proof." |
| **7th** | More systemic. Misconceptions involve processes or mechanisms ("blue light calms you down," "waste heat causes urban heat islands"). Flaws require understanding how evidence connects to claims. Coherence flaws between sections become accessible. | Flaws that require comparing two pieces of information. "The introduction said it was debated but the conclusion said it was settled." "They used an anecdote as proof." |
| **8th** | Abstract and methodological. Misconceptions are about reasoning itself ("our survey is representative because we got 30 responses"). Flaws involve evaluating the quality of evidence, not just its presence. Cross-section and cross-turn patterns are primary targets. | Flaws that require evaluating reasoning quality. "Their argument is circular." "They're treating correlation as causation." "The group agreed but never actually resolved the disagreement." |

**For scenario design:** `grade_band` should shape the knowledge gaps in agent profiles. The flaw types can be any of the four — what changes is how concrete or abstract the underlying misconception or gap is. A 6th grader's completeness flaw is "they forgot to mention the cost"; an 8th grader's is "they didn't consider whether their sample was representative."

**For evaluation:** The evaluator should calibrate severity to grade band. A flaw that would be minor for 8th graders (subtle methodological issue) might not even be flagged for 6th graders because it's beyond what students at that level should be expected to catch.
