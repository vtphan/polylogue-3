# Scenario Schema

A scenario is the planning document that drives agent creation and discourse generation.

---

## Schema

```yaml
scenario_id: string                    # kebab-case identifier (e.g., "6th-stem-ecosystems")
created_at: ISO 8601

topic:
  driving_question: string             # The PBL driving question
  domain: string                       # Brief domain label (e.g., "environmental science")
  description: string                  # 2-3 sentences on scope and angle

context:
  level: broad | project_type | domain | specific
  description: string                  # Natural language context at the chosen level
                                       # e.g., "6th grade students working on a STEM project
                                       #        about environmental threats to local ecosystems"

activity: presentation | discussion | both

agents:
  count: integer                       # 3-5 recommended
  descriptions:                        # One per agent
    - name: string
      role: string                     # Assigned role for the activity
      knowledge_focus: string          # Brief: what they know well and where they're weak
      disposition_sketch: string       # Brief: communication style in plain language
      expected_flaws:                  # Predictions, not instructions
        - flaw: string                 # What flaw is expected
          flaw_type: reasoning | epistemic | completeness | coherence
          mechanism: string            # Why this agent would produce this flaw
                                       # (e.g., "blind spot on cost → no feasibility analysis")

notes: string                          # Optional: pedagogical intent, curricular alignment, etc.
```

## Example

```yaml
scenario_id: "6th-stem-ecosystems"
created_at: "2026-03-05T10:00:00Z"

topic:
  driving_question: "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?"
  domain: "environmental science"
  description: "Team researches a specific environmental threat (water pollution) and proposes a community awareness campaign. Aligned to 6th grade STEM PBL at UMS."

context:
  level: specific
  description: "6th grade students working on a STEM project about environmental threats to local ecosystems, designing a community awareness campaign about water pollution."

activity: presentation

agents:
  count: 4
  descriptions:
    - name: "Kenji"
      role: Researcher
      knowledge_focus: "Strong on pollutant types and sources. Shallow on watershed dynamics. Misconception: cleaning one river section fixes downstream."
      disposition_sketch: "High confidence, collaborative, expressive and story-driven."
      expected_flaws:
        - flaw: "Overstates what a single river cleanup can accomplish"
          flaw_type: epistemic
          mechanism: "Misconception about river cleanup + high confidence → stated as fact"
        - flaw: "Explains watershed dynamics with surface correctness that doesn't hold up"
          flaw_type: epistemic
          mechanism: "Shallow understanding + high confidence → sounds right but isn't"

    - name: "Amara"
      role: Designer
      knowledge_focus: "Strong on campaign design and community engagement. Shallow on the science. Blind spot: economic costs of proposed solutions."
      disposition_sketch: "Moderate confidence, collaborative, data-focused and analytical."
      expected_flaws:
        - flaw: "Proposes solutions without cost or feasibility analysis"
          flaw_type: completeness
          mechanism: "Blind spot on economics → never addresses cost"
        - flaw: "Campaign recommendations disconnected from scientific evidence"
          flaw_type: coherence
          mechanism: "Shallow science understanding → can't connect evidence to recommendations"

    - name: "Diego"
      role: Community Liaison
      knowledge_focus: "Strong on local community structure. Misconception: local environmental organizations have more capacity than they do. Blind spot: regulatory and policy dimensions."
      disposition_sketch: "High confidence, competitive engagement, expressive."
      expected_flaws:
        - flaw: "Overstates what local organizations can realistically do"
          flaw_type: epistemic
          mechanism: "Misconception about org capacity + high confidence → unrealistic claims"
        - flaw: "No mention of regulations, permits, or policy"
          flaw_type: completeness
          mechanism: "Blind spot on policy → entire dimension missing"

    - name: "Lily"
      role: Framer
      knowledge_focus: "Broad but shallow across all areas. No deep expertise in any one domain."
      disposition_sketch: "Low confidence, collaborative, restrained and cautious."
      expected_flaws:
        - flaw: "Introduction frames the problem too vaguely to guide the presentation"
          flaw_type: coherence
          mechanism: "Broad shallow knowledge → can't frame the specific problem clearly"
        - flaw: "Conclusion overgeneralizes from the team's limited research"
          flaw_type: reasoning
          mechanism: "Shallow understanding across areas → draws sweeping conclusions from narrow evidence"

notes: "Aligned to 6th grade STEM PBL at UMS. Target flaw types weighted toward epistemic and completeness — common issues in early-stage student projects. Presentation roles mirror UMS team structure."
```

## Constraints

- `scenario_id`: unique, kebab-case
- `agents.count`: 3-5
- `activity`: one of `presentation`, `discussion`, `both`
- `expected_flaws[].flaw_type`: one of `reasoning`, `epistemic`, `completeness`, `coherence`
- `context.level`: one of `broad`, `project_type`, `domain`, `specific`
- All string fields are natural language — readable and editable by teachers

## Notes

- The scenario is **generated by an LLM** from a teacher's input (topic + pedagogical goals) and **revised by the teacher** before proceeding.
- Expected flaws are **predictions** about what agents will produce, not instructions to agents. They are excluded from personas.
- Agent descriptions in the scenario are sketches. Full profiles are generated in the next pipeline stage.
