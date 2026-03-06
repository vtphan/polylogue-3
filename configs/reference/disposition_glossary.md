# Disposition Glossary

Definitions for the three disposition dimensions and reactive tendency. Referenced by profile-generator and persona-generator.

---

## Confidence

How certain the agent sounds when making claims.

| Value | Description | Effect on flaw expression |
|-------|------------|--------------------------|
| **Low** | Hedging, tentative, qualifies claims, uses "maybe" and "I think" | Knowledge gaps expressed cautiously — harder for evaluators to catch because claims are hedged |
| **Moderate** | Balanced — states things clearly but acknowledges uncertainty when appropriate | Knowledge gaps expressed naturally |
| **High** | Assertive, definitive, states things as certain | Knowledge gaps expressed confidently — sounds right even when wrong; misconceptions are more convincing |

---

## Engagement Style

How the agent interacts with others' ideas, especially under disagreement.

| Value | Description | Effect on interaction-driven flaws |
|-------|------------|-----------------------------------|
| **Collaborative** | Builds on others' ideas, seeks agreement, defers to group consensus | May concede valid points too easily under social pressure; may produce superficial agreement |
| **Moderate** | Engages constructively, willing to disagree but not combative | Balanced interaction dynamics |
| **Competitive** | Challenges others, defends own position, debates | May double down when challenged, dismiss alternatives, escalate conflict |

---

## Expressiveness

What kind of evidence and framing the agent gravitates toward.

| Value | Description | Effect on flaw expression |
|-------|------------|--------------------------|
| **Restrained** | Data-focused, analytical, precise, prefers numbers and studies | May reject valid qualitative evidence; flaws tend to be dry and harder to spot |
| **Moderate** | Mixes data and narrative appropriately | Balanced expression |
| **Expressive** | Story-driven, uses examples and personal observations, emotional | May over-rely on anecdotes; flaws tend to be engaging and persuasive, making them harder to catch |

---

## Reactive Tendency

A qualitative description of how the agent responds when challenged, disagreed with, or put under pressure. Unlike the three dimensions above, this is not an enumerated value — it's a natural language description specific to each agent.

**Purpose:** Drives interaction-driven flaws in discussions. When an agent is challenged, their reactive tendency determines whether they escalate, deflect, accommodate, or redirect.

**Examples:**
- "When challenged, doubles down with more confidence and repeats the claim more forcefully"
- "When disagreed with, shifts to personal stories rather than addressing the argument"
- "When criticized, concedes quickly — even when their original point was valid"
- "When pressed for details, changes the subject to an area where they feel more confident"

**Guideline:** Keep reactive tendencies to 1-2 sentences. They should be specific enough to produce consistent behavior but flexible enough for the LLM to interpret naturally across different conversational situations.
