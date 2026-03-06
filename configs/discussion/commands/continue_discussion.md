---
description: Generate next discussion turns until a stage transition or limit is reached
argument-hint: "[options]"
---

# Continue Discussion

Continue an active discussion by generating turns until a stage transition occurs, a turn limit is reached, or the discussion converges.

---

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--stages` | No | Number of stage transitions to generate through (default: 1) |
| `--max_turns` | No | Maximum turns to generate in this batch (default: 10) |
| `--selection` | No | Override selection method for this batch: `responsive` or `round_robin` |

The command operates on the most recently active discussion. If multiple discussions exist, specify `--scenario` to disambiguate.

| `--scenario` | No | Scenario ID (required only if multiple active discussions exist) |

---

## Execution

### Step 1: Load State

Determine the active scenario:
- If `--scenario` is provided, use it
- Otherwise, find the most recently modified `registry/*/config.yaml` with `activity: discussion`

Read:
- `registry/{scenario_id}/config.yaml` — current state
- `registry/{scenario_id}/discussion.yaml` — transcript so far
- All persona files from `.claude/agents/personas/{scenario_id}/`

Verify the discussion is active (not already converged to completion).

### Step 2: Consult References

Read:
- `configs/reference/discussion_stage_glossary.md` — stage definitions and transitions

### Step 3: Turn Generation Loop

Repeat until an exit condition is met:

#### 3a. Select Speaker

Use `build_selector_input.py` to construct input for the **speaker-selector** subagent:
- Available speakers (all agents except constraints like "not the same speaker twice in a row")
- Last speaker
- Conversation history (content only — no metadata)
- Selection method (responsive or round_robin)

The speaker-selector returns: `next_speaker` (agent_id) and `rationale`.

#### 3b. Generate Utterance

Use `build_utterance_input.py` to construct input for the selected persona:
- The persona's character file
- Topic and context
- Conversation history (content only — agents don't see metadata)

Invoke the persona as a subagent. The persona returns:
```yaml
content: string              # 2-4 sentences
metadata:
  knowledge_areas_engaged:
    - area: string
      category: strong | shallow | misconception | blind_spot
  rationale: string
  reactive_tendency_activated: boolean
```

#### 3c. Append Turn

Use `append_turn.py` to:
- Validate the turn output
- Append to `registry/{scenario_id}/discussion.yaml`
- Update `registry/{scenario_id}/config.yaml` (total_turns, last_speaker)

#### 3d. Track Stage

Use `build_stage_input.py` to construct input for the **stage-tracker** subagent:
- Current stage
- Conversation history (with metadata — the stage-tracker sees everything)
- Stage glossary transition signals

The stage-tracker returns:
```yaml
current_stage: opening_up | working_through | converging
stage_changed: boolean
rationale: string
```

If `stage_changed`, update `config.yaml` and `discussion.yaml` header.

#### 3e. Check Exit Conditions

Exit the loop if any of these are true:
- Stage transitions reached `--stages` count
- Turns generated reached `--max_turns` count
- Discussion has converged and resolution (or acknowledged impasse) is reached
- `max_turns` from the original `/begin_discussion` is reached

### Step 4: Report

```
Discussion continued: {scenario_id}
├── Turns generated: {count} (total: {total_turns})
├── Stage: {current_stage} {← changed from {previous_stage} | (unchanged)}
├── Last speaker: {agent_name}
├── New turns:
│   ├── {turn_id}: {agent_name} — "{first 50 chars}..."
│   ├── ...
│   └── ...
└── Transcript: registry/{scenario_id}/discussion.yaml

{if converging and resolved}
Discussion has converged. To evaluate: /evaluate_discussion {scenario_id}

{if not converging}
To continue: /continue_discussion
To stop: discussion ends at current state
```

---

## Notes

- The turn-generation loop mirrors Polylogue 2's `continue_conversation` pattern, adapted for 3 stages instead of 7 phases.
- Responsive selection means the speaker-selector chooses based on conversation flow — who has something to respond to, who hasn't spoken recently, whose knowledge is relevant to the current thread.
- Round-robin selection cycles through agents in order, regardless of conversational flow.
- Agents see conversation content only — no metadata, no other agents' knowledge profiles, no stage information. This preserves natural interaction.
- The stage-tracker sees full metadata to make informed stage assessments.
