---
description: Generate a full presentation from personas and scenario
argument-hint: <scenario_id> [options]
---

# Generate Presentation

Generate a full group presentation, section by section. Each agent produces their assigned section based on their persona, without seeing other agents' contributions.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario to generate a presentation for |
| `--sections` | No | Comma-separated list of sections to generate (default: all five) |
| `--assignment` | No | Override section-to-agent assignment (format: `intro:agent_id,approach:agent_id,...`) |

---

## Execution

### Step 1: Load Scenario and Verify Readiness

Read `configs/scenarios/{scenario_id}.yaml`.

Verify:
- `activity` is `presentation`
- Scenario exists and has agents

Read all persona files from `.claude/agents/personas/{scenario_id}/`.

Verify:
- Persona files exist for all agents listed in the scenario
- If any personas are missing, report an error and instruct the user to run `/generate_personas {scenario_id}` first

### Step 2: Determine Section Assignments

If `--assignment` is provided, parse it.

Otherwise, derive assignments from the scenario's agent roles. Since roles are flexible and scenario-specific, use this approach:

1. **Match by role semantics.** If agent roles suggest natural section assignments (e.g., a "Lead Scientist" might present findings, a "Project Manager" might present the approach), assign accordingly.
2. **Distribute evenly.** Spread sections across agents so no agent is overloaded unless their role warrants multiple sections.
3. **Round-robin fallback.** If roles don't suggest clear mappings, assign sections round-robin across agents in scenario order.

Validate: every section has exactly one assigned speaker.

### Step 3: Initialize Registry

Create `registry/{scenario_id}/` if it doesn't exist.

Initialize `registry/{scenario_id}/config.yaml`:
```yaml
scenario_id: {scenario_id}
created_at: {ISO 8601}
topic: {driving_question}
activity: presentation
agents:
  - agent_id: {id}
    name: {name}
presentation_state:
  sections_completed: []
  total_sections: {count}
```

Initialize `registry/{scenario_id}/presentation.yaml` with the header:
```yaml
scenario_id: {scenario_id}
topic: {driving_question}
activity: presentation
created_at: {ISO 8601}
agents:
  - agent_id: {id}
    name: {name}
    role: {role}
sections: []
```

### Step 4: Generate Sections

Delegate to the **section-generator** subagent.

The section-generator orchestrates generation in section order: introduction → approach → findings → solution → conclusion.

For each section:

1. **Build section input** using `build_section_input.py`:
   - Reads the assigned agent's persona file
   - Reads the scenario for topic and context
   - Constructs a structured input: persona content, section assignment, topic description, team overview (agent names and roles — but NOT other sections' content)

2. **Invoke the persona** as a subagent with the section input:
   - The persona generates 3-6 paragraphs of section content
   - The persona also produces metadata: knowledge areas engaged, rationale

3. **Append to transcript** using `append_section.py`:
   - Validates section output schema
   - Appends to `registry/{scenario_id}/presentation.yaml`
   - Updates `registry/{scenario_id}/config.yaml` (sections_completed)

**Key rule:** Agents do NOT see other sections' content during generation. Each agent receives only their own persona, the topic, and their section assignment. This enables coordination gaps and coherence flaws to emerge naturally.

### Step 5: Report

```
Presentation generated: {scenario_id}
├── Introduction — {agent_name} ({role})
├── Approach — {agent_name} ({role})
├── Findings — {agent_name} ({role})
├── Solution — {agent_name} ({role})
└── Conclusion — {agent_name} ({role})

Transcript: registry/{scenario_id}/presentation.yaml

To evaluate: /evaluate_presentation {scenario_id}
```

---

## Notes

- Agents are deliberately isolated from each other's contributions. This is a core design choice: coherence flaws between sections emerge from the agents' different knowledge profiles, not from coordination.
- The team overview provided to each agent includes agent names and roles, giving a sense of the team — but no content from other sections.
- If `--sections` is specified, only those sections are generated. This supports partial regeneration (e.g., regenerate just the findings section with a revised persona).
- Section generation can be run as a batch (all at once) or incrementally. The registry tracks which sections are complete.
