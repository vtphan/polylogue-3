---
description: Evaluate a discussion transcript for critical thinking flaws
argument-hint: <scenario_id>
---

# Evaluate Discussion

Evaluate a generated discussion for critical thinking flaws. Examines individual turns for turn-level flaws, then evaluates across turns for interaction-driven flaws and patterns.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario whose discussion to evaluate |

---

## Execution

### Step 1: Load Transcript

Read `registry/{scenario_id}/discussion.yaml`.

If the file doesn't exist or has no turns, report an error and exit.

### Step 2: Load Expected Flaws (Optional)

If expected flaws are available for comparison:
- `configs/profiles/{scenario_id}/*.yaml` — load expected flaws from all agent profiles

### Step 3: Evaluate

Delegate to the **evaluator** subagent.

Provide the subagent with:
- The full discussion transcript (content + metadata, including reactive_tendency_activated)
- Activity type: `discussion`

The evaluator reads the reference glossaries and evaluation schema from `configs/` directly (see its Reference section).

The evaluator performs:

1. **Turn-level evaluation** — For each turn, identify flaws visible within that turn: reasoning errors, epistemic claims, completeness gaps. Use metadata (knowledge areas engaged) to trace flaws to knowledge profile categories.

2. **Cross-turn evaluation** — Evaluate the discussion arc for interaction-driven flaws:
   - Abandoning a valid point after social pressure (spans 3-4 turns)
   - Superficial consensus without resolving disagreement
   - Escalation that derails productive inquiry
   - Conformity — agents agreeing without independent reasoning
   - Deflection — agents changing the subject when challenged

   Use `reactive_tendency_activated` metadata to identify moments where interaction dynamics produced flaws.

3. **Summary** — Aggregate flaw counts by type, source, and severity. Identify key patterns.

### Step 4: Write Output

Use `append_evaluation.py` to write to `registry/{scenario_id}/discussion_evaluation.yaml`.

### Step 5: Report

```
Discussion evaluated: {scenario_id}
├── Total flaws: {count}
│   ├── Reasoning: {count}
│   ├── Epistemic: {count}
│   ├── Completeness: {count}
│   └── Coherence: {count}
├── By source: {knowledge_driven} knowledge-driven, {interaction_driven} interaction-driven
├── By severity: {major} major, {moderate} moderate, {minor} minor
├── Key patterns: {key_patterns}
└── File: registry/{scenario_id}/discussion_evaluation.yaml

{if expected flaws loaded}
Expected flaw coverage:
├── Expected: {count} flaws across {agent_count} agents
├── Detected: {count} of {count} expected flaws surfaced
├── Unexpected: {count} additional flaws found
└── Interaction-driven (emergent): {count}
```

---

## Notes

- Discussions produce both knowledge-driven and interaction-driven flaws. The evaluator must distinguish between them using source classification.
- Interaction-driven flaws are the pedagogically unique contribution of discussions over presentations. They can't be designed into agent profiles — they emerge from agent dynamics.
- The `reactive_tendency_activated` flag in turn metadata is a strong signal for interaction-driven flaws but not definitive. The evaluator should also look for behavioral patterns across turns.
- Cross-turn evaluation is essential. Many of the most important flaws (abandonment, conformity, superficial consensus) are invisible in any single turn.
- The evaluation is a **teacher/researcher tool**, not shown to students directly.
