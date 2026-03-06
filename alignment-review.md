# Polylogue 3: Alignment & Consistency Review

A cross-referencing review of docs, specs, and configs for operational, conceptual, workflow, and terminological consistency.

---

## Executive Summary

The Polylogue 3 project shows **strong overall alignment** across its three layers (docs → specs → configs). The conceptual vision in the docs is faithfully translated into specs, and the configs implement those specs with high fidelity. The terminology is used consistently, enumerated values match across schemas, and the workflow pipeline is coherently operationalized from end to end.

That said, this review identified **several inconsistencies and gaps** — mostly minor, but a few substantively worth resolving before production use.

---

## 1. Terminology Consistency

### Well-Aligned

The specs/nomenclature.md serves as a reliable single source of truth and is respected across all layers:

- **Scenario, Profile, Persona, Agent** — used consistently throughout.
- **Section vs. Stage** — correctly distinguished (presentation sections, discussion stages) everywhere.
- **Flaw types** (reasoning, epistemic, completeness, coherence) — identical across both nomenclature files, all schemas, all glossaries, all subagents.
- **Knowledge categories** (strong, shallow, misconception, blind_spot) — consistent across schemas, glossaries, and persona template.
- **Disposition dimensions** (confidence, engagement_style, expressiveness) — consistent across specs, schemas, and glossary.
- **"Phase" avoided** — the deprecated Polylogue 2 term is never used in configs or specs.

### Issues Found

**1.1 — Nomenclature: "Perspective" definition diverges between docs and specs.**

- `docs/nomenclature.md` (line 48): says "Specific perspectives TBD for Polylogue 3."
- `specs/nomenclature.md` (line 48): says "Polylogue 3 uses a single perspective: **critical thinking**. Four flaw types. No multi-perspective evaluation."

The docs version is outdated. The decision to use a single critical-thinking perspective has clearly been made (specs/evaluation.md, configs/evaluation/subagents/evaluator.md all confirm it). The docs/nomenclature should be updated to match.

**1.2 — Nomenclature: Transcript registry path notation.**

- `docs/nomenclature.md` (line 26): says Transcript is stored at `registry/{topic}/`
- `specs/nomenclature.md` (line 26): correctly says `registry/{scenario_id}/`
- All configs and workflow docs use `registry/{scenario_id}/`

The docs version should read `{scenario_id}`, not `{topic}`.

**1.3 — "Mode" vs. "Activity" usage in docs.**

The nomenclature explicitly says: *"Mode: Too system-oriented. Use Presentation, Discussion."* However, `docs/discourse-layer.md` uses "Presentation Mode" and "Discussion Mode" as section headers (lines 23, 98) and refers to "mode" throughout ("Both modes work with small groups," line 178; "two modes, different mechanics," line 17). The specs and configs avoid "mode" and use "activity" consistently. The docs should be harmonized.

---

## 2. Schema Alignment (Specs ↔ Configs)

### Well-Aligned

- **profile.schema.yaml** faithfully implements the profile schema described in specs/profile-schema.md. All required fields, enum values, and structural elements match.
- **scenario.schema.yaml** matches specs/scenario-schema.md exactly, including the agent count constraint (3–5), context level enums, and flaw_type enums.
- **evaluation.schema.yaml** matches specs/evaluation.md exactly, including all enum values for flaw_type, source, severity, and location.type.
- **presentation.schema.yaml** and **discussion.schema.yaml** match specs/transcript-schemas.md faithfully.

### Issues Found

**2.1 — Scenario schema: `agents.count` not validated against `agents.descriptions` length.**

The `scenario.schema.yaml` defines `count` with `minimum: 3, maximum: 5`, and `descriptions` as an array. However, there is no `minItems`/`maxItems` constraint on the `descriptions` array, and no cross-validation that `count` matches `descriptions.length`. The schema allows `count: 4` with 2 or 6 descriptions. The `validate_profile.md` command does cross-validation, but the schema itself doesn't enforce it.

**2.2 — Profile schema: `knowledge_profile` categories not enforced as required.**

The `profile.schema.yaml` defines the four knowledge profile categories (strong_understanding, shallow_understanding, misconceptions, blind_spots) as optional properties — none are listed under `required`. The spec says "4-8 items total across categories recommended," but a profile with zero knowledge items would pass schema validation. At minimum, the schema should require the `knowledge_profile` object to have at least one of the four categories populated.

**2.3 — Discussion schema: missing `selection` enum enforcement.**

