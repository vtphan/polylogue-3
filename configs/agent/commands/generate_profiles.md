---
description: Generate agent profiles from an approved scenario
argument-hint: <scenario_id>
---

# Generate Profiles

Generate full agent profiles from an approved scenario. Each profile expands a scenario's agent sketch into a detailed knowledge profile, disposition, and expected flaw annotations.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the approved scenario |

---

## Execution

### Step 1: Load Scenario

Read `configs/scenarios/{scenario_id}.yaml`.

If the file doesn't exist, report an error and exit.

Extract:
- `topic`: driving question, domain, description
- `context`: level and description
- `activity`: presentation or discussion
- `agents`: agent sketches (name, role, knowledge_focus, disposition_sketch, expected_flaws)

### Step 2: Generate Profiles

Delegate to the **profile-generator** subagent.

Provide the subagent with:
- The full scenario document

The subagent reads the reference glossaries and profile schema from `configs/` directly (see its Reference section) and produces one complete profile YAML per agent.

### Step 3: Validate

For each generated profile, validate against the schema:
- `agent_id` is kebab-case
- `scenario_id` matches the input scenario
- `disposition.confidence` is a valid enum
- `disposition.engagement_style` is a valid enum
- `disposition.expressiveness` is a valid enum
- `expected_flaws[].flaw_type` values are valid enums
- `knowledge_profile` has at least one item in at least two categories

If validation fails, fix and regenerate.

### Step 4: Write Output

Create directory `configs/profiles/{scenario_id}/` if it doesn't exist.

Write each profile to `configs/profiles/{scenario_id}/{agent_id}.yaml`.

If files exist, ask confirmation before overwriting.

### Step 5: Report

```
Profiles generated for scenario: {scenario_id}
├── {name} ({agent_id})
│   ├── Knowledge: {count} items ({categories with items})
│   ├── Disposition: {confidence} confidence, {engagement_style}, {expressiveness}
│   └── Expected flaws: {count} ({flaw_types})
├── {name} ({agent_id})
│   └── ...
└── Files: configs/profiles/{scenario_id}/

Review and revise the profiles, then run:
  /generate_personas {scenario_id}
```

---

## Notes

- Profiles are **drafts for human review**. The teacher should revise knowledge items, disposition settings, and expected flaws before persona generation.
- The profile-generator expands scenario sketches — it doesn't just copy them. It adds specific knowledge items, precise disposition settings, and detailed flaw mechanisms.
- Expected flaws are annotations for human curators. They will be **excluded from personas**.
