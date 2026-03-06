# Operationalization

How Polylogue 3 is implemented using Claude Code: commands, subagents, scripts, schemas, and directory structure.

Claude Code is the main orchestrating agent. It executes slash commands, delegates to subagents, runs scripts, and manages registry state.

---

## Directory Structure

### Design-Time (version-controlled in `configs/`)

```
configs/
├── scenarios/                          # Scenario documents
│   └── {scenario_id}.yaml
│
├── profiles/                           # Agent profiles organized by scenario
│   └── {scenario_id}/
│       └── {agent_id}.yaml
│
├── reference/                          # Glossaries — single source of truth
│   ├── flaw_type_glossary.md          # Reasoning, epistemic, completeness, coherence
│   ├── knowledge_category_glossary.md # Strong, shallow, misconception, blind spot
│   ├── disposition_glossary.md        # Confidence, engagement style, expressiveness
│   ├── presentation_section_glossary.md  # Introduction, approach, findings, solution, conclusion
│   └── discussion_stage_glossary.md   # Opening up, working through, converging
│
├── scenario/                           # Scenario-layer artifacts
│   ├── commands/
│   │   └── create_scenario.md
│   ├── subagents/
│   │   └── scenario-generator.md      # Generates scenarios from teacher input
│   └── schemas/
│       └── scenario.schema.yaml
│
├── agent/                              # Agent-layer artifacts
│   ├── commands/
│   │   ├── generate_profiles.md       # Generates profiles from approved scenario
│   │   ├── generate_personas.md       # Transforms profiles into personas
│   │   └── validate_profile.md        # Validates profile against schema
│   ├── subagents/
│   │   ├── profile-generator.md       # Generates profiles from scenario
│   │   └── persona-generator.md       # Transforms profiles to personas
│   └── schemas/
│       └── profile.schema.yaml
│
├── presentation/                       # Presentation-layer artifacts
│   ├── commands/
│   │   └── generate_presentation.md   # Generates a full presentation
│   ├── subagents/
│   │   └── section-generator.md       # Orchestrates section-by-section generation
│   ├── schemas/
│   │   └── presentation.schema.yaml   # Transcript schema
│   └── scripts/
│       ├── build_section_input.py     # Builds input for each section's agent
│       └── append_section.py          # Appends section to presentation transcript
│
├── discussion/                         # Discussion-layer artifacts
│   ├── commands/
│   │   ├── begin_discussion.md        # Starts a new discussion
│   │   └── continue_discussion.md     # Generates next turn(s)
│   ├── subagents/
│   │   ├── speaker-selector.md        # Picks next speaker
│   │   └── stage-tracker.md           # Detects stage transitions
│   ├── schemas/
│   │   └── discussion.schema.yaml     # Transcript schema
│   └── scripts/
│       ├── build_utterance_input.py   # Builds input for discussant
│       ├── build_selector_input.py    # Builds input for speaker selector
│       ├── build_stage_input.py       # Builds input for stage tracker
│       └── append_turn.py            # Appends turn to discussion transcript
│
├── evaluation/                         # Evaluation-layer artifacts (TBD)
│   ├── commands/
│   │   ├── evaluate_presentation.md
│   │   └── evaluate_discussion.md
│   ├── evaluators/
│   │   ├── profiles/                  # Evaluator profiles
│   │   └── subagents/                 # Evaluator personas
│   ├── schemas/
│   │   └── evaluation.schema.yaml
│   └── scripts/
│       └── append_evaluation.py
│
└── system/                             # System-level artifacts
    └── commands/
        └── initialize_polylogue.md    # Syncs configs/ to .claude/
```

### Runtime (synced to `.claude/` by `/initialize_polylogue`)

```
.claude/
├── agents/
│   ├── scenario/
│   │   └── scenario-generator.md
│   ├── agent/
│   │   ├── profile-generator.md
│   │   └── persona-generator.md
│   ├── presentation/
│   │   └── section-generator.md
│   ├── discussion/
│   │   ├── speaker-selector.md
│   │   └── stage-tracker.md
│   ├── evaluation/
│   │   └── {evaluator_id}.md
│   └── personas/                       # Generated personas (per scenario)
│       └── {scenario_id}/
│           └── {agent_id}.md
│
└── commands/
    ├── create_scenario.md
    ├── generate_profiles.md
    ├── generate_personas.md
    ├── validate_profile.md
    ├── generate_presentation.md
    ├── begin_discussion.md
    ├── continue_discussion.md
    ├── evaluate_presentation.md
    ├── evaluate_discussion.md
    └── initialize_polylogue.md
```

### State (in `registry/`)

```
registry/
└── {scenario_id}/
    ├── config.yaml                    # Scenario metadata, current state
    ├── presentation.yaml              # Presentation transcript (if applicable)
    └── discussion.yaml                # Discussion transcript (if applicable)
```

---

## Commands