The `discussion.schema.yaml` in the transcript schema defines `config.selection` but the schema from the agent summary doesn't show whether enum values (responsive, round_robin) are explicitly constrained. The specs/transcript-schemas.md specifies `responsive | round_robin`, so the schema should enforce this enum.

---

## 3. Workflow Pipeline Alignment

### Well-Aligned

The four-stage pipeline (Scenario → Profiles → Personas → Transcript) is described identically across:
- `specs/workflow.md` (canonical)
- `docs/agent-architecture.md` and `docs/discourse-layer.md` (rationale)
- `specs/operationalization.md` (implementation)
- All config commands (faithfully implement each stage)

The two human checkpoints (after scenario, after profiles) are consistently respected. No command generates discourse without personas being deployed first.

The metadata splitting principle — agents see content only, not system metadata — is consistently enforced across:
- `specs/workflow.md` metadata visibility table
- `specs/transcript-schemas.md` metadata visibility table
- `configs/discussion/scripts/build_utterance_input.py` (content only)
- `configs/discussion/scripts/build_selector_input.py` (content only)
- `configs/discussion/scripts/build_stage_input.py` (full metadata — correct, stage-tracker needs it)
- `configs/presentation/subagents/section-generator.md` (agent isolation enforced)
- `configs/evaluation/subagents/evaluator.md` (sees full transcript + metadata)

### Issues Found

**3.1 — Directory structure: `configs/scenarios/` vs. `configs/scenario/`.**

- `specs/workflow.md` specifies output paths as `configs/scenarios/{scenario_id}.yaml` (plural).
- `specs/operationalization.md` directory tree shows `configs/scenarios/` (plural) for scenario documents.
- However, the actual configs directory has `configs/scenario/` (singular) for the scenario-layer artifacts (commands, subagents, schemas).
- The `create_scenario.md` command should write to `configs/scenarios/{id}.yaml` (plural), but the organizational folder is `configs/scenario/` (singular).

This is actually *not* a conflict — `configs/scenario/` holds the *layer artifacts* (commands, subagents, schemas), while `configs/scenarios/` would be the *data directory* for generated scenario files. But `configs/scenarios/` doesn't exist yet — it would be created at runtime. The distinction between `scenario/` (layer artifacts) and `scenarios/` (data) should be explicitly documented to avoid confusion.

**3.2 — Similarly, `configs/profiles/` doesn't exist yet in the repo.**

The workflow specifies generated profiles go to `configs/profiles/{scenario_id}/{agent_id}.yaml`, but this directory would be created at runtime. This is fine operationally but worth noting — the repo currently contains only the infrastructure (commands, schemas, subagents) but no generated data directories.

**3.3 — Presentation role names: inconsistency between docs and scenario example.**

- `docs/discourse-layer.md` lists presentation roles as: **Framer, Researcher, Designer, Connector** (line 65-71).
- `specs/nomenclature.md` (line 25) lists: **Framer, Researcher, Designer, Connector**.
- `docs/agent-architecture.md` (line 175) lists different roles: "researcher, solution designer, community liaison, lead presenter."
- The scenario example in `specs/scenario-schema.md` uses: **Researcher, Designer, Community Liaison, Framer** — mixing the two sets.

The nomenclature defines the canonical set as Framer/Researcher/Designer/Connector. The scenario example drops "Connector" and introduces "Community Liaison." Since roles are scenario-specific assignments (not a fixed set), this may be intentional flexibility. But if so, the discourse-layer doc's table implying a fixed set of four roles is misleading. Clarify that the four listed roles are a *default template*, not the only options.

**3.4 — Connector role missing from the scenario example.**

The discourse-layer doc describes the Connector role as important: "Making the presentation cohere, linking sections together." Yet neither scenario example in the specs includes a Connector role. If the Connector is meant to handle transitions between sections, the section-generator subagent needs to know about this — currently it generates sections in isolation with no transition mechanism. Either the Connector concept needs to be operationalized (e.g., a post-generation step that produces transitions), or it should be removed from the canonical role list.

---

## 4. Conceptual Alignment (Docs ↔ Specs ↔ Configs)

### Well-Aligned

- **Knowledge-primary flaw generation** — this core design principle is consistently described in the brainstorm, agent-architecture doc, design-principles spec, and operationalized in the profile-generator, persona-generator, and evaluator subagents.
- **Backward design from flaws** — present in the brainstorm (line 166-168), agent-architecture doc (line 88), design-principles spec (principle 3), scenario-generator subagent, and profile-generator subagent.
- **Expected flaw exclusion from personas** — stated in nomenclature (both versions), persona-template spec, persona-generator subagent, and the generate_personas command. Enforced consistently.
- **Emergent behavior principle** — stated in design-principles and consistently respected: no subagent instructs personas to "perform flaws."
- **Agent isolation in presentations** — described in discourse-layer doc (line 81) and faithfully implemented in section-generator subagent and build_section_input.py.
- **Single evaluator (not multi-perspective)** — consistent across evaluation spec, evaluator subagent, and both evaluation commands.

