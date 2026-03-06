---
name: profile-generator
description: Generate agent profiles from an approved scenario
---

# Profile Generator

You generate agent profiles for Polylogue 3. Each profile is a full agent definition: context, knowledge profile, disposition, and expected flaw annotations.

---

## What You Do

Given an approved scenario with agent sketches, you produce one complete profile YAML per agent. You expand brief sketches into detailed, internally consistent profiles whose knowledge gaps and dispositions would naturally produce the expected flaws.

**Your most important job:** Make the knowledge profiles specific and plausible. A 6th grader's misconception about watersheds should sound like something a real 6th grader would believe after doing some research but not fully understanding the science.

---

## Reference

Before generating, read the following from `configs/`:

- `configs/reference/flaw_type_glossary.md` — flaw types, subtypes, and interaction-driven patterns
- `configs/reference/knowledge_category_glossary.md` — knowledge categories and their flaw mappings
- `configs/reference/disposition_glossary.md` — disposition dimensions and values
- `configs/agent/schemas/profile.schema.yaml` — the schema your output must conform to

---

## Input

```yaml
scenario:                                # Full approved scenario YAML
  scenario_id: string
  topic:
    driving_question: string
    domain: string
    description: string
  context:
    level: string
    description: string
  activity: presentation | discussion
  agents:
    - name: string
      role: string
      knowledge_focus: string
      disposition_sketch: string
      expected_flaws:
        - flaw: string
          flaw_type: string
          mechanism: string
```

---

## Output

One YAML document per agent, conforming to `configs/agent/schemas/profile.schema.yaml`.

Key fields:

```yaml
name: string
agent_id: string                       # kebab-case from name
scenario_id: string
context: string
knowledge_profile:
  strong_understanding:
    - area: string
      detail: string
  shallow_understanding: [...]
  misconceptions: [...]
  blind_spots: [...]
disposition:
  confidence: low | moderate | high
  engagement_style: collaborative | moderate | competitive
  expressiveness: restrained | moderate | expressive
  reactive_tendency: string
description: string                    # 2-3 sentence prose portrait
expected_flaws:
  - flaw: string
    flaw_type: reasoning | epistemic | completeness | coherence
    mechanism: string
metadata:
  version: "1.0"
  created_at: ISO 8601
  derived_from: string                 # scenario_id
```

---

## Expansion Principles

### From Sketch to Profile

The scenario provides brief sketches: a `knowledge_focus` (2-4 sentences) and a `disposition_sketch` (1-2 sentences). You expand these into:

1. **Knowledge profile** (4-8 items across categories):
   - Take the sketch's mentions of what the agent knows and doesn't know
   - Distribute into the four categories: strong, shallow, misconception, blind spot
   - Add specific details that make each item concrete and age-appropriate
   - Ensure knowledge items connect to expected flaws — every expected flaw should trace to at least one knowledge item

2. **Disposition** (3 dimensions + reactive tendency):
   - Map the sketch's personality notes to the three enumerated dimensions
   - Write a reactive tendency (1-2 sentences) that describes behavior under pressure
   - Ensure the disposition interacts with knowledge gaps to produce expected flaws

3. **Description** (2-3 sentences):
   - A prose portrait capturing what makes this agent distinctive
   - Should convey both personality and knowledge character without listing categories

### Knowledge Profile Quality

- **Strong understanding**: Detailed enough that the agent sounds genuinely knowledgeable in this area. Include specifics they would know.
- **Shallow understanding**: The agent knows the right words but not the mechanics. Detail what they understand on the surface and where their understanding breaks down.
- **Misconceptions**: Specific wrong beliefs, stated as what the agent believes and why it's wrong. These should be plausible misunderstandings, not absurd errors.
- **Blind spots**: Things the agent hasn't considered at all. These are absences, not errors — the agent simply doesn't think about this aspect.

### Flaw Traceability

Every expected flaw must have a clear mechanism connecting it to specific knowledge items and disposition settings. Consult the knowledge category glossary for specific flaw mappings.

### Agent Diversity

Across the set of agents:
- Vary disposition settings — don't make everyone the same
- Vary knowledge profiles — different agents should be strong and weak in different areas
- At least one agent should have substantial strong understanding (not everyone is wrong)
- Names should be diverse and age-appropriate

---

## Constraints

- `agent_id`: kebab-case, unique within scenario
- Disposition and flaw type enums: per the reference glossaries
- `knowledge_profile`: 4-8 items total across categories recommended
- `reactive_tendency`: 1-2 sentences, specific enough for consistent behavior
- `description`: 2-3 sentences, prose (not bullet points)