### System

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/initialize_polylogue` | Sync all commands and subagents from `configs/` to `.claude/` | — | Commands and subagents deployed |

Run after cloning, after creating/modifying agents, or after changing any config.

### Scenario Layer

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/create_scenario` | Generate a scenario from teacher input | Topic, activity type, pedagogical goals (natural language) | `configs/scenarios/{id}.yaml` |

**Workflow:** Teacher provides natural language input → LLM (via scenario-generator subagent) produces scenario YAML → teacher reviews and manually revises → scenario is approved.

### Agent Layer

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/generate_profiles` | Generate agent profiles from an approved scenario | `{scenario_id}` | `configs/profiles/{id}/{agent}.yaml` (one per agent) |
| `/validate_profile` | Validate a profile against schema | `{scenario_id} {agent_id}` | Validation report |
| `/generate_personas` | Transform approved profiles into personas | `{scenario_id}` | `.claude/agents/personas/{id}/{agent}.md` |

**Workflow:** `/generate_profiles` → teacher reviews and revises profiles → `/generate_personas` → personas deployed for discourse generation.

### Presentation Layer

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/generate_presentation` | Generate a full presentation | `{scenario_id}` | `registry/{id}/presentation.yaml` |

**Process:** Reads scenario (for topic, roles, section assignments) and personas. Generates sections in order. Each section's agent receives: their persona, the topic, their assigned section, and (optionally) a brief on the team's overall direction — but NOT other sections' content (to enable coordination gaps). Output appended section by section to transcript.

### Discussion Layer

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/begin_discussion` | Start a new discussion | `{scenario_id} [options]` | `registry/{id}/discussion.yaml` (initialized) |
| `/continue_discussion` | Generate next turns until stage transition | `[stages=N] [max_turns=N] [selection=responsive\|round_robin]` | Turns appended to `discussion.yaml` |

**Process per turn (inside `/continue_discussion`):**
1. `build_selector_input.py` → speaker-selector subagent → next speaker
2. `build_utterance_input.py` → persona subagent → utterance + metadata
3. `append_turn.py` → append to `registry/{id}/discussion.yaml`
4. `build_stage_input.py` → stage-tracker subagent → stage changed?
5. If stage changed, update config. Exit if stage count reached or converging completed.

This mirrors Polylogue 2's continue_conversation loop, adapted for stages instead of phases.

### Evaluation Layer (TBD)

| Command | Purpose | Input | Output |
|---------|---------|-------|--------|
| `/evaluate_presentation` | Evaluate a presentation transcript | `{scenario_id} [evaluator_ids]` | `registry/{id}/presentation_evaluation.yaml` |
| `/evaluate_discussion` | Evaluate a discussion transcript | `{scenario_id} [evaluator_ids]` | `registry/{id}/discussion_evaluation.yaml` |

Evaluation layer needs further design — perspectives, criteria, and evaluator profiles for Polylogue 3's broader flaw taxonomy.

---

## Subagents

### Orchestration Subagents

These are system-level agents that Claude Code delegates to. They are NOT presenting/discussing agents.

| Subagent | Layer | Purpose | Input | Output |
|----------|-------|---------|-------|--------|
| **scenario-generator** | Scenario | Generates scenario YAML from teacher input | Topic, goals, constraints (natural language) | Scenario YAML |
| **profile-generator** | Agent | Generates profiles from scenario | Approved scenario | Profile YAML (one per agent) |
| **persona-generator** | Agent | Transforms profile into persona markdown | Profile YAML | Persona markdown (second-person prose) |
| **section-generator** | Presentation | Orchestrates section-by-section generation | Scenario + personas + section assignment | Section content + metadata |
| **speaker-selector** | Discussion | Picks next speaker | Available speakers, last speaker, conversation history (content only) | Next speaker + rationale |
| **stage-tracker** | Discussion | Detects stage transitions | Conversation history (with metadata), current stage | Current stage, stage_changed, rationale |

### Presenting/Discussing Agents (Personas)

These are the agents that generate actual discourse content. Each is a persona markdown file generated from a profile. They live in `.claude/agents/personas/{scenario_id}/`.

A persona receives:
- Their character prompt (the persona file itself)
- Topic and context
- Activity-specific input (section assignment for presentations; conversation history for discussions)

A persona produces:
- Content (utterance or section text)
- Metadata (knowledge areas engaged, rationale, reactive tendency activated)

### Evaluator Agents

Evaluator agents assess generated transcripts from specific perspectives. Design TBD — needs to account for the broader flaw taxonomy (reasoning, epistemic, completeness, coherence) and both activity types.

---

## Scripts

Scripts mediate between registry state and subagent inputs/outputs. They enforce structure.

### Presentation Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `build_section_input.py` | Build input for a section's agent | Scenario config, persona, section assignment | Structured YAML input |
| `append_section.py` | Append section to transcript | Section content + metadata (JSON) | Updated `presentation.yaml` |

### Discussion Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `build_utterance_input.py` | Build input for discussant | Config, conversation history | YAML: topic, context, history (content only) |
| `build_selector_input.py` | Build input for speaker selector | Config, conversation history, personas | YAML: speakers, last_speaker, history |
| `build_stage_input.py` | Build input for stage tracker | Config, conversation history | YAML: current_stage, history (with metadata) |
| `append_turn.py` | Append turn to transcript | Turn content + metadata (JSON) | Updated `discussion.yaml` |

### System Scripts

| Script | Purpose |
|--------|---------|
| `manage_registry.py` | Archive completed sessions, manage registry state |

---

## Schemas

Schemas constrain YAML documents to ensure consistency. Enumerated values are enforced.

| Schema | Constrains | Key enums |
|--------|-----------|-----------|
| `scenario.schema.yaml` | Scenario documents | `activity`: presentation, discussion. `flaw_type`: reasoning, epistemic, completeness, coherence. `context.level`: broad, project_type, domain, specific |
| `profile.schema.yaml` | Agent profiles | `confidence`: low, moderate, high. `engagement_style`: collaborative, moderate, competitive. `expressiveness`: restrained, moderate, expressive. `knowledge category`: strong, shallow, misconception, blind_spot |
| `presentation.schema.yaml` | Presentation transcripts | `section`: introduction, approach, findings, solution, conclusion |
| `discussion.schema.yaml` | Discussion transcripts | `stage`: opening_up, working_through, converging |
| `evaluation.schema.yaml` | Evaluation results (TBD) | `flaw_type`, `valence`, `confidence` |

---

## Glossaries

Glossaries are reference documents that subagents consult for consistent interpretation. Stored in `configs/reference/`.

| Glossary | Purpose | Referenced by |
|----------|---------|--------------|
| `flaw_type_glossary.md` | Defines reasoning, epistemic, completeness, coherence flaws with examples | Evaluator subagents, scenario-generator |
| `knowledge_category_glossary.md` | Defines strong, shallow, misconception, blind spot with behavioral manifestations | Profile-generator, persona-generator |
| `disposition_glossary.md` | Defines confidence, engagement style, expressiveness with behavioral descriptions | Profile-generator, persona-generator |
| `presentation_section_glossary.md` | Defines each presentation section: purpose, expected content, common flaw locations | Section-generator, evaluators |
| `discussion_stage_glossary.md` | Defines each discussion stage: character, transitions, what to look for | Stage-tracker, evaluators |

---

## Metadata Flow

What each component sees and produces:

| Component | Sees | Produces |
|-----------|------|----------|
| **Persona (presenting)** | Own persona, topic, section assignment | Section content + metadata (knowledge areas, rationale) |
| **Persona (discussing)** | Own persona, topic, conversation history (content only) | Utterance + metadata (knowledge areas, rationale, reactive tendency) |
| **Speaker-selector** | Speaker descriptions, last speaker, history (content only) | Next speaker + rationale |
| **Stage-tracker** | Current stage, history (with metadata) | Stage, stage_changed, rationale |
| **Section-generator** | Scenario, all personas, section assignments | Orchestrates section generation |
| **Evaluator** | Transcript (content + metadata), flaw glossary | Evaluation (flaw type, category, rationale) |

---

## Typical Workflow: End to End

```
Teacher: "I want a presentation scenario for 6th grade ecosystem project,
          focusing on completeness and epistemic flaws"

