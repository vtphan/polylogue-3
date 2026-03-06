# Profile Schema

A profile is the full agent definition: context, knowledge profile, disposition, and expected flaw annotations. It is the human-facing design artifact. Personas (runtime artifacts) are derived from profiles.

---

## Schema

```yaml
name: string                           # Display name (e.g., "Kenji")
agent_id: string                       # kebab-case identifier (e.g., "kenji")
scenario_id: string                    # Links to parent scenario

context: string                        # Natural language, inherited from scenario
                                       # May be refined per agent if needed

knowledge_profile:
  strong_understanding:
    - area: string                     # What they know well
      detail: string                   # How this manifests (optional)
  shallow_understanding:
    - area: string                     # Knows vocabulary, not mechanics
      detail: string
  misconceptions:
    - area: string                     # Specific wrong belief
      detail: string                   # What they believe and why it's wrong
  blind_spots:
    - area: string                     # Doesn't know this is relevant
      detail: string

disposition:
  confidence: low | moderate | high
  engagement_style: collaborative | moderate | competitive
  expressiveness: restrained | moderate | expressive
  reactive_tendency: string            # Qualitative: what happens when challenged
                                       # e.g., "Doubles down with more stories"
                                       #        "Concedes quickly, even when right"

description: string                    # 2-3 sentence prose portrait of the agent
                                       # Used in persona generation and for human review

expected_flaws:                        # Annotations for human curators — NOT included in persona
  - flaw: string
    flaw_type: reasoning | epistemic | completeness | coherence
    mechanism: string                  # How knowledge + disposition produces this flaw

metadata:
  version: string
  created_at: ISO 8601
  derived_from: string                 # scenario_id
```

## Example

```yaml
name: "Kenji"
agent_id: "kenji"
scenario_id: "6th-stem-ecosystems"

context: "6th grade student working on a STEM project about environmental threats to local ecosystems, designing a community awareness campaign about water pollution."

knowledge_profile:
  strong_understanding:
    - area: "types of water pollutants and their sources"
      detail: "Can name and distinguish point-source vs. non-point-source pollution, knows common pollutants (nitrates, heavy metals, plastics)"
  shallow_understanding:
    - area: "how pollutants move through watersheds"
      detail: "Knows the word 'watershed' and that water flows downhill, but can't explain how runoff enters waterways or how pollutants accumulate downstream"
  misconceptions:
    - area: "river cleanup effectiveness"
      detail: "Believes cleaning up one section of a river automatically improves water quality downstream. Doesn't understand that upstream sources continue polluting."
  blind_spots:
    - area: "differential community impact"
      detail: "Hasn't considered that different communities along a waterway are affected differently based on location, income, and infrastructure."

disposition:
  confidence: high
  engagement_style: collaborative
  expressiveness: expressive
  reactive_tendency: "When challenged, tries to incorporate the concern rather than defend his position, but his shallow understanding means he can't actually integrate feedback coherently — produces superficial accommodation."

description: "Kenji is enthusiastic and story-driven. He connects ideas through examples and personal observations. He sounds confident and knowledgeable, which makes his gaps harder to catch — things sound right even when they aren't."

expected_flaws:
  - flaw: "Overstates what a single river cleanup can accomplish"
    flaw_type: epistemic
    mechanism: "Misconception about cleanup + high confidence → stated as fact"
  - flaw: "Explains watershed dynamics with surface correctness that doesn't hold up"
    flaw_type: epistemic
    mechanism: "Shallow understanding + high confidence → sounds right but isn't"
  - flaw: "Doesn't address how different communities are impacted"
    flaw_type: completeness
    mechanism: "Blind spot on differential impact → never mentioned"

metadata:
  version: "1.0"
  created_at: "2026-03-05T10:30:00Z"
  derived_from: "6th-stem-ecosystems"
```

## Persona Derivation

A persona is generated from the profile for use as a `.claude/agents/` subagent file. The persona:

- **Includes**: context, knowledge profile, disposition, description
- **Excludes**: expected flaws, metadata, scenario_id
- **Format**: Prose markdown (not YAML) — a character portrait the LLM inhabits

The persona is written in second person ("You are...") and integrates the knowledge profile and disposition into natural prose, following Polylogue 2's pattern of transforming sparse specifications into rich character prompts.

## Constraints

- `agent_id`: unique within a scenario, kebab-case
- `disposition.confidence`: one of `low`, `moderate`, `high`
- `disposition.engagement_style`: one of `collaborative`, `moderate`, `competitive`
- `disposition.expressiveness`: one of `restrained`, `moderate`, `expressive`
- `expected_flaws[].flaw_type`: one of `reasoning`, `epistemic`, `completeness`, `coherence`
- `knowledge_profile`: 4-8 items total across categories recommended. Unspecified areas default to age-appropriate general knowledge.
- All string fields are natural language.

## Notes

- Profiles are **generated by an LLM** from the scenario and **revised by the teacher** before persona generation.
- Expected flaws exist for **human curators only**. They help teachers verify that the agent is designed to produce the intended flaws. They are never shown to the LLM generating utterances.
- The knowledge profile is **topic-specific**. The same disposition can pair with different knowledge profiles for different scenarios.
