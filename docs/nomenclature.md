# Polylogue 3: Nomenclature

Consistent vocabulary for the Polylogue 3 framework.

---

## Core Terms

| Term | What it is | Notes |
|------|-----------|-------|
| **Scenario** | The planning document that drives everything: topic, agents, expected flaws, discourse type. Created by LLM, curated by human. | Input to agent design. Not a formal spec — a readable, editable document. |
| **Profile** | An agent's full definition: context + knowledge profile + disposition + expected flaw annotations. The human-facing design artifact. | Readable and editable by teachers. |
| **Persona** | The runtime artifact (.claude/agents/ file) that the LLM uses to generate utterances. Derived from the profile but **excludes expected flaws** to avoid biasing generation. | What the LLM "inhabits" when producing utterances. |
| **Expected flaws** | Annotations on a profile predicting what flaw types the agent is likely to produce, given its knowledge gaps and disposition. Descriptive, not prescriptive. | Exist in the profile for human curators. Excluded from the persona. |
| **Agent** | An AI participant in a presentation or discussion. Defined by a profile, operationalized as a persona. | In architecture docs, "agent." In student-facing output, agents just have names. |

## Discourse Terms

| Term | What it is | Notes |
|------|-----------|-------|
| **Presentation** | A planned, linear group delivery of a PBL project. Generated section-by-section or as a whole. | Primary flaw source: knowledge-driven. |
| **Discussion** | A reactive, dynamic group exchange on a PBL topic. Generated turn-by-turn. | Flaw sources: knowledge-driven + interaction-driven. |
| **Section** | A structural unit of a presentation (Introduction, Approach, Findings, Solution, Conclusion). | Linear and planned. |
| **Stage** | A broad phase of a discussion (Opening up, Working through, Converging). | Loose and non-linear, unlike Polylogue 2's seven phases. |
| **Role** | A temporary assignment — what an agent is responsible for in a specific activity. Not part of agent identity. Defined at the scenario level as a free-form string. | Roles are flexible and scenario-specific. Project roles (e.g., Researcher, Designer) naturally carry into both presentations and discussions. Discussion roles can also use structured frameworks like Six Thinking Hats. |
| **Transcript** | The generated output of a presentation or discussion, stored in the registry. | registry/{scenario_id}/ |

## Agent Components

| Term | What it is | Notes |
|------|-----------|-------|
| **Context** | Who the agent is and what they're working on, at graduated levels of specificity (broad → project type → domain → specific). | Constrains knowledge profile, shapes disposition expression, defines what counts as a flaw. |
| **Knowledge profile** | What the agent knows and doesn't know, relative to the context. Four categories: strong understanding, shallow understanding, misconception, blind spot. | Primary driver of critical thinking flaws. Topic-specific. |
| **Disposition** | How the agent communicates: confidence, engagement style, expressiveness. Plus a qualitative reactive tendency. | Shapes how flaws are expressed; drives interaction-driven flaws in discussions. |

## Flaw Terms

| Term | What it is | Notes |
|------|-----------|-------|
| **Knowledge-driven flaw** | A flaw arising from what an agent knows or doesn't know. Exists before any interaction. | Dominant in presentations. |
| **Interaction-driven flaw** | A flaw arising from how agents respond to each other during live exchange. Emerges from the dynamic. | Present in discussions, on top of knowledge-driven flaws. |
| **Flaw type** | A category in the flaw taxonomy: Reasoning, Epistemic, Completeness, Coherence. | Taxonomy is a working draft — see brainstorm doc. |

## Evaluation Terms

| Term | What it is | Notes |
|------|-----------|-------|
| **Perspective** | An evaluative lens through which discourse is judged. | Polylogue 3 uses a single perspective: **critical thinking**. Four flaw types: reasoning, epistemic, completeness, coherence. No multi-perspective evaluation. |

## Workflow Terms

| Term | What it is | Notes |
|------|-----------|-------|
| **LLM generation** | The LLM produces scenarios, profiles, and transcripts. | Not an implementation detail — a design principle. |
| **Human curation** | A human reviews and revises LLM-generated artifacts (scenarios, profiles) before they're used. | Two checkpoints: after scenario, after profiles. |

---

## Terms We Don't Use (and Why)

| Avoided term | Why | Use instead |
|-------------|-----|-------------|
| Brief | Considered, but "scenario" better captures the role of this document as a full setup for discourse generation. | Scenario |
| Mode | Too system-oriented. Presentations and discussions are activities, not system states. | Presentation, Discussion |
| Phase | Reserved for Polylogue 2. Polylogue 3 uses "sections" (presentations) and "stages" (discussions). | Section, Stage |
| Discussant | Polylogue 2 term. Only covers discussion, not presentations. | Agent |
| Sensitivity | Polylogue 2 term for the 18-dimension trigger system. Replaced by qualitative reactive tendency. | Reactive tendency |
| Discourse type | Polylogue 2 had five (inquiry, deliberation, debate, support, casual). Not used in Polylogue 3 — the two activities (presentation, discussion) replace discourse types. | Presentation, Discussion |
