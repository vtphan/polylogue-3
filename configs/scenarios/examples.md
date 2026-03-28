# Example /create_scenario Prompts

Ready-to-use prompts for generating scenarios. Each is grounded in a real UMS PBL driving question. The quoted topic represents the kind of specific investigation a student group would choose within the broader project.

---

## 6th Grade STEM

**Driving question:** What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?

```
/create_scenario "How does plastic pollution in the Mississippi River affect local fish populations, and what can Memphis communities do to reduce it?" presentation --grade 6 --context "6th grade STEM PBL. Driving question: What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems? This group chose to focus on plastic pollution in the Mississippi River near Memphis. They are researching how microplastics enter the food chain, what species are affected, and what local cleanup or policy efforts exist. Final product is a digital presentation at the STRIPES Showcase." --flaws reasoning,completeness
```

```
/create_scenario "What causes urban heat islands in Memphis, and how can green infrastructure reduce their impact on local communities?" discussion --grade 6 --context "6th grade STEM PBL. Driving question: What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems? This group is investigating why some Memphis neighborhoods are significantly hotter than others, how tree cover and pavement affect temperature, and what green infrastructure solutions (green roofs, urban forests, reflective surfaces) could help. They are preparing to discuss findings before building their final presentation." --flaws epistemic,reasoning
```

```
/create_scenario "How do invasive species disrupt native ecosystems in the southeastern United States, and what can be done to control them?" presentation --grade 6 --context "6th grade STEM PBL. Driving question: What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems? This group is researching invasive species such as kudzu, Asian carp, and fire ants in the Memphis region. They are examining how these species outcompete natives, what ecological and economic damage they cause, and what control methods exist. Final product is a digital presentation and escape room." --flaws completeness,coherence
```

---

## 6th Grade Humanities

**Driving question:** How do the choices and roles of small communities impact the overall culture of a larger society?

```
/create_scenario "How did the Memphis sanitation workers' strike of 1968 change labor rights and civil rights for the entire country?" presentation --grade 6 --context "6th grade Humanities PBL. Driving question: How do the choices and roles of small communities impact the overall culture of a larger society? This group is investigating the 1968 Memphis sanitation workers' strike, examining working conditions, the role of community organizing, Dr. King's involvement, and the lasting impact on national labor and civil rights policy. Final product is a group presentation at the STRIPES Showcase." --flaws epistemic,completeness
```

```
/create_scenario "How does the food culture of Memphis barbecue reflect the blending of African American, Southern, and immigrant traditions?" discussion --grade 6 --context "6th grade Humanities PBL. Driving question: How do the choices and roles of small communities impact the overall culture of a larger society? This group is exploring how Memphis barbecue traditions emerged from African American, Southern, and immigrant cooking practices, and how a local food culture became nationally significant. They are examining specific restaurants, techniques, and cultural events. The group is discussing their research findings before creating their final product." --flaws reasoning,epistemic
```

---

## 7th Grade STEM

**Driving question:** How do our senses influence our actions and decisions, both now and in the future?

```
/create_scenario "How does background music affect concentration and test performance in middle school students?" presentation --grade 7 --context "7th grade STEM PBL. Driving question: How do our senses influence our actions and decisions, both now and in the future? This group is investigating how auditory input (background music, silence, white noise) affects cognitive performance. They designed an experiment testing classmates' performance on memory and math tasks under different sound conditions. They collected data on accuracy and speed and are presenting their findings, including proportional analysis of results. Final product is a digital presentation or prototype of a study environment." --flaws reasoning,completeness
```

```
/create_scenario "How can hospital waiting rooms be redesigned using sensory inputs to reduce patient anxiety?" discussion --grade 7 --context "7th grade STEM PBL. Driving question: How do our senses influence our actions and decisions, both now and in the future? This group is designing a sensory environment for a hospital waiting room that uses lighting, sound, scent, and texture to reduce anxiety. They researched how different sensory inputs trigger calming vs. stress responses and are now discussing their prototype design. A nursing professor visited their class to talk about sensory design in healthcare settings." --flaws epistemic,coherence
```

```
/create_scenario "Why do optical illusions trick our brains, and can we design new ones that exploit specific visual processing weaknesses?" presentation --grade 7 --context "7th grade STEM PBL. Driving question: How do our senses influence our actions and decisions, both now and in the future? This group is investigating how the visual system processes information and where it makes predictable errors. They studied classic optical illusions, learned about how the brain fills in gaps and makes assumptions, and are designing their own illusions. They tested their designs on classmates and collected data on what percentage of people were fooled. Final product includes a presentation of findings and a prototype illusion exhibit." --flaws reasoning,epistemic
```

