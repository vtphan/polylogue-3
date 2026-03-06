# Transcript Schemas

Schemas for presentation and discussion transcripts stored in the registry.

---

## Presentation Transcript

Stored at: `registry/{scenario_id}/presentation.yaml`

```yaml
scenario_id: string
topic: string                          # From scenario
activity: presentation
created_at: ISO 8601

agents:
  - agent_id: string
    name: string
    role: string                       # Presentation role (Framer, Researcher, etc.)

sections:
  - section_id: string                 # section_01, section_02, ...
    section: introduction | approach | findings | solution | conclusion
    speaker: string                    # agent_id
    role: string                       # Agent's role
    content: |
      Multi-paragraph presentation content.
    metadata:
      knowledge_areas_engaged:
        - area: string
          category: strong | shallow | misconception | blind_spot
      rationale: string
    added_at: ISO 8601
```

### Constraints

- `section`: one of `introduction`, `approach`, `findings`, `solution`, `conclusion`
- `knowledge_areas_engaged[].category`: one of `strong`, `shallow`, `misconception`, `blind_spot`
- `speaker`: must match an agent_id in the agents list
- Sections are ordered — `section_id` is sequential

---

## Discussion Transcript

Stored at: `registry/{scenario_id}/discussion.yaml`

```yaml
scenario_id: string
topic: string
activity: discussion
created_at: ISO 8601

agents:
  - agent_id: string
    name: string
    role: string | null                # Discussion role if assigned; null if unstructured

config:
  current_stage: opening_up | working_through | converging
  selection: responsive | round_robin
  max_turns: integer | null

turns:
  - turn_id: string                    # turn_001, turn_002, ...
    speaker: string                    # agent_id
    role: string | null
    stage: opening_up | working_through | converging
    content: string                    # 2-4 sentences
    metadata:
      knowledge_areas_engaged:
        - area: string
          category: strong | shallow | misconception | blind_spot
      reactive_tendency_activated: boolean
      rationale: string
    added_at: ISO 8601
```

### Constraints

- `stage`: one of `opening_up`, `working_through`, `converging`
- `turn_id`: zero-padded sequential (turn_001, turn_002, ...)
- `speaker`: must match an agent_id in the agents list
- `reactive_tendency_activated`: true only when the agent's reactive tendency was triggered by the conversation dynamic
- `config.current_stage`: updated when stage-tracker detects a transition

---

## Registry Config

Stored at: `registry/{scenario_id}/config.yaml`

```yaml
scenario_id: string
created_at: ISO 8601
topic: string
activity: presentation | discussion

agents:
  - agent_id: string
    name: string

# For discussions: current state
discussion_state:
  current_stage: opening_up | working_through | converging
  total_turns: integer
  last_speaker: string | null

# For presentations: generation state
presentation_state:
  sections_completed: [string]         # List of completed section names
  total_sections: integer
```

---

## Metadata Visibility Reminder

| Field | Visible to agents during generation? | Stored in transcript? | Used by evaluator? |
|-------|-------------------------------------|----------------------|-------------------|
| content | Yes (conversation history) | Yes | Yes |
| knowledge_areas_engaged | No | Yes | Yes |
| rationale | No | Yes | Yes |
| reactive_tendency_activated | No | Yes | Yes |
| stage | No | Yes | Yes |
