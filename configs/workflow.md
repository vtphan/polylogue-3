# Workflow Reference

Operational map of the Polylogue 3 pipeline. Each stage lists what it does, what it reads, what it writes, and what subagents or scripts it uses. All paths are relative to the project root.

---

## Setup

### `/initialize_polylogue`

Syncs commands and subagents from `configs/` to `.claude/` so they are available as slash commands. Idempotent.

| | |
|---|---|
| **Reads** | `configs/*/commands/*.md`, `configs/*/subagents/*.md` |
| **Writes** | `.claude/commands/*.md`, `.claude/agents/{layer}/*.md` |

### Registry management (manual utility)

`manage_registry.py` is a standalone CLI tool for inspecting and maintaining the registry. Not called by any pipeline stage — used ad hoc by the operator.

```
python configs/system/scripts/manage_registry.py list                   # List active scenarios
python configs/system/scripts/manage_registry.py status <scenario_id>   # Detailed status
python configs/system/scripts/manage_registry.py archive <scenario_id>  # Move to registry/archive/
python configs/system/scripts/manage_registry.py clean                  # Remove broken entries
```

---

## Stage 1: Scenario

### `/create_scenario "topic" activity [options]`

Generates a scenario with agent sketches designed backward from target flaws. `activity` is required: `presentation` or `discussion`.

| | |
|---|---|
| **Arguments** | `"topic"` (required), `activity` (required: presentation or discussion) |
| **Options** | `--flaws`, `--context`, `--id` |
| **Subagent** | scenario-generator → reads `configs/reference/*.md`, `configs/scenario/schemas/scenario.schema.yaml` |
| **Writes** | `configs/scenarios/{scenario_id}.yaml` |
| **Checkpoint** | **Human reviews and revises scenario before proceeding** |

### `/validate_scenario {scenario_id}`

Schema + design constraint validation.

| | |
|---|---|
| **Reads** | `configs/scenarios/{scenario_id}.yaml`, `configs/scenario/schemas/scenario.schema.yaml` |

---

## Stage 2: Profiles

### `/generate_profiles {scenario_id}`

Expands scenario agent sketches into detailed profiles with knowledge categories, dispositions, and expected flaw annotations.

| | |
|---|---|
| **Reads** | `configs/scenarios/{scenario_id}.yaml` |
| **Subagent** | profile-generator → reads `configs/reference/*.md`, `configs/agent/schemas/profile.schema.yaml` |
| **Writes** | `configs/profiles/{scenario_id}/{agent_id}.yaml` (one per agent) |
| **Checkpoint** | **Human reviews and revises profiles before proceeding** |

### `/validate_profile {scenario_id} {agent_id}`

Schema + flaw traceability + scenario cross-validation.

| | |
|---|---|
| **Reads** | `configs/profiles/{scenario_id}/{agent_id}.yaml`, `configs/agent/schemas/profile.schema.yaml`, `configs/scenarios/{scenario_id}.yaml` |

---

## Stage 3: Personas

### `/generate_personas {scenario_id}`

Transforms profiles into second-person prose personas. Expected flaws are excluded — flaws emerge from knowledge gaps during generation.

| | |
|---|---|
| **Reads** | `configs/profiles/{scenario_id}/*.yaml`, `configs/agent/persona-template.md` |
| **Subagent** | persona-generator → reads `configs/agent/persona-template.md` |
| **Writes** | `.claude/agents/personas/{scenario_id}/{agent_id}.md` (one per agent) |

---

## Stage 4a: Presentation

### `/generate_presentation {scenario_id} [options]`

Generates sections in order. Agents are isolated — each sees only their own persona and assignment, never other sections' content.

| | |
|---|---|
| **Options** | `--sections`, `--assignment` |
| **Reads** | `configs/scenarios/{scenario_id}.yaml`, `.claude/agents/personas/{scenario_id}/*.md` |
| **Subagent** | section-generator → orchestrates per-section generation; reads `configs/reference/presentation_section_glossary.md`, `configs/presentation/schemas/presentation.schema.yaml` for context |
| **Scripts** | `build_section_input.py` (assembles persona + topic + assignment), `append_section.py` (validates against schema, appends to transcript, updates config) |
| **Writes** | `registry/{scenario_id}/config.yaml`, `registry/{scenario_id}/presentation.yaml` |

Section order: introduction → approach → findings → solution → conclusion.

---

## Stage 4b: Discussion

### `/begin_discussion {scenario_id} [options]`

Initializes discussion and generates opening turns (one per agent, round-robin).

| | |
|---|---|
| **Options** | `--selection` (responsive/round_robin), `--max_turns`, `--opening_turns` |
| **Reads** | `configs/scenarios/{scenario_id}.yaml`, `.claude/agents/personas/{scenario_id}/*.md`, `configs/reference/discussion_stage_glossary.md` (command reads directly — it orchestrates the turn loop, not a single subagent) |
| **Subagents** | stage-tracker → reads `configs/reference/discussion_stage_glossary.md` |
| **Scripts** | `build_utterance_input.py`, `append_turn.py`, `build_stage_input.py` |
| **Writes** | `registry/{scenario_id}/config.yaml`, `registry/{scenario_id}/discussion.yaml` |

### `/continue_discussion [options]`

Generates turns until a stage transition, turn limit, or convergence.

