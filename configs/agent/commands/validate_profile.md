---
description: Validate an agent profile against the schema and design constraints
argument-hint: <scenario_id> <agent_id>
---

# Validate Profile

Validate an agent profile for schema conformance, internal consistency, and flaw traceability.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario |
| `agent_id` | Yes | ID of the agent profile to validate |

---

## Execution

### Step 1: Load Files

Read:
- `configs/profiles/{scenario_id}/{agent_id}.yaml` — the profile to validate
- `configs/agent/schemas/profile.schema.yaml` — the schema
- `configs/scenarios/{scenario_id}.yaml` — the parent scenario (for cross-validation)

If any file doesn't exist, report an error and exit.

### Step 2: Schema Validation

Check the profile against the schema:
- All required fields present (`name`, `agent_id`, `scenario_id`, `context`, `knowledge_profile`, `disposition`, `description`, `expected_flaws`, `metadata`)
- `agent_id` is kebab-case
- `scenario_id` matches the argument
- `disposition.confidence` is one of: `low`, `moderate`, `high`
- `disposition.engagement_style` is one of: `collaborative`, `moderate`, `competitive`
- `disposition.expressiveness` is one of: `restrained`, `moderate`, `expressive`
- `expected_flaws[].flaw_type` is one of: `reasoning`, `epistemic`, `completeness`, `coherence`

### Step 3: Design Constraint Validation

Check internal quality:

**Knowledge profile:**
- Has items in at least 2 of the 4 categories
- Total items across categories is 4-8
- Each item has an `area` field (non-empty)
- Areas are specific enough to be meaningful (not just "science" or "the topic")

**Disposition:**
- `reactive_tendency` is 1-2 sentences, not empty
- Description is 2-3 sentences, not empty

**Expected flaws:**
- At least 1, no more than 4
- Each has a non-empty `mechanism` field

### Step 4: Flaw Traceability

For each expected flaw, verify the mechanism connects to the profile:
- Does the cited knowledge gap exist in the knowledge profile?
- Does the cited disposition trait match the profile's disposition settings?
- Is the flaw type appropriate for the mechanism described?

Flag any flaw whose mechanism doesn't trace to specific profile elements.

### Step 5: Scenario Cross-Validation

Compare the profile against the parent scenario:
- Agent name matches scenario's agent sketch
- Expected flaw types align with scenario's expected flaws for this agent
- Role (if any) matches scenario assignment

Flag discrepancies but don't treat them as errors — the teacher may have intentionally revised.

### Step 6: Report

```
Validation: {agent_id} in {scenario_id}

Schema:     {PASS | FAIL — list issues}
Design:     {PASS | WARN — list issues}
Traceability: {PASS | WARN — list issues}
Scenario:   {MATCH | DIVERGED — list differences}

{Summary of any issues found}
```

---

## Notes

- This command validates a single profile. Run once per agent, or iterate over all profiles in a scenario.
- Schema failures are errors that must be fixed. Design and traceability issues are warnings — the teacher may have good reasons for the choices.
- Scenario divergence is informational, not an error. Teachers are expected to revise profiles after generation.
