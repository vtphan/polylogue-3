---
description: Initialize a new discussion from a scenario with deployed personas
argument-hint: <scenario_id> [options]
---

# Begin Discussion

Initialize a new group discussion. Sets up the registry, validates that personas are deployed, and generates the first few turns to get the conversation started.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `scenario_id` | Yes | ID of the scenario to start a discussion for |
| `--selection` | No | Speaker selection method: `responsive` (default) or `round_robin` |
| `--max_turns` | No | Maximum turns before stopping (default: none — runs until converging or human stops) |
| `--opening_turns` | No | Number of turns to generate in the opening round (default: one per agent) |

---

## Execution

### Step 1: Load Scenario and Verify Readiness

Read `configs/scenarios/{scenario_id}.yaml`.

Verify:
- `activity` is `discussion`
- Scenario exists and has agents

Read all persona files from `.claude/agents/personas/{scenario_id}/`.

Verify:
- Persona files exist for all agents listed in the scenario
- If any personas are missing, report an error and instruct the user to run `/generate_personas {scenario_id}` first

### Step 2: Consult References

Read:
- `configs/reference/discussion_stage_glossary.md` — stage definitions and transition signals

### Step 3: Initialize Registry

Create `registry/{scenario_id}/` if it doesn't exist.

Initialize `registry/{scenario_id}/config.yaml`:
```yaml
scenario_id: {scenario_id}
grade_band: {grade_band}
created_at: {ISO 8601}
topic: {driving_question}
activity: discussion
agents:
  - agent_id: {id}
    name: {name}
discussion_state:
  current_stage: opening_up
  total_turns: 0
  last_speaker: null
```

Initialize `registry/{scenario_id}/discussion.yaml` with the header:
```yaml
scenario_id: {scenario_id}
grade_band: {grade_band}
topic: {driving_question}
activity: discussion
created_at: {ISO 8601}
agents:
  - agent_id: {id}
    name: {name}
    role: {role | null}
config:
  current_stage: opening_up
  selection: {responsive | round_robin}
  max_turns: {integer | null}
turns: []
```

### Step 4: Generate Opening Turns

Generate the first round of turns (one per agent by default, or `--opening_turns` if specified).

For the opening round, use round-robin selection regardless of `--selection` setting — each agent gets one turn to put their initial thoughts on the table. Order follows the scenario's agent list.

For each turn, follow the turn-generation loop:

1. **Build utterance input** using `build_utterance_input.py`
2. **Invoke persona** as subagent → utterance + metadata
3. **Append turn** using `append_turn.py`
4. **Track stage** using stage-tracker subagent (via `build_stage_input.py`)

### Step 5: Report

```
Discussion started: {scenario_id}
├── Topic: {driving_question}
├── Selection: {selection}
├── Stage: opening_up
├── Turns generated: {count}
│   ├── {turn_id}: {agent_name} — "{first 50 chars of content}..."
│   ├── ...
│   └── ...
└── Transcript: registry/{scenario_id}/discussion.yaml

To continue: /continue_discussion
To stop: discussion ends at current state
```

---

## Notes

- The opening round ensures every agent speaks once, establishing their positions. After that, `/continue_discussion` uses the configured selection method.
- The initial stage is always `opening_up`. The stage-tracker may detect a transition during opening turns if agents immediately start engaging with each other's claims.
- If a discussion already exists for this scenario, ask confirmation before overwriting.
