# Polylogue 3

Polylogue 3 generates AI group presentations and discussions that contain critical thinking flaws. It is designed for middle school students doing project-based learning (PBL) at the University Middle School (UMS) in Memphis.

Students watch or read the generated presentation or discussion, identify the flaws, and practice evaluating critical thinking — a core skill in PBL.

---

## How It Works

You provide a PBL topic and tell the system what kinds of flaws you want students to practice identifying. The system creates a team of AI agents — each with realistic knowledge gaps and communication styles — and generates a group presentation or discussion where flaws emerge naturally from those gaps.

A separate evaluation step produces a reference list of flaws that you can compare against your students' assessments.

---

## Getting Started

### Prerequisites

- Claude Code with access to this repository
- Run `/initialize_polylogue` to sync commands and subagents

### Step 1: Create a Scenario

```
/create_scenario "What are the major threats affecting our global environment?" presentation --flaws epistemic,completeness
```

This generates a scenario with a team of agents designed backward from the flaws you specified. The system determines the appropriate number of agents and their roles based on the project context.

**Review the scenario.** Open `configs/scenarios/{scenario_id}.yaml` and revise as needed:
- Adjust agent roles and knowledge focuses
- Add or remove agents
- Change expected flaws
- Refine the context description

Run `/validate_scenario {scenario_id}` to check your changes.

### Step 2: Generate Profiles

```
/generate_profiles {scenario_id}
```

This expands each agent sketch into a detailed profile with a full knowledge profile (what they know well, where they're shallow, what they get wrong, what they miss entirely), disposition settings, and expected flaw annotations.

**Review the profiles.** Open `configs/profiles/{scenario_id}/{agent_id}.yaml` for each agent. You can:
- Change misconceptions to match what your students actually struggle with
- Adjust blind spots to target specific completeness flaws
- Tune dispositions (confidence, engagement style, expressiveness)
- Edit the reactive tendency description

Run `/validate_profile {scenario_id} {agent_id}` to check each profile.

### Step 3: Generate Personas

```
/generate_personas {scenario_id}
```

This converts profiles into the prose personas that the AI will "inhabit" during generation. Expected flaws are excluded from personas so the AI produces them naturally rather than performing them.

### Step 4: Generate Discourse

For a **presentation**:
```
/generate_presentation {scenario_id}
```

For a **discussion**:
```
/begin_discussion {scenario_id}
/continue_discussion
```

The output is stored in `registry/{scenario_id}/`.

### Step 5: Evaluate

```
/evaluate_presentation {scenario_id}
```
or
```
/evaluate_discussion {scenario_id}
```

This produces a reference assessment listing every identified flaw with its type, severity, evidence, and explanation. Use it to compare against your students' evaluations — not to show students directly.

---

## Two Activities

**Presentation** — A team delivers a prepared presentation with five sections: Introduction, Approach, Findings, Solution, Conclusion. Each agent presents the sections their role makes them responsible for. Agents don't see each other's sections during generation, so coordination gaps (contradictions, disconnects) can emerge naturally. Flaws are primarily knowledge-driven.

**Discussion** — A team discusses a PBL topic in real time, with the conversation moving through three stages: opening up, working through, and converging. A speaker-selection mechanism determines who speaks next. Flaws are both knowledge-driven (from agents' knowledge gaps) and interaction-driven (from how agents respond to each other under pressure — escalation, deflection, conformity, superficial consensus, abandonment).

---

## Roles

Roles are flexible and defined per scenario. The system determines what roles a project needs based on the context — there is no fixed role set. For presentations, project roles (e.g., Researcher, Designer, Community Liaison) naturally determine which sections each agent presents. For discussions, agents can carry their project roles or use a structured framework like de Bono's Six Thinking Hats.

The pedagogically interesting cases are mismatches: a Researcher with shallow understanding of the science, a Designer with a blind spot on feasibility. These produce natural, recognizable flaws.

---

## Flaw Types

| Type | What it is | Example |
|------|-----------|---------|
| **Reasoning** | Problems in logic — fallacies, missing premises, overgeneralization | "Our river study shows pollution is decreasing everywhere" |
| **Epistemic** | Problems in knowledge handling — overstating evidence, assumptions as facts | "Our survey proves the community wants a cleanup" (survey of 10 people) |
| **Completeness** | Problems of omission — missing stakeholders, no feasibility analysis | "Install filters on every drain" (cost? who pays? maintenance?) |
| **Coherence** | Problems in how parts fit together — contradictions, evidence-claim disconnects | Research discusses water chemistry; solution proposes a social media campaign |

---

## The Human Curation Workflow

The system is designed around two checkpoints where you review and revise:

1. **After scenario generation** — Review the team composition, roles, knowledge focuses, and expected flaws. This is where you shape what the output will look like.

2. **After profile generation** — Review detailed knowledge profiles and dispositions for each agent. This is where you fine-tune the specific misconceptions, blind spots, and communication styles.

Everything is stored as readable YAML files that you can edit directly. The system generates; you curate.

---

## Project Structure

```
docs/               Design rationale and architecture documents
specs/              Precise specifications (schemas, workflow, design principles)
configs/            Implementation artifacts (commands, subagents, schemas, scripts, glossaries)
  scenarios/        Generated scenario files (your starting point)
  profiles/         Generated agent profiles (organized by scenario)
  reference/        Glossaries — definitions for flaw types, knowledge categories, etc.
PBL/                UMS project-based learning source documents
registry/           Generated transcripts and evaluation results
```

---

## Further Reading

- `docs/agent-architecture.md` — How agents are defined and why
- `docs/discourse-layer.md` — How presentations and discussions work
- `specs/workflow.md` — The full pipeline from topic to transcript
- `specs/design-principles.md` — Core principles governing the architecture
- `specs/operationalization.md` — Complete technical reference (commands, subagents, scripts, schemas)