---

## 7th Grade Humanities

**Driving question:** What lessons from historical civilizations may help solve modern challenges?

```
/create_scenario "What can ancient Roman water management teach Memphis about solving its aging infrastructure problems?" discussion --grade 7 --context "7th grade Humanities PBL. Driving question: What lessons from historical civilizations may help solve modern challenges? This group is comparing Roman aqueducts, sewage systems, and water distribution to Memphis's current water infrastructure challenges. They are examining how Romans engineered solutions to supply clean water to a million people, what eventually failed, and what parallels exist with Memphis's aging pipes and water treatment. The group is discussing whether ancient engineering principles could inform modern solutions." --flaws completeness,reasoning
```

```
/create_scenario "How did ancient Mayan agricultural techniques address food scarcity, and could similar approaches help with food deserts in Memphis?" presentation --grade 7 --context "7th grade Humanities PBL. Driving question: What lessons from historical civilizations may help solve modern challenges? This group is researching Mayan farming techniques (raised fields, terracing, companion planting, forest gardens) and comparing them to modern urban farming approaches. They are investigating whether adapted versions of these techniques could address food access problems in Memphis neighborhoods classified as food deserts. Final product is a group presentation." --flaws epistemic,completeness
```

---

## 8th Grade Capstone

**Self-guided research aligned to capstone clusters.** These are year-long individual or small-group projects.

```
/create_scenario "How can we create a low-cost STEM kit that elementary students in underserved Memphis schools can use to learn basic coding and robotics?" presentation --grade 8 --context "8th grade Capstone, STEM cluster. Students are designing an affordable STEM kit for elementary-age children at under-resourced Memphis schools. They are researching what existing kits cost, what skills are age-appropriate, what materials are cheapest, and how to write instructions that work without a teacher present. Their capstone presentation will include a working prototype and cost analysis." --flaws reasoning,coherence
```

```
/create_scenario "How does social isolation on social media contribute to depression in middle schoolers, and what school-based strategies can reduce its effects?" discussion --grade 8 --context "8th grade Capstone, Community Issues cluster. Students are investigating the relationship between social media use, social isolation, and depression among middle school students. They surveyed peers about screen time, social connection, and mood. They are discussing their findings and debating what interventions (phone-free zones, peer mentoring, structured social time) their school could realistically implement." --flaws epistemic,reasoning,completeness
```

---

## Scaffolded Progression

Use these prompts in sequence to build students' flaw-detection skills from easy to hard. Each level increases in what students need to do cognitively. The topic (school gardens) stays consistent so the content is familiar — the challenge comes from the flaws, not the subject matter.

### Level 1: Warm-Up — "What's Missing?"

**Format:** Presentation. **Target flaws:** Completeness (primary), reasoning (secondary).

Students practice noticing what's absent — the easiest type of flaw to detect because you're asking "did they forget something?" rather than evaluating argument quality. The context is designed to produce obvious omissions: a group that proposes a solution without considering cost, space, or who does the work.

```
/create_scenario "Should our school start a garden to teach students about healthy eating?" presentation --grade 6 --context "6th grade STEM PBL. A group of 3 students researched whether a school garden would help students learn about nutrition. They visited one community garden, interviewed the school cafeteria manager, and read two articles about school gardens in other states. They are enthusiastic about the idea and want to recommend the school build a garden. They have not looked into costs, maintenance requirements, or whether the school has suitable space. Their presentation proposes the garden and explains why it would help students eat healthier." --flaws completeness,reasoning
```

**What students should catch:** No cost estimate. No plan for who maintains it over summer. No consideration of available space. Conclusion ("the school should definitely do this") based on one garden visit and two articles.

### Level 2: Building Up — "Is That Actually True?"

**Format:** Presentation. **Target flaws:** Epistemic (primary), reasoning (secondary).

Students now evaluate whether claims are supported by evidence. Harder than Level 1 because students must assess *quality* of evidence, not just its presence. The context produces agents who overstate what their small study shows and present assumptions as facts.

```
/create_scenario "Do school gardens actually improve students' eating habits and test scores?" presentation --grade 7 --context "7th grade STEM PBL. A group of 4 students designed a study to test whether working in a school garden changes students' eating habits. They had 12 students work in the garden for 3 weeks and gave them a survey before and after about what foods they eat. They also found a news article claiming that schools with gardens have higher test scores. They are presenting their findings as strong evidence that gardens improve both nutrition and academic performance." --flaws epistemic,reasoning
```