/create_scenario
  → scenario-generator produces configs/scenarios/6th-stem-ecosystems.yaml
  → Teacher reviews, revises agent sketches, approves

/generate_profiles 6th-stem-ecosystems
  → profile-generator produces configs/profiles/6th-stem-ecosystems/{kenji,amara,diego,lily}.yaml
  → Teacher reviews knowledge profiles, adjusts misconceptions, approves

/generate_personas 6th-stem-ecosystems
  → persona-generator produces .claude/agents/personas/6th-stem-ecosystems/{kenji,amara,diego,lily}.md
  → (Expected flaws excluded from personas)

/generate_presentation 6th-stem-ecosystems
  → section-generator orchestrates:
     Lily (Framer) → Introduction
     Amara (Designer) → Approach
     Kenji (Researcher) → Findings
     Amara (Designer) → Solution
     Lily (Framer) → Conclusion
  → Output: registry/6th-stem-ecosystems/presentation.yaml

  → Students evaluate the presentation, identify flaws, conduct Q&A activities

/evaluate_presentation 6th-stem-ecosystems
  → Evaluator agents assess transcript against flaw taxonomy
  → Output: registry/6th-stem-ecosystems/presentation_evaluation.yaml
  → Teacher compares student evaluations against AI evaluations
```

```
Teacher: "Now generate a discussion for the same team, same topic"

/begin_discussion 6th-stem-ecosystems
  → Initializes registry/6th-stem-ecosystems/discussion.yaml

/continue_discussion
  → Turn-by-turn generation loop (select → utter → append → track stage)
  → Repeat until converging or teacher stops

/evaluate_discussion 6th-stem-ecosystems
  → Output: registry/6th-stem-ecosystems/discussion_evaluation.yaml
```
