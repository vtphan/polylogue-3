---
description: Transform approved profiles into personas for discourse generation
argument-hint: <scenario_id>
---

# Generate Personas

Transform approved agent profiles into persona markdown files — the runtime agent files that the LLM inhabits when generating utterances.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario whose profiles to transform |

---

## Execution

### Step 1: Load Profiles

Read all files from `configs/profiles/{scenario_id}/`.

If the directory doesn't exist or is empty, report an error and exit.

For each `{agent_id}.yaml`, load the full profile.

### Step 2: Load Scenario Metadata

Read `configs/scenarios/{scenario_id}.yaml` to extract:
- `grade_band`: the target grade level
- `activity`: presentation or discussion

### Step 3: Read Persona Template

Read `configs/agent/persona-template.md` — the template and examples for persona generation.

### Step 4: Generate Personas

For each profile, delegate to the **persona-generator** subagent.

Provide the subagent with:
- The full profile YAML
- The persona template specification
- The activity type (from the scenario, for the "Generating Your Contribution" section)
- The `grade_band` (from the scenario, for language register calibration)

The subagent produces a persona markdown file for each agent.

**Critical rule:** Expected flaws are **excluded** from personas. The subagent receives the full profile (including expected flaws for context) but must NOT include any reference to expected flaws in the output persona.

### Step 5: Validate Personas

For each generated persona, verify:
- Contains frontmatter with `name` and `agent_id`
- Contains sections: Who You Are, What You Know, How You Communicate, Generating Your Contribution, Output Format
- Does NOT contain any reference to expected flaws, flaw types, or flaw mechanisms
- Does NOT label knowledge categories (no "shallow understanding", "misconception", "blind spot" labels)
- Knowledge is rendered as natural prose, not as categorized lists

If validation fails, regenerate.

### Step 6: Write Output

Create directory `.claude/agents/personas/{scenario_id}/` if it doesn't exist.

Write each persona to `.claude/agents/personas/{scenario_id}/{agent_id}.md`.

If files exist, ask confirmation before overwriting.

### Step 7: Report

```
Personas generated for scenario: {scenario_id}
├── {name} ({agent_id}.md)
├── {name} ({agent_id}.md)
├── ...
└── Directory: .claude/agents/personas/{scenario_id}/

Personas are ready for discourse generation.
  For presentations: /generate_presentation {scenario_id}
  For discussions:   /begin_discussion {scenario_id}
```

---

## Notes

- Persona generation is a **mechanical transformation**, not a creative step. The persona-generator converts structured YAML into prose — it doesn't add new information.
- Expected flaws are excluded so the LLM produces flaws naturally from knowledge gaps and disposition, not from instructions to be flawed.
- Knowledge items are rendered as integrated prose. The persona says "you've heard about watersheds but the details are fuzzy" — not "shallow_understanding: watershed dynamics."
- No human checkpoint is required, but teachers may review personas if desired.