**What students should catch:** 12 students for 3 weeks is too small and too short to prove anything. Self-reported eating habits are unreliable. The test score claim comes from a news article, not their study — and correlation doesn't prove the garden caused higher scores. "Our study proves" language overstates what the data supports.

### Level 2.5a: Transition — "Did They Forget to Check?"

**Format:** Discussion. **Target flaws:** Completeness (primary), reasoning (secondary).

Students already know how to spot omissions from Level 1. Now they do it in a conversation instead of a presentation. The new skill is noticing omissions as they happen in real-time dialogue rather than in a finished product.

```
/create_scenario "What should we grow in our school garden to have the biggest impact on the school cafeteria?" discussion --grade 6 --context "6th grade STEM PBL. A group of 4 students is deciding what to plant in their school garden. One student wants tomatoes because they're easy to grow. Another wants herbs because the cafeteria manager said she'd use them. A third wants flowers to make the garden look nice. They are excited and quickly agreeing on a plan that includes all three, but no one has checked how much space they have, what grows well in Memphis's climate and soil in the planting season they're targeting, or how much the cafeteria actually needs. They're likely to commit to a planting plan that sounds good but hasn't been reality-checked." --flaws completeness,reasoning
```

**What students should catch:** The group picks crops without checking growing season, space, or soil. "Tomatoes are easy" is asserted but not verified for their conditions. They include flowers even though the goal is cafeteria impact. The group's enthusiasm leads them to agree fast without anyone asking practical feasibility questions.

### Level 2.5b: Transition — "Did That Actually Prove Anything?"

**Format:** Discussion. **Target flaws:** Reasoning (primary), epistemic (secondary).

Students practiced evaluating evidence quality in Level 2. Now they hear a bad causal claim get accepted in conversation. The new skill is catching flawed reasoning in dialogue — but unlike Level 4, the group dynamic is simple (no social pressure, no one backing down), so students only need to evaluate the argument, not the interpersonal dynamics.

```
/create_scenario "Did our school garden actually make students eat healthier this semester?" discussion --grade 7 --context "7th grade STEM PBL. A group of 4 students is reviewing whether their school garden project changed eating habits. They gave a survey at the start and end of the semester. More students said they 'like vegetables' in the second survey. One student concludes the garden worked. Another points out that the cafeteria also started a new salad bar mid-semester, but the group dismisses this quickly — 'the garden is what we worked on, so that's probably what made the difference.' A third student notices the survey questions were worded differently each time but isn't sure if that matters. They are heading toward claiming the garden improved eating habits based on the survey shift alone." --flaws reasoning,epistemic
```

**What students should catch:** The group attributes the survey change to the garden while ignoring the confounding variable (new salad bar). The changed survey wording undermines comparison. "We worked on the garden, so the garden caused it" is a textbook post hoc fallacy — but no one is being pressured or shouted down, they just don't notice the logic gap.

### Level 3: Intermediate — "Do the Pieces Fit Together?"

**Format:** Discussion. **Target flaws:** Coherence (primary), epistemic (secondary).

Students track a live conversation and notice when the group's pieces don't fit together. This requires holding multiple speakers' claims in working memory and comparing them. The context creates agents with conflicting understandings of the same topic who reach agreement without resolving the contradictions.

```
/create_scenario "What type of school garden would work best for our school — raised beds, a greenhouse, or a community plot?" discussion --grade 7 --context "7th grade STEM PBL. A group of 4 students is debating which garden design to recommend. One student researched raised beds and thinks they're best because they're cheap. Another researched greenhouses and believes year-round growing is essential. A third visited a community garden and wants to partner with a local organization. A fourth is trying to synthesize but doesn't fully understand the tradeoffs between the options. They have different assumptions about the budget (one thinks $500, another thinks $5000) but haven't noticed this disagreement. They are likely to agree on a plan without resolving the budget conflict." --flaws coherence,epistemic
```

**What students should catch:** The group agrees on a plan but two members have completely different budget assumptions. The synthesizer combines incompatible recommendations without noticing they conflict. One student's "cheap" raised beds and another's greenhouse can't both fit the budget, but no one raises this. Evidence from one garden visit is treated as representative.

### Level 4: Challenge — "What's Happening in the Conversation?"

**Format:** Discussion. **Target flaws:** Reasoning (primary), completeness (secondary).

Students must detect flaws in reasoning *and* notice how group dynamics amplify them. This is the hardest level because students need to track how a wrong idea gets defended and how valid objections get dropped under social pressure. The context creates a causal misconception that one agent defends with escalating certainty while another agent with valid concerns backs down.