| | |
|---|---|
| **Options** | `--stages`, `--max_turns`, `--selection`, `--scenario` |
| **Reads** | `registry/{scenario_id}/config.yaml`, `registry/{scenario_id}/discussion.yaml`, `.claude/agents/personas/{scenario_id}/*.md`, `configs/reference/discussion_stage_glossary.md` (command reads directly) |
| **Subagents** | speaker-selector, stage-tracker |
| **Scripts** | `build_selector_input.py`, `build_utterance_input.py`, `append_turn.py`, `build_stage_input.py` |
| **Writes** | `registry/{scenario_id}/config.yaml`, `registry/{scenario_id}/discussion.yaml` |

Turn loop: select speaker → build utterance input → invoke persona → append turn → track stage → check exit conditions.

Discussion stages: opening_up → working_through → converging (may loop back).

---

## Stage 5: Evaluation

### `/evaluate_presentation {scenario_id}`

Two-phase evaluation: section-level flaws, then cross-section coherence flaws.

| | |
|---|---|
| **Reads** | `registry/{scenario_id}/presentation.yaml`, `configs/profiles/{scenario_id}/*.yaml` (optional) |
| **Subagent** | evaluator → reads `configs/reference/flaw_type_glossary.md`, `configs/reference/presentation_section_glossary.md`, `configs/evaluation/schemas/evaluation.schema.yaml` |
| **Scripts** | `append_evaluation.py` |
| **Writes** | `registry/{scenario_id}/presentation_evaluation.yaml` |

### `/evaluate_discussion {scenario_id}`

Two-phase evaluation: turn-level flaws, then cross-turn interaction-driven flaws.

| | |
|---|---|
| **Reads** | `registry/{scenario_id}/discussion.yaml`, `configs/profiles/{scenario_id}/*.yaml` (optional) |
| **Subagent** | evaluator → reads `configs/reference/flaw_type_glossary.md`, `configs/reference/discussion_stage_glossary.md`, `configs/evaluation/schemas/evaluation.schema.yaml` |
| **Scripts** | `append_evaluation.py` |
| **Writes** | `registry/{scenario_id}/discussion_evaluation.yaml` |

---

## Directory Map

```
configs/
├── workflow.md              ← this file
├── scenarios/               ← generated scenario YAML (data)
├── profiles/                ← generated agent profiles by scenario (data)
├── reference/               ← glossaries (single source of truth)
│   ├── flaw_type_glossary.md
│   ├── knowledge_category_glossary.md
│   ├── disposition_glossary.md
│   ├── presentation_section_glossary.md
│   └── discussion_stage_glossary.md
├── scenario/
│   ├── commands/            ← create_scenario, validate_scenario
│   ├── subagents/           ← scenario-generator
│   └── schemas/             ← scenario.schema.yaml
├── agent/
│   ├── commands/            ← generate_profiles, validate_profile, generate_personas
│   ├── subagents/           ← profile-generator, persona-generator
│   ├── schemas/             ← profile.schema.yaml
│   └── persona-template.md  ← transformation rules for profiles → personas
├── presentation/
│   ├── commands/            ← generate_presentation
│   ├── subagents/           ← section-generator
│   ├── schemas/             ← presentation.schema.yaml
│   └── scripts/             ← build_section_input.py, append_section.py
├── discussion/
│   ├── commands/            ← begin_discussion, continue_discussion
│   ├── subagents/           ← speaker-selector, stage-tracker
│   ├── schemas/             ← discussion.schema.yaml
│   └── scripts/             ← build_utterance_input.py, build_selector_input.py,
│                               build_stage_input.py, append_turn.py
├── evaluation/
│   ├── commands/            ← evaluate_presentation, evaluate_discussion
│   ├── subagents/           ← evaluator
│   ├── schemas/             ← evaluation.schema.yaml
│   └── scripts/             ← append_evaluation.py
└── system/
    ├── commands/            ← initialize_polylogue
    ├── schemas/             ← config.schema.yaml (registry state)
    └── scripts/             ← manage_registry.py, schema_utils.py

.claude/                     ← runtime (synced by /initialize_polylogue)
├── commands/                ← all slash commands
└── agents/
    ├── scenario/            ← scenario-generator
    ├── agent/               ← profile-generator, persona-generator
    ├── presentation/        ← section-generator
    ├── discussion/          ← speaker-selector, stage-tracker
    ├── evaluation/          ← evaluator
    └── personas/{scenario_id}/  ← generated persona .md files

registry/{scenario_id}/      ← generated transcripts and state
├── config.yaml              ← scenario state tracking
├── presentation.yaml        ← presentation transcript (if applicable)
├── discussion.yaml          ← discussion transcript (if applicable)
├── presentation_evaluation.yaml
└── discussion_evaluation.yaml
```

---

## Source of Truth Principle

All subagents and scripts read reference data, schemas, and templates from `configs/` at runtime. Nothing is hardcoded. If a glossary, schema, or template changes, everything downstream picks up the change automatically.

| What | Where |
|------|-------|
| Flaw types, subtypes, interaction-driven patterns | `configs/reference/flaw_type_glossary.md` |
| Knowledge categories and flaw mappings | `configs/reference/knowledge_category_glossary.md` |
| Disposition dimensions | `configs/reference/disposition_glossary.md` |
| Presentation sections | `configs/reference/presentation_section_glossary.md` |
| Discussion stages | `configs/reference/discussion_stage_glossary.md` |
| Persona transformation rules | `configs/agent/persona-template.md` |
| All enum values | `configs/*/schemas/*.schema.yaml` (via `schema_utils.py`) |
