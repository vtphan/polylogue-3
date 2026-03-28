# Discussion Stage Glossary

Definitions for the three discussion stages. Referenced by stage-tracker and evaluator.

---

| Stage | What's happening | Character | Transition signals |
|-------|-----------------|-----------|-------------------|
| **Opening up** | Sharing initial ideas, putting things on the table, asking questions, reacting to the topic | Generative, exploratory, multiple directions at once | Ideas are tentative; agents are discovering each other's positions; low conflict |
| **Working through** | Building on ideas, challenging claims, identifying problems, going deeper on specific threads | Focused, reactive, sometimes tense — most content happens here | Agents engage with specific claims; pushback and elaboration; knowledge gaps become visible |
| **Converging** | Moving toward decisions, synthesizing, wrapping up | Narrowing, resolving (or failing to resolve), summarizing | Agents reference earlier points; proposals become concrete; disagreements either resolve or are acknowledged as unresolved |

## Transition Guidance

Stages are **loose** — they describe a general arc, not a strict sequence.

- A discussion may loop between Opening up and Working through multiple times.
- It may never reach Converging (if no resolution emerges).
- It may jump straight to Working through if the topic is familiar.
- Working through is typically the longest stage.

**For the stage-tracker subagent:** Look for these signals:
- **Opening up → Working through:** Agents start engaging directly with each other's specific claims rather than putting new ideas on the table.
- **Working through → Converging:** Agents start referencing earlier discussion points, proposing synthesized positions, or acknowledging what's been resolved and what hasn't.
- **Working through → Opening up (loop back):** A new subtopic or angle emerges that shifts the discussion to fresh exploration.

### Transition Threshold

Stage transitions require evidence from at least **`min_evidence_turns`** recent turns (default: **2**). This parameter is configurable in the transcript's `config.stage_transition` object. A single turn showing transition signals is never sufficient to trigger a stage change.