```
/create_scenario "Why did our school garden fail last year, and how can we make the next one succeed?" discussion --grade 8 --context "8th grade STEM PBL. A group of 4 students is analyzing why their school's garden failed the previous year. One student is convinced the failure was because students didn't care enough — low motivation was the cause. Another student has data showing the garden had poor soil drainage and was planted too late in the season, but is less confident about speaking up. A third student just wants to move forward with a new plan and keeps pushing the group to stop debating and start designing. The group is likely to settle on a 'student motivation campaign' as the solution because the most vocal member drives the conversation, even though the evidence points to practical growing conditions as the real problem." --flaws reasoning,completeness
```

**What students should catch:** The vocal student treats "students didn't care" as the cause when the evidence (poor drainage, late planting) points elsewhere — a causal misconception defended with increasing confidence. The student with the real data backs down ("I guess you're right, motivation probably matters more"). The group agrees on a motivation campaign that doesn't address the actual causes of failure. No one considers practical fixes (drainage, planting schedule) because the conversation moved past them.

---

### Progression Summary

| Level | Format | What students practice | Cognitive demand |
|-------|--------|----------------------|------------------|
| 1. Warm-Up | Presentation | Noticing what's missing | Low — "did they forget X?" |
| 2. Building Up | Presentation | Evaluating evidence quality | Medium — "is this actually proven?" |
| 2.5a. Transition | Discussion | Spotting omissions in live conversation | Medium — familiar flaw type, new format |
| 2.5b. Transition | Discussion | Catching flawed reasoning in dialogue | Medium — familiar flaw type, new format |
| 3. Intermediate | Discussion | Comparing claims across speakers | Medium-high — "do these pieces fit?" |
| 4. Challenge | Discussion | Tracking reasoning + group dynamics | High — "why did the group accept a bad argument?" |

Teachers can use all six in sequence over a unit, or pick the level that matches their class. Level 1 works as a standalone warm-up activity. At the 2.5 transition, teachers choose based on how the class handled Level 2: use 2.5a if students need a gentler on-ramp (familiar flaw type, just new format), 2.5b if they're ready for a slight analytical step up, or both in sequence. Levels 3–4 work best after students have practiced with at least one discussion-format scenario.

---

## Notes

**Connector agents:** Presentations that emphasize coherence flaws benefit from a synthesizer or connector agent covering the Approach and/or Conclusion sections — see the plastic pollution scenario (Tomas) for an example. This pattern is less necessary for discussions, where interaction dynamics produce coherence opportunities naturally.

**How these prompts are structured:**

- **Topic** (quoted string): A specific investigation question that a student group would choose. Concrete enough to generate realistic knowledge profiles — not the broad driving question.
- **Activity**: `presentation` for STRIPES Showcase products; `discussion` for group deliberation before or during project development.
- **`--grade`**: Grade level (`6`, `7`, or `8`). Controls the cognitive level of knowledge gaps (how concrete or abstract misconceptions are) and the language register of generated speech (how students at that grade actually talk).
- **`--context`**: Carries the driving question, grade level, what the group is actually doing, what data or research they've gathered, and what final product they're building. This is what makes the scenario-generator produce realistic agents.
- **`--flaws`**: Which flaw types to emphasize. Vary across examples to cover all four types (reasoning, epistemic, completeness, coherence). Note: the system enforces a flaw type floor — all four types will appear at least once even if only two are specified. `--flaws` controls emphasis, not exclusivity.

**Grade band and difficulty:** `--grade` does not control which flaw types appear — it controls how concrete or abstract the underlying knowledge gaps are. A 6th-grade reasoning flaw comes from a concrete misconception ("people litter, that's how plastic gets in the river"); an 8th-grade reasoning flaw comes from a methodological misconception ("our survey proves this because we got 30 responses"). The flaw types are the same; the cognitive level is different.

**Adapting these prompts:**

To create new prompts for topics not listed here (e.g., genotypes/phenotypes/probabilities), follow the same pattern: start with the driving question, imagine what specific angle a student group would take, and describe their actual project work in `--context`. For example:

```
/create_scenario "How do genotypes determine phenotypes, and can we use Punnett squares to predict the probability of inherited traits in our families?" presentation --grade 7 --context "7th grade STEM PBL on heredity and genetics. This group is investigating how genetic information passes from parents to offspring and determines observable traits. They collected family trait data (eye color, earlobes, tongue rolling), built Punnett squares to calculate expected ratios, and compared predictions to actual family data. They are presenting their findings including probability calculations and a discussion of why predictions don't always match reality." --flaws reasoning,epistemic
```
