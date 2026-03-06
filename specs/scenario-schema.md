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

activity: presentation | discussion

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

## Example: Discussion Activity

```yaml
scenario_id: "7th-stem-sensory-discussion"
created_at: "2026-03-05T11:00:00Z"

topic:
  driving_question: "How do our senses influence our actions and decisions, both now and in the future?"
  domain: "sensory science and design"
  description: "Team is designing a sensory-based product (a calming room for the school counselor's office). During a working session, they discuss what sensory inputs to use and how to justify their design choices with evidence."

context:
  level: specific
  description: "7th grade students working on a STEM project about how senses influence behavior, designing a calming sensory room for the school counselor's office."

activity: discussion

agents:
  count: 4
  descriptions:
    - name: "Zara"
      role: Proposer
      knowledge_focus: "Strong on visual and auditory sensory inputs. Misconception: believes calming colors work the same for everyone. Blind spot: individual differences in sensory processing."
      disposition_sketch: "High confidence, competitive engagement, expressive."
      expected_flaws:
        - flaw: "Asserts universal color effects without acknowledging individual variation"
          flaw_type: epistemic
          mechanism: "Misconception about color universality + high confidence → stated as fact"
        - flaw: "Dismisses alternative design approaches without engaging with them"
          flaw_type: reasoning
          mechanism: "Competitive engagement → defends own ideas rather than considering alternatives"

    - name: "Marcus"
      role: Questioner
      knowledge_focus: "Strong on experimental method from class. Shallow on the actual sensory science. Blind spot: practical constraints of building in a real school."
      disposition_sketch: "Moderate confidence, collaborative, restrained and data-focused."
      expected_flaws:
        - flaw: "Asks good methodological questions but can't evaluate the answers substantively"
          flaw_type: epistemic
          mechanism: "Shallow sensory science → can ask 'what's the evidence?' but can't judge if the evidence is good"
        - flaw: "Proposes experimental designs that ignore practical constraints"
          flaw_type: completeness
          mechanism: "Blind spot on practical constraints → designs experiments that can't be run in a school"

    - name: "Priya"
      role: Builder
      knowledge_focus: "Strong on the connection between smell and memory (studied this in class). Misconception: extrapolates from smell to all senses (thinks all senses trigger memory the same way). Shallow on statistical reasoning."
      disposition_sketch: "Moderate confidence, collaborative, expressive and story-driven."
      expected_flaws:
        - flaw: "Overgeneralizes from smell research to all senses"
          flaw_type: reasoning
          mechanism: "Misconception about sensory equivalence → applies smell findings universally"
        - flaw: "Uses personal anecdotes as primary evidence"
          flaw_type: epistemic
          mechanism: "Expressive + shallow stats → defaults to stories over data"

    - name: "Tomas"
      role: Critic
      knowledge_focus: "Strong on the idea that design should be evidence-based. Shallow on what counts as good evidence in sensory science. Blind spot: doesn't consider that some design choices are value-based, not just evidence-based."
      disposition_sketch: "High confidence, competitive, restrained and analytical."
      expected_flaws:
        - flaw: "Rejects design ideas that are reasonable but not backed by peer-reviewed studies"
          flaw_type: reasoning
          mechanism: "Shallow understanding of evidence types → applies an unreasonably high bar"
        - flaw: "Treats aesthetic and comfort preferences as 'unscientific' without recognizing their legitimacy"
          flaw_type: completeness
          mechanism: "Blind spot on value-based reasoning → entire dimension of design excluded"

notes: "Aligned to 7th grade STEM PBL at UMS. Discussion roles assigned (proposer, questioner, builder, critic) to structure participation. Target flaw types include reasoning and epistemic — common in group work sessions where students are building on partial knowledge. Interaction-driven flaws expected: Zara's competitiveness may trigger Tomas's critical stance, producing an escalation dynamic that crowds out Priya and Marcus."
```

## Constraints

- `scenario_id`: unique, kebab-case
- `agents.count`: 3-5
- `activity`: one of `presentation`, `discussion`
- `expected_flaws[].flaw_type`: one of `reasoning`, `epistemic`, `completeness`, `coherence`
- `context.level`: one of `broad`, `project_type`, `domain`, `specific`
- All string fields are natural language — readable and editable by teachers

## Notes

- The scenario is **generated by an LLM** from a teacher's input (topic + pedagogical goals) and **revised by the teacher** before proceeding.
- Expected flaws are **predictions** about what agents will produce, not instructions to agents. They are excluded from personas.
- Agent descriptions in the scenario are sketches. Full profiles are generated in the next pipeline stage.
