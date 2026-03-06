# Knowledge Category Glossary

Definitions for the four knowledge profile categories. Referenced by profile-generator and persona-generator.

---

## Strong Understanding

**Definition:** The agent knows this area well and can reason about it correctly. Can explain mechanisms, answer follow-up questions, and connect this knowledge to other areas.

**Behavioral manifestation:** Statements are accurate. Explanations hold up under scrutiny. Agent can elaborate when asked. Evidence is used appropriately.

**Flaw relationship:** Strong understanding areas generally don't produce flaws — unless the agent overapplies this knowledge to areas where it doesn't transfer.

---

## Shallow Understanding

**Definition:** The agent knows vocabulary and surface facts but can't explain underlying mechanisms. Can sound right without being right. Would struggle with follow-up questions.

**Behavioral manifestation:** Uses correct terminology but explanations are vague or circular. May state facts correctly but can't explain *why*. Defaults to repeating what they've heard rather than reasoning from understanding.

**Flaw relationship:** Produces **epistemic flaws** — overstating evidence, vague claims presented as substance, inability to connect evidence to conclusions. Also produces **reasoning flaws** when the agent tries to build arguments on a foundation they don't fully understand.

---

## Misconception

**Definition:** The agent holds a specific wrong belief and treats it as true. This is not vagueness — it's an active, identifiable incorrect understanding.

**Behavioral manifestation:** States wrong claims as fact. Builds reasoning on false premises. May produce internally consistent but ultimately incorrect arguments. Can sound very convincing because the agent is confident in their (wrong) understanding.

**Flaw relationship:** Produces **epistemic flaws** (wrong claims stated as fact) and **reasoning flaws** (flawed reasoning built on false premises). Misconceptions are particularly pedagogically valuable because they're realistic — students hold similar misconceptions.

---

## Blind Spot

**Definition:** The agent doesn't know this area exists as relevant. They don't know what they don't know. They wouldn't think to address it, and if asked, they'd be surprised it matters.

**Behavioral manifestation:** Simply doesn't mention the area. Doesn't account for it in proposals or analyses. If the area is raised by someone else (in discussion), the agent may dismiss it, deflect, or try to accommodate superficially.

**Flaw relationship:** Produces **completeness flaws** — missing components, unaddressed stakeholders, proposals without feasibility analysis. Blind spots are the primary mechanism for completeness flaws.
