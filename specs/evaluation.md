# Evaluation Layer

How generated discourse is assessed for critical thinking flaws.

---

## Design Goal

Evaluation identifies critical thinking flaws in presentations and discussions. One perspective: **critical thinking**. One taxonomy: **four flaw types** (reasoning, epistemic, completeness, coherence). The evaluation layer is deliberately thin — it avoids the multi-perspective complexity of Polylogue 2.

**Why not multiple perspectives?** Polylogue 2 used five evaluation perspectives (logical, epistemic, dialogical, relational, developmental) to model how the same utterance is judged differently by different evaluators. That's a valuable insight about perspectival evaluation, but it adds complexity that doesn't serve Polylogue 3's purpose. Here, the goal is to teach students to identify critical thinking flaws in PBL work. One clear lens, applied consistently.

---

## What Gets Evaluated

| Activity | Unit of evaluation | What to look for |
|----------|-------------------|-----------------|
| **Presentation** | Each section, plus the presentation as a whole | Knowledge-driven flaws: gaps, overstatements, missing components, incoherence between sections |
| **Discussion** | Each turn, plus the discussion as a whole | Knowledge-driven flaws (same as above) + interaction-driven flaws: escalation, deflection, conformity, superficial agreement |

### Section-Level vs. Whole-Presentation Evaluation

Individual sections may contain flaws that are visible in isolation (e.g., overstated evidence in the Findings section). But some flaws only appear when you look at the whole: the Introduction frames a problem the Solution doesn't address; the Findings don't connect to the Approach; different speakers contradict each other. These are **coherence flaws** — they require evaluating across sections.

### Turn-Level vs. Whole-Discussion Evaluation

Individual turns may contain identifiable flaws. But interaction-driven flaws often span multiple turns: an agent abandons a valid point after social pressure (visible only across 3-4 turns), or the group reaches superficial consensus without resolving underlying disagreement (visible only in the arc of the discussion).

---

## Flaw Types

Four types, defined in detail in the [Flaw Type Glossary](../configs/reference/flaw_type_glossary.md).

| Flaw type | What it is | Primary source |
|-----------|-----------|---------------|
| **Reasoning** | Problems in the logic of an argument: fallacies, missing premises, false equivalence, overgeneralization | Both knowledge-driven and interaction-driven |
| **Epistemic** | Problems in how knowledge is handled: overstating evidence, treating assumptions as facts, selective evidence, conflating correlation with causation | Primarily knowledge-driven |
| **Completeness** | Problems of omission: missing stakeholders, no feasibility analysis, unaddressed tradeoffs, no counterexamples considered | Primarily knowledge-driven (blind spots) |
| **Coherence** | Problems in how parts fit together: evidence doesn't support claims, sections contradict, goals don't match methods | Knowledge-driven (presentation) or interaction-driven (discussion) |

---

## Evaluation Output Schema

### Per-Flaw Assessment

```yaml
flaw_id: string                        # Sequential (flaw_001, flaw_002, ...)
location:
  type: section | turn | cross_section | cross_turn
  references:                          # Which section(s) or turn(s)
    - string                           # section name or turn_id
flaw_type: reasoning | epistemic | completeness | coherence
source: knowledge_driven | interaction_driven
severity: minor | moderate | major
description: string                    # What the flaw is, in plain language
evidence: string                       # Quote or reference from the transcript
explanation: string                    # Why this is a flaw and how it arose
```

### Whole-Transcript Summary

```yaml
scenario_id: string
activity: presentation | discussion
evaluated_at: ISO 8601

flaws:                                 # List of per-flaw assessments
  - flaw_id: flaw_001
    ...

summary:
  total_flaws: integer
  by_type:
    reasoning: integer
    epistemic: integer
    completeness: integer
    coherence: integer
  by_source:
    knowledge_driven: integer
    interaction_driven: integer
  by_severity:
    minor: integer
    moderate: integer
    major: integer
  key_patterns: string                 # 2-3 sentences: what are the main critical thinking weaknesses?
```

---

## Evaluation Process

### Presentation Evaluation

```
Input: registry/{scenario_id}/presentation.yaml
Process:
  1. Evaluate each section individually → identify section-level flaws
  2. Evaluate across sections → identify coherence flaws
  3. Produce summary
Output: registry/{scenario_id}/presentation_evaluation.yaml
```

The evaluator receives the full presentation transcript (content + metadata). Metadata includes which knowledge areas each agent engaged — this helps trace flaws back to knowledge profile items, but the evaluator's job is to assess the *output*, not the profile.

### Discussion Evaluation

```
Input: registry/{scenario_id}/discussion.yaml
Process:
  1. Evaluate each turn individually → identify turn-level flaws
  2. Evaluate across turns → identify interaction-driven flaws and patterns
  3. Produce summary
Output: registry/{scenario_id}/discussion_evaluation.yaml
```

For discussions, the evaluator also receives turn metadata (knowledge areas engaged, reactive tendency activated). This helps identify whether a flaw is knowledge-driven or interaction-driven.

---

## Severity

| Level | Meaning | Example |
|-------|---------|---------|
| **Minor** | Imprecise or slightly overstated, but doesn't undermine the argument | "Pollution is a big problem" (vague but not wrong) |
| **Moderate** | Weakens the argument or leaves a meaningful gap | Evidence doesn't fully support the claim; an important consideration is missing |
| **Major** | Fundamentally undermines the argument or project | Solution is based on a misconception; entire stakeholder group ignored; evidence contradicts the conclusion |

---

## Evaluator Subagent

A single evaluator subagent, focused on critical thinking. It receives:
- The transcript (presentation or discussion)
- The flaw type glossary (for consistent classification)
- The activity type (to calibrate — presentations emphasize knowledge-driven flaws; discussions also look for interaction-driven flaws)

It produces the evaluation output above.

**No evaluator profiles needed.** Unlike Polylogue 2's four evaluator characters (Logician, Mentor, Facilitator, Domain Expert), Polylogue 3 uses a single evaluator focused on critical thinking flaw identification. This can be extended later if multiple perspectives prove valuable.

---

## Connecting Evaluation to Pedagogy

The evaluation output serves two purposes:

**For the teacher:** Provides a reference assessment that the teacher can compare against student evaluations. If students missed a major coherence flaw, the teacher can use the AI evaluation to guide discussion about what to look for.

**For research:** Tracks flaw distributions across scenarios, enabling analysis of which agent configurations produce which flaw types, and whether certain flaws are harder for students to identify.

The evaluation is NOT shown to students directly — it's a teacher/researcher tool. Students do their own evaluation first (identifying flaws, formulating Q&A questions), and the AI evaluation serves as a reference afterward.

---

## Enums

- `flaw_type`: reasoning, epistemic, completeness, coherence
- `source`: knowledge_driven, interaction_driven
- `severity`: minor, moderate, major
- `location.type`: section, turn, cross_section, cross_turn
- `activity`: presentation, discussion
