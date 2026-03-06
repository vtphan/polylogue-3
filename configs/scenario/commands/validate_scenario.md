---
description: Validate a scenario against the schema and design constraints
argument-hint: <scenario_id>
---

# Validate Scenario

Validate a scenario document for schema conformance, internal consistency, and design quality.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario to validate |

---

## Execution

### Step 1: Load Files

Read:
- `configs/scenarios/{scenario_id}.yaml` — the scenario to validate
- `configs/scenario/schemas/scenario.schema.yaml` — the schema

If any file doesn't exist, report an error and exit.

### Step 2: Schema Validation

Check the scenario against the schema:
- All required fields present (`scenario_id`, `created_at`, `topic`, `context`, `activity`, `agents`)
- `scenario_id` is kebab-case and matches the argument
- `activity` is one of: `presentation`, `discussion`
- `context.level` is one of: `broad`, `project_type`, `domain`, `specific`
- `agents` is a non-empty array
- Each agent has required fields: `name`, `role`, `knowledge_focus`, `disposition_sketch`, `expected_flaws`
- All `expected_flaws[].flaw_type` values are one of: `reasoning`, `epistemic`, `completeness`, `coherence`

### Step 3: Design Constraint Validation

Check internal quality:

**Topic:**
- `driving_question` is a meaningful question, not a fragment
- `domain` is specified
- `description` is 2-3 sentences

**Context:**
- `description` provides enough detail for agents to be grounded in a realistic PBL setting

**Agents:**
- Each agent has a distinct `name`
- Each agent has a `role` that fits the project context
- `knowledge_focus` is 2-4 sentences covering strengths and weaknesses
- `disposition_sketch` is 1-2 sentences on communication style
- Each agent has 1-3 expected flaws

### Step 4: Flaw Coverage Validation

Check that the scenario produces a useful set of flaws:
- At least two different `flaw_type` values appear across all agents
- Not all agents have the same kind of knowledge gap
- At least one agent has some area of strength implied in `knowledge_focus`
- Expected flaws have plausible `mechanism` fields connecting to knowledge gaps or dispositions

### Step 5: Role Consistency

Check that roles make sense for the activity:
- For `presentation`: roles should map naturally to presentation sections (i.e., each section has a plausible presenter)
- For `discussion`: roles are appropriate for the project context or follow a recognized framework (e.g., Six Thinking Hats)
- No two agents share the same role (unless the scenario notes justify it)

### Step 6: Report

```
Validation: {scenario_id}

Schema:     {PASS | FAIL — list issues}
Design:     {PASS | WARN — list issues}
Flaw coverage: {PASS | WARN — list issues}
Roles:      {PASS | WARN — list issues}

{Summary of any issues found}
```

---

## Notes

- Schema failures are errors that must be fixed. Design, flaw coverage, and role issues are warnings — the teacher may have good reasons for the choices.
- This command validates a scenario that has already been created (either generated or manually authored). Run it after creating or editing a scenario, before proceeding to `/generate_profiles`.
- Teachers are expected to revise scenarios after generation. Warnings help catch unintentional gaps without blocking intentional design choices.