### Issues Found

**4.1 — Brainstorm doc discusses Q&A as "a possible third mode" but this is settled elsewhere.**

- `docs/polylogue-3-brainstorm.md` (lines 88-93) treats Q&A as an open question ("Whether to build Q&A as a formal third mode or treat it as a variant…").
- `docs/discourse-layer.md` (lines 219-228) definitively settles this: "Q&A Is a Pedagogical Activity, Not a Discourse Mode."
- No Q&A appears in specs or configs.

The brainstorm is a working document so this is expected, but since other docs reference it, it could mislead a reader. Consider adding a note in the brainstorm that Q&A was decided against as a system mode.

**4.2 — Brainstorm references Polylogue 2's "disposition-sensitivity-trigger mechanism" for discussions.**

- `docs/polylogue-3-brainstorm.md` (line 57): "the disposition-sensitivity-trigger mechanism from Polylogue 2"
- But Polylogue 3 explicitly replaced sensitivities with reactive tendencies (a single qualitative description). The brainstorm's language here is misleading — it implies Polylogue 2's 18-sensitivity system carries over into discussions, but it doesn't.

**4.3 — Open questions in docs not resolved in specs.**

Several open questions posed in the docs have been silently resolved in the specs without the docs being updated:

| Open Question (docs) | Resolution (specs/configs) |
|---|---|
| "How structured should discussion stages be?" (discourse-layer, OQ #1) | Resolved: Three stages with conservative transition detection in stage-tracker subagent |
| "Role assignment mechanism?" (discourse-layer, OQ #2) | Resolved: Roles come from scenario, assigned by teacher/LLM at scenario creation |
| "Is three disposition dimensions the right number?" (agent-architecture, OQ #1) | Resolved: Three dimensions confirmed in all specs and configs |
| "Should the reactive tendency be more structured?" (agent-architecture, OQ #2) | Resolved: Remains qualitative (string), confirmed in profile schema |
| "How does this connect to evaluation?" (agent-architecture, OQ #3) | Resolved: Single critical-thinking evaluator, activity-aware, detailed in evaluation spec |

These aren't errors — open questions in working docs getting resolved in specs is the natural workflow. But updating the docs (or adding a "Resolved" note) would prevent confusion for new readers.

---

## 5. Glossary ↔ Schema ↔ Subagent Consistency

### Well-Aligned

- **Flaw type glossary** — the four types and their subtypes match the evaluator subagent's evaluation process exactly.
- **Knowledge category glossary** — the four categories and their behavioral manifestations align with how the persona template renders them.
- **Disposition glossary** — the three dimensions and their enum values match the profile schema exactly.
- **Presentation section glossary** — the five sections and their purposes match the presentation transcript schema enums.
- **Discussion stage glossary** — the three stages and their descriptions match the discussion transcript schema enums and the stage-tracker subagent's behavior.

### Issues Found

**5.1 — Flaw type glossary and evaluator: interaction-driven flaw subtypes not in the glossary.**

The evaluator subagent defines five interaction-driven flaw patterns: abandonment, superficial consensus, escalation, conformity, deflection (evaluator.md lines 137-147). The flaw type glossary mentions these briefly under "Flaw Source Classification" but doesn't define them as named subtypes under any flaw type. Since these are key evaluation targets for discussions, they should be formally defined in the glossary — mapped to their parent flaw types (e.g., abandonment → completeness or coherence; escalation → reasoning).

**5.2 — Knowledge category glossary: flaw mappings could be more precise.**

The knowledge category glossary says shallow understanding produces "epistemic/reasoning flaws" and misconception produces "epistemic/reasoning flaws." This matches the agent-architecture doc's table (lines 80-85) which gives more detailed mappings. But the glossary could benefit from the more specific mapping (e.g., shallow understanding → "overstating evidence, vague claims"; misconception → "wrong claims stated as fact, flawed reasoning from false premises"). The evaluator would benefit from this precision.

---

## 6. Script Implementation Consistency

### Well-Aligned

All Python scripts follow a consistent pattern: read YAML state from registry, construct structured input for subagents or append structured output to transcripts, validate against enum constraints.

### Issues Found

**6.1 — `build_utterance_input.py` and `build_selector_input.py` correctly implement content-only visibility.**

Both scripts strip metadata from conversation history before passing to agents/selector. This correctly implements the metadata splitting principle. Verified consistent with specs.

**6.2 — `build_stage_input.py` correctly provides full metadata to stage-tracker.**

The stage-tracker is the one component that needs to see metadata (knowledge areas, rationale, reactive tendency) to make informed stage transition assessments. This matches the specs/workflow.md metadata visibility table.

**6.3 — `append_turn.py` validates content length ≥10 chars; `append_section.py` validates ≥50 chars.**

These thresholds are implementation choices not specified in the specs. They seem reasonable but should be documented somewhere as configurable constraints.

---

## 7. Missing Items

**7.1 — No `configs/scenarios/` or `configs/profiles/` data directories.**

These would be created at runtime. Not a bug, but the repo could include empty directories with `.gitkeep` files to signal their purpose.

**7.2 — No validation script for scenarios.**

There's a `validate_profile.md` command but no corresponding `validate_scenario.md`. The `create_scenario.md` command includes validation, but there's no standalone validation for manually edited scenarios. Given the human curation workflow (teachers editing scenarios directly), a standalone validator would be useful.

**7.3 — Registry `config.yaml` schema not formally defined.**

The `registry/{scenario_id}/config.yaml` structure is described in `specs/transcript-schemas.md` but has no corresponding `.schema.yaml` file in configs. The presentation and discussion transcript schemas exist, but the config file that tracks runtime state (current_stage, total_turns, sections_completed, etc.) lacks formal validation.

---

## 8. Summary of Findings

### High Priority (Conceptual/Operational Impact)

| # | Finding | Location | Recommendation |
|---|---------|----------|----------------|
| 1.1 | Evaluation perspective: docs say "TBD", specs say "single critical thinking" | docs/nomenclature.md | Update docs to match specs |
| 3.3-3.4 | Connector role defined in docs but absent from all scenarios and not operationalized | docs/discourse-layer.md, scenario examples | Either operationalize or remove from canonical list |
| 5.1 | Interaction-driven flaw patterns not formally defined in glossary | configs/reference/flaw_type_glossary.md | Add formal definitions mapped to parent flaw types |

### Medium Priority (Consistency)

| # | Finding | Location | Recommendation |
|---|---------|----------|----------------|
| 1.2 | Transcript path: docs say `{topic}`, should be `{scenario_id}` | docs/nomenclature.md | Fix to `{scenario_id}` |
| 1.3 | Docs use "mode"; nomenclature says avoid it | docs/discourse-layer.md | Replace "mode" with "activity" or "Presentation"/"Discussion" |
| 2.1 | Scenario schema doesn't cross-validate count vs. descriptions length | scenario.schema.yaml | Add minItems/maxItems or cross-validation |
| 2.2 | Profile schema allows empty knowledge_profile | profile.schema.yaml | Add minimum requirement |
| 4.2 | Brainstorm references Polylogue 2's sensitivity-trigger mechanism as if it carries over | docs/polylogue-3-brainstorm.md | Add clarification note |
| 7.2 | No standalone scenario validation command | configs/scenario/commands/ | Add validate_scenario.md |
| 7.3 | No schema for registry config.yaml | configs/ | Add config.schema.yaml |

### Low Priority (Documentation Hygiene)

| # | Finding | Location | Recommendation |
|---|---------|----------|----------------|
| 3.1 | `scenario/` vs. `scenarios/` naming could confuse | configs/ directory structure | Document the convention |
| 4.1 | Brainstorm's Q&A discussion now settled | docs/polylogue-3-brainstorm.md | Add "Resolved" note |
| 4.3 | Open questions in docs resolved in specs | Various docs | Update with resolution notes |
| 6.3 | Content length thresholds undocumented | append scripts | Document as configurable |
| 7.1 | Runtime directories don't exist in repo | configs/ | Add .gitkeep files |

---

## Overall Assessment

Polylogue 3 is an impressively coherent design. The conceptual architecture in the docs translates cleanly through the specs into operational configs. The key design principles — knowledge-primary flaw generation, metadata splitting, agent isolation, backward design from flaws, emergent behavior — are consistently enforced at every layer. The flaw taxonomy, knowledge categories, disposition dimensions, and workflow stages use the same vocabulary and enum values throughout.

The issues identified are predominantly documentation drift (the docs layer being slightly behind the specs/configs, which is natural in an iterative design process) and a few schema strictness gaps. The one substantive architectural question is the Connector role — it's described as important in the docs but has no operational counterpart in the configs. Everything else is ready for use.
