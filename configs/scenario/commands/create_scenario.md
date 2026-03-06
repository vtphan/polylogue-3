---
description: Generate a scenario from teacher input (topic, activity, pedagogical goals)
argument-hint: "topic" activity [options]
---

# Create Scenario

Generate a scenario document that drives agent creation and discourse generation.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `topic` | Yes | PBL topic or driving question (quoted string) |
| `activity` | Yes | `presentation` or `discussion` |
| `--flaws` | No | Comma-separated flaw types to emphasize (e.g., `epistemic,completeness`) |
| `--context` | No | Context description (default: "middle school students working on a PBL project") |
| `--id` | No | Scenario ID (default: auto-generated from topic) |

---

## Execution

### Step 1: Parse Input

Extract from arguments:
- `topic`: the driving question or topic
- `activity`: presentation or discussion (must be one of these two)
- `flaw_emphasis`: list of flaw types to emphasize, or all four if not specified
- `context`: context description
- `scenario_id`: provided or generated (kebab-case from topic)

### Step 2: Consult References

Read:
- `configs/reference/flaw_type_glossary.md` — flaw type definitions and examples
- `configs/reference/knowledge_category_glossary.md` — knowledge categories
- `configs/reference/disposition_glossary.md` — disposition dimensions

If `activity` is `presentation`, also read:
- `configs/reference/presentation_section_glossary.md` — section definitions and flaw locations

If `activity` is `discussion`, also read:
- `configs/reference/discussion_stage_glossary.md` — stage definitions

### Step 3: Generate Scenario

Delegate to the **scenario-generator** subagent.

Provide the subagent with:
- Topic, activity, flaw emphasis, context
- All reference glossary content from Step 2

The subagent produces a complete scenario YAML following the schema.

### Step 4: Validate

Read `configs/scenario/schemas/scenario.schema.yaml`.

Validate the generated scenario against the schema:
- `scenario_id` is kebab-case
- `activity` is `presentation` or `discussion`
- `agents` is a non-empty array of agent descriptions
- All `expected_flaws[].flaw_type` values are valid enums
- `context.level` is a valid enum

If validation fails, fix and regenerate.

### Step 5: Write Output

Write to `configs/scenarios/{scenario_id}.yaml`.

If file exists, ask confirmation before overwriting.

### Step 6: Report

```
Scenario created: {scenario_id}
├── Topic: {driving_question}
├── Activity: {activity}
├── Agents:
│   ├── {name} ({role}) — expected: {flaw_types}
│   ├── {name} ({role}) — expected: {flaw_types}
│   └── ...
├── Flaw emphasis: {flaw_types}
└── File: configs/scenarios/{scenario_id}.yaml

Review and revise the scenario, then run:
  /generate_profiles {scenario_id}
```

---

## Notes

- The scenario is a **draft for human review**. The teacher should revise agent sketches, expected flaws, and context before proceeding.
- Expected flaws in the scenario are sketches — full flaw annotations are generated with profiles in the next step.
- The scenario-generator subagent designs agents **backward from expected flaws**: it picks knowledge gaps that would naturally produce the desired flaw types.
