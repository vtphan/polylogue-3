# CLAUDE.md — Polylogue 3

Polylogue 3 generates AI group presentations and discussions containing critical thinking flaws, for middle school students in project-based learning (PBL) to practice evaluating. It is designed for use at the University Middle School (UMS) in Memphis.

---

## System Purpose

Teachers provide a PBL topic and pedagogical goals. The system generates a team of AI agents with intentional knowledge gaps, then produces a group presentation or discussion where critical thinking flaws emerge naturally from those gaps. Students evaluate the output, identifying flaws. A separate evaluation layer produces a reference assessment for the teacher.

---

## Core Design Principles

1. **Knowledge-primary flaw generation.** Flaws come from what agents know and don't know — not from scripts or instructions. Knowledge profiles are the primary flaw driver; dispositions shape expression.

2. **Backward design from flaws.** Start with what flaws students should practice identifying, then create agents whose knowledge gaps produce those flaws.

3. **Emergent behavior.** Expected flaws are predictions, not instructions. Personas never contain expected flaws. The architecture creates conditions for flaws to surface naturally.

4. **Metadata splitting.** Agents see only conversation content and their own persona. System metadata (expected flaws, stage tracking, knowledge area annotations) is hidden from agents but preserved for orchestration and evaluation.

5. **Agent isolation in presentations.** Each agent generates their section without seeing other agents' sections. This allows coherence flaws (contradictions, disconnects) to emerge naturally.

6. **LLM generation with human curation.** LLMs generate; humans curate. Two checkpoints: after scenario, after profiles. No discourse is generated until both are approved.

---

## Directory Organization

The project has five top-level directories, each with a distinct role:

| Directory | Role | Used by |
|-----------|------|---------|
| `docs/` | Design documents — ideas, concepts, architecture notes | Humans (not read by the pipeline) |
| `specs/` | Specifications — concise design-time references | Humans (not read by the pipeline) |
| `configs/` | Operational artifacts — commands, subagents, schemas, scripts, glossaries, templates | Claude Code (the orchestration agent) |
| `.claude/` | Runtime artifacts — commands and subagents copied from `configs/` | Claude Code (slash commands and subagent invocations) |
| `registry/` | Runtime outputs — generated transcripts, state tracking, evaluations | Pipeline stages (read/write) |

**Single source of truth:** All subagents and scripts read reference data, schemas, and templates from `configs/` at runtime. Nothing is hardcoded. `docs/` and `specs/` are never read by the pipeline.

**Flow:** `configs/` → `.claude/` (via `/initialize_polylogue`) → `registry/` (via pipeline stages).

### Directory Structure

```
configs/
├── scenarios/           # Generated scenario YAML files (data)
├── profiles/            # Generated agent profiles by scenario (data)
├── reference/           # Glossaries — single source of truth
├── scenario/            # Scenario-layer artifacts (commands, subagents, schemas)
├── agent/               # Agent-layer artifacts
├── presentation/        # Presentation-layer artifacts
├── discussion/          # Discussion-layer artifacts
├── evaluation/          # Evaluation-layer artifacts
└── system/              # System-level artifacts

.claude/commands/                        # Slash commands (synced from configs/)
.claude/agents/{layer}/                  # Subagents (synced from configs/)
.claude/agents/personas/{scenario_id}/   # Deployed persona files (generated)

registry/{scenario_id}/                  # Generated transcripts and state
```

Convention: plural directories (`scenarios/`, `profiles/`) hold generated data. Singular directories (`scenario/`, `agent/`, etc.) hold layer artifacts.

See `configs/workflow.md` for the full operational map of each pipeline stage.

---

## Pipeline

### Bootstrap

`/initialize_polylogue` copies commands and subagents from `configs/` to `.claude/`. Since it is itself a command, it must be manually copied first:

```
cp configs/system/commands/initialize_polylogue.md .claude/commands/
```

After that, run `/initialize_polylogue` to sync everything else. This only needs to happen once (or after adding new commands/subagents to `configs/`).

### Stages

```
/create_scenario → /generate_profiles → /generate_personas → /generate_presentation or /begin_discussion
                                                            → /evaluate_presentation or /evaluate_discussion
```

| Stage | Command | Output | Human Checkpoint |
|-------|---------|--------|-----------------|
| Scenario | `/create_scenario` | `configs/scenarios/{id}.yaml` | Yes |
| Profiles | `/generate_profiles {id}` | `configs/profiles/{id}/{agent}.yaml` | Yes |
| Personas | `/generate_personas {id}` | `.claude/agents/personas/{id}/{agent}.md` | Optional |
| Presentation | `/generate_presentation {id}` | `registry/{id}/presentation.yaml` | — |
| Discussion | `/begin_discussion {id}`, `/continue_discussion` | `registry/{id}/discussion.yaml` | — |
| Evaluation | `/evaluate_presentation {id}` or `/evaluate_discussion {id}` | `registry/{id}/*_evaluation.yaml` | — |

---

## Key Concepts

**Agent = Context + Knowledge Profile + Disposition**

- **Knowledge profile**: 4 categories — strong understanding, shallow understanding, misconception, blind spot. Primary flaw driver.
- **Disposition**: 3 dimensions — confidence (low/moderate/high), engagement style (collaborative/moderate/competitive), expressiveness (restrained/moderate/expressive). Plus a qualitative reactive tendency.
- **Roles**: Flexible, scenario-specific. Defined as free-form strings. No fixed role set. Six Thinking Hats is one available framework for discussions.

**Flaw taxonomy**: 4 types — reasoning, epistemic, completeness, coherence. Classified by source (knowledge-driven or interaction-driven) and severity (minor/moderate/major).

**Activities**: Presentation (linear, section-by-section) and Discussion (dynamic, turn-by-turn with stage tracking: opening_up → working_through → converging).

---

## Reference Glossaries

Always consult these when generating or evaluating:

| Glossary | Path | Purpose |
|----------|------|---------|
| Flaw types | `configs/reference/flaw_type_glossary.md` | Defines all 4 flaw types, subtypes, and interaction-driven patterns |
| Knowledge categories | `configs/reference/knowledge_category_glossary.md` | Defines 4 knowledge categories and their flaw mappings |
| Dispositions | `configs/reference/disposition_glossary.md` | Defines 3 disposition dimensions |
| Presentation sections | `configs/reference/presentation_section_glossary.md` | Defines 5 presentation sections |
| Discussion stages | `configs/reference/discussion_stage_glossary.md` | Defines 3 discussion stages |

---

## Metadata Visibility

| Data | Agents see it? | Orchestration sees it? | Evaluator sees it? |
|------|---------------|----------------------|-------------------|
| Conversation content | Yes | Yes | Yes |
| Agent's own persona | Yes | No | No |
| Other agents' personas | No | No | No |
| Expected flaws | No | No | Yes |
| Turn metadata (knowledge areas, rationale) | No | Yes | Yes |
| Stage/section tracking | No | Yes | Yes |

---

## Context: PBL at UMS

University Middle School serves grades 6–8 in Memphis. Students do semester-long PBL projects (STEM and Humanities) culminating in public presentations at the STRIPES Showcase. Groups of ~5 students work with driving questions like "What are the major threats affecting our global environment?" (6th STEM) or "How do our senses influence our actions and decisions?" (7th STEM). See the `PBL/` folder for detailed project documents.
