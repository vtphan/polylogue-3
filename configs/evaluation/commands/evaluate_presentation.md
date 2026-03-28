---
description: Evaluate a presentation transcript for critical thinking flaws
argument-hint: <scenario_id>
---

# Evaluate Presentation

Evaluate a generated presentation for critical thinking flaws. Examines each section individually for section-level flaws, then evaluates across sections for coherence flaws.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario whose presentation to evaluate |

---

## Execution

### Step 1: Load Transcript

Read `registry/{scenario_id}/presentation.yaml`.

If the file doesn't exist or has no sections, report an error and exit.

### Step 2: Load Scenario Metadata

Read `grade_band` from the transcript header or from `configs/scenarios/{scenario_id}.yaml`.

### Step 3: Load Expected Flaws (Optional)

If expected flaws are available for comparison:
- `configs/profiles/{scenario_id}/*.yaml` — load expected flaws from all agent profiles

### Step 4: Evaluate

Delegate to the **evaluator** subagent.

Provide the subagent with:
- The full presentation transcript (content + metadata)
- Activity type: `presentation`
- `grade_band`: for severity calibration (see evaluator's Grade Band Calibration section)

The evaluator reads the reference glossaries and evaluation schema from `configs/` directly (see its Reference section).

The evaluator performs:

1. **Section-level evaluation** — For each section, identify flaws visible within that section alone. Look for reasoning errors, epistemic problems (overstated evidence, assumptions as fact), and completeness gaps (missing stakeholders, no feasibility).

2. **Cross-section evaluation** — Evaluate the presentation as a whole for coherence flaws: does the introduction frame match the solution? Do findings support the approach? Do different speakers contradict each other?

3. **Summary** — Aggregate flaw counts by type, source, and severity. Identify key patterns.

### Step 5: Write Output

Use `append_evaluation.py` to write to `registry/{scenario_id}/presentation_evaluation.yaml`.

### Step 6: Report

```
Presentation evaluated: {scenario_id}
├── Total flaws: {count}
│   ├── Reasoning: {count}
│   ├── Epistemic: {count}
│   ├── Completeness: {count}
│   └── Coherence: {count}
├── By severity: {major} major, {moderate} moderate, {minor} minor
├── Key patterns: {key_patterns}
└── File: registry/{scenario_id}/presentation_evaluation.yaml

{if expected flaws loaded}
Expected flaw coverage:
├── Expected: {count} flaws across {agent_count} agents
├── Detected: {count} of {count} expected flaws surfaced
└── Unexpected: {count} additional flaws found
```

---

## Notes

- The evaluator assesses the **output** (what was said), not the **profile** (what was intended). Expected flaw comparison is informational only — it tells the teacher whether the agent design achieved its purpose.
- All flaws in presentations are classified as `knowledge_driven` for source. Interaction-driven flaws require discussion dynamics.
- Coherence flaws (cross-section) often produce the most pedagogically valuable findings — these are what students find hardest to identify.
- The evaluation is a **teacher/researcher tool**, not shown to students directly.
