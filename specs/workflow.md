# Workflow

The Polylogue 3 pipeline: from topic to transcript.

---

## Overview

```
Teacher input → [LLM] → Scenario → [Human] → Approved Scenario
                         [LLM] → Profiles → [Human] → Approved Profiles
                         [LLM] → Personas (from profiles, minus expected flaws)
                         [Human command] → Transcript (presentation or discussion)
```

Two human checkpoints. No discourse is generated until both the scenario and profiles are approved.

---

## Stage 1: Scenario Generation

**Input:** Teacher provides (natural language):
- PBL topic or driving question
- Activity type (presentation, discussion, or both)
- Pedagogical goals (what flaw types students should practice identifying)
- Any constraints (number of agents, specific knowledge areas to cover)

**Process:** LLM generates a scenario document following the [scenario schema](scenario-schema.md).

**Output:** `configs/scenarios/{scenario_id}.yaml`

**Human checkpoint:** Teacher reviews and revises the scenario. May adjust:
- Agent sketches (add/remove agents, change knowledge focus)
- Expected flaws (add/remove, change flaw types)
- Context level (make more or less specific)
- Roles

---

## Stage 2: Profile Generation

**Input:** Approved scenario.

**Process:** LLM generates a full profile for each agent, following the [profile schema](profile-schema.md). The LLM expands the scenario's agent sketches into detailed knowledge profiles, disposition settings, and expected flaw annotations.

**Output:** `configs/profiles/{scenario_id}/{agent_id}.yaml` (one per agent)

**Human checkpoint:** Teacher reviews and revises profiles. May adjust:
- Knowledge profile items (change misconceptions, add blind spots, adjust depth)
- Disposition settings (change confidence, engagement style, expressiveness)
- Reactive tendency description
- Expected flaw annotations

---

## Stage 3: Persona Generation

**Input:** Approved profiles.

**Process:** LLM transforms each profile into a persona — a prose markdown file that the LLM will inhabit when generating utterances. Follows Polylogue 2's pattern: sparse specification → rich character prompt in second person.

**Key rule:** Expected flaws are **excluded** from personas. The persona contains context, knowledge profile, disposition, and description — everything the agent needs to behave naturally, nothing that would bias it toward performing flaws.

**Output:** `.claude/agents/{scenario_id}/{agent_id}.md` (one per agent)

**No human checkpoint required** (but teacher may review if desired). Persona generation is a mechanical transformation, not a creative step.

---

## Stage 4: Discourse Generation

Two paths depending on activity type.

### Presentation Generation

**Input:**
- Scenario (topic, roles, section structure)
- Personas for all agents
- Role-to-section assignment (which agent handles which section)

**Process:** LLM generates the presentation **section by section or as a whole**. Each agent produces their assigned section(s) based on their persona. Agents do **not** see other agents' sections during generation — this enables coordination gaps to emerge naturally.

**Output schema for each section:**
```yaml
section: introduction | approach | findings | solution | conclusion
speaker: agent_id
role: string
content: string                        # The presentation content
metadata:
  knowledge_areas_engaged:             # Which knowledge profile items were drawn on
    - area: string
      category: strong | shallow | misconception | blind_spot
  rationale: string                    # Why the agent said what they said
```

**Output:** `registry/{scenario_id}/presentation.yaml`

### Discussion Generation

**Input:**
- Scenario (topic, roles if assigned)
- Personas for all agents
- Previous turns (conversation history — content only, no metadata)

**Process:** LLM generates the discussion **turn by turn**. Each round:
1. **Select speaker** — based on conversation flow (responsive selection) or rotation
2. **Assign role** (if role-structured discussion) — or leave unassigned
3. **Generate utterance** — agent produces a turn based on their persona + conversation history (content only)
4. **Track stage** — determine if the discussion has moved between stages (opening up, working through, converging)
5. **Append turn** to transcript

**Output schema for each turn:**
```yaml
turn_id: string                        # Sequential (turn_001, turn_002, ...)
speaker: agent_id
role: string                           # If role-structured; null if unstructured
stage: opening_up | working_through | converging
content: string
metadata:
  knowledge_areas_engaged:
    - area: string
      category: strong | shallow | misconception | blind_spot
  reactive_tendency_activated: boolean
  rationale: string
added_at: ISO 8601
```

**Output:** `registry/{scenario_id}/discussion.yaml`

**Exit conditions:**
- Converging stage reached and resolution (or impasse) achieved
- Turn limit reached
- Human stops generation

---

## Pipeline Summary

| Stage | Input | Output | Human checkpoint |
|-------|-------|--------|-----------------|
| 1. Scenario | Teacher input (natural language) | `configs/scenarios/{id}.yaml` | Yes — review and revise |
| 2. Profiles | Approved scenario | `configs/profiles/{id}/{agent}.yaml` | Yes — review and revise |
| 3. Personas | Approved profiles | `.claude/agents/{id}/{agent}.md` | Optional |
| 4. Transcript | Personas + scenario | `registry/{id}/presentation.yaml` or `discussion.yaml` | Controls via commands |

## Directory Structure

```
configs/
  scenarios/           # Scenario documents (YAML)
  profiles/            # Agent profiles organized by scenario (YAML)
    {scenario_id}/
      {agent_id}.yaml

.claude/
  agents/              # Personas — runtime agent files (Markdown)
    {scenario_id}/
      {agent_id}.md

registry/
  {scenario_id}/       # Generated transcripts (YAML)
    presentation.yaml
    discussion.yaml
```

## Metadata Splitting

| Data | Visible to agents? | Visible to orchestration? | Visible to evaluation? |
|------|--------------------|--------------------------|-----------------------|
| Conversation content | Yes | Yes | Yes |
| Agent's own persona | Yes | No | No |
| Other agents' personas | No | No | No |
| Expected flaws | No | No | Yes (for validation) |
| Turn metadata (knowledge areas, rationale) | No | Yes | Yes |
| Stage/section tracking | No | Yes | Yes |
