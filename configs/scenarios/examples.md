# Example /create_scenario Prompts

Ready-to-use prompts for generating scenarios. Each is grounded in a real UMS PBL driving question. The quoted topic represents the kind of specific investigation a student group would choose within the broader project.

---

## 6th Grade STEM

**Driving question:** What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?

```
/create_scenario "How does plastic pollution in the Mississippi River affect local fish populations, and what can Memphis communities do to reduce it?" presentation --context "6th grade STEM PBL. Driving question: What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems? This group chose to focus on plastic pollution in the Mississippi River near Memphis. They are researching how microplastics enter the food chain, what species are affected, and what local cleanup or policy efforts exist. Final product is a digital presentation at the STRIPES Showcase." --flaws reasoning,completeness
```

```
/create_scenario "What causes urban heat islands in Memphis, and how can green infrastructure reduce their impact on local communities?" discussion --context "6th grade STEM PBL. Driving question: What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems? This group is investigating why some Memphis neighborhoods are significantly hotter than others, how tree cover and pavement affect temperature, and what green infrastructure solutions (green roofs, urban forests, reflective surfaces) could help. They are preparing to discuss findings before building their final presentation." --flaws epistemic,reasoning
```

```
/create_scenario "How do invasive species disrupt native ecosystems in the southeastern United States, and what can be done to control them?" presentation --context "6th grade STEM PBL. Driving question: What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems? This group is researching invasive species such as kudzu, Asian carp, and fire ants in the Memphis region. They are examining how these species outcompete natives, what ecological and economic damage they cause, and what control methods exist. Final product is a digital presentation and escape room." --flaws completeness,coherence
```

---

## 6th Grade Humanities

**Driving question:** How do the choices and roles of small communities impact the overall culture of a larger society?

```
/create_scenario "How did the Memphis sanitation workers' strike of 1968 change labor rights and civil rights for the entire country?" presentation --context "6th grade Humanities PBL. Driving question: How do the choices and roles of small communities impact the overall culture of a larger society? This group is investigating the 1968 Memphis sanitation workers' strike, examining working conditions, the role of community organizing, Dr. King's involvement, and the lasting impact on national labor and civil rights policy. Final product is a group presentation at the STRIPES Showcase." --flaws epistemic,completeness
```

```
/create_scenario "How does the food culture of Memphis barbecue reflect the blending of African American, Southern, and immigrant traditions?" discussion --context "6th grade Humanities PBL. Driving question: How do the choices and roles of small communities impact the overall culture of a larger society? This group is exploring how Memphis barbecue traditions emerged from African American, Southern, and immigrant cooking practices, and how a local food culture became nationally significant. They are examining specific restaurants, techniques, and cultural events. The group is discussing their research findings before creating their final product." --flaws reasoning,epistemic
```

---

## 7th Grade STEM

**Driving question:** How do our senses influence our actions and decisions, both now and in the future?

```
/create_scenario "How does background music affect concentration and test performance in middle school students?" presentation --context "7th grade STEM PBL. Driving question: How do our senses influence our actions and decisions, both now and in the future? This group is investigating how auditory input (background music, silence, white noise) affects cognitive performance. They designed an experiment testing classmates' performance on memory and math tasks under different sound conditions. They collected data on accuracy and speed and are presenting their findings, including proportional analysis of results. Final product is a digital presentation or prototype of a study environment." --flaws reasoning,completeness
```

```
/create_scenario "How can hospital waiting rooms be redesigned using sensory inputs to reduce patient anxiety?" discussion --context "7th grade STEM PBL. Driving question: How do our senses influence our actions and decisions, both now and in the future? This group is designing a sensory environment for a hospital waiting room that uses lighting, sound, scent, and texture to reduce anxiety. They researched how different sensory inputs trigger calming vs. stress responses and are now discussing their prototype design. A nursing professor visited their class to talk about sensory design in healthcare settings." --flaws epistemic,coherence
```

```
/create_scenario "Why do optical illusions trick our brains, and can we design new ones that exploit specific visual processing weaknesses?" presentation --context "7th grade STEM PBL. Driving question: How do our senses influence our actions and decisions, both now and in the future? This group is investigating how the visual system processes information and where it makes predictable errors. They studied classic optical illusions, learned about how the brain fills in gaps and makes assumptions, and are designing their own illusions. They tested their designs on classmates and collected data on what percentage of people were fooled. Final product includes a presentation of findings and a prototype illusion exhibit." --flaws reasoning,epistemic
```

---

## 7th Grade Humanities

**Driving question:** What lessons from historical civilizations may help solve modern challenges?

```
/create_scenario "What can ancient Roman water management teach Memphis about solving its aging infrastructure problems?" discussion --context "7th grade Humanities PBL. Driving question: What lessons from historical civilizations may help solve modern challenges? This group is comparing Roman aqueducts, sewage systems, and water distribution to Memphis's current water infrastructure challenges. They are examining how Romans engineered solutions to supply clean water to a million people, what eventually failed, and what parallels exist with Memphis's aging pipes and water treatment. The group is discussing whether ancient engineering principles could inform modern solutions." --flaws completeness,reasoning
```

```
/create_scenario "How did ancient Mayan agricultural techniques address food scarcity, and could similar approaches help with food deserts in Memphis?" presentation --context "7th grade Humanities PBL. Driving question: What lessons from historical civilizations may help solve modern challenges? This group is researching Mayan farming techniques (raised fields, terracing, companion planting, forest gardens) and comparing them to modern urban farming approaches. They are investigating whether adapted versions of these techniques could address food access problems in Memphis neighborhoods classified as food deserts. Final product is a group presentation." --flaws epistemic,completeness
```

---

## 8th Grade Capstone

**Self-guided research aligned to capstone clusters.** These are year-long individual or small-group projects.

```
/create_scenario "How can we create a low-cost STEM kit that elementary students in underserved Memphis schools can use to learn basic coding and robotics?" presentation --context "8th grade Capstone, STEM cluster. Students are designing an affordable STEM kit for elementary-age children at under-resourced Memphis schools. They are researching what existing kits cost, what skills are age-appropriate, what materials are cheapest, and how to write instructions that work without a teacher present. Their capstone presentation will include a working prototype and cost analysis." --flaws reasoning,coherence
```

```
/create_scenario "How does social isolation on social media contribute to depression in middle schoolers, and what school-based strategies can reduce its effects?" discussion --context "8th grade Capstone, Community Issues cluster. Students are investigating the relationship between social media use, social isolation, and depression among middle school students. They surveyed peers about screen time, social connection, and mood. They are discussing their findings and debating what interventions (phone-free zones, peer mentoring, structured social time) their school could realistically implement." --flaws epistemic,reasoning,completeness
```

---

## Notes

**How these prompts are structured:**

- **Topic** (quoted string): A specific investigation question that a student group would choose. Concrete enough to generate realistic knowledge profiles — not the broad driving question.
- **Activity**: `presentation` for STRIPES Showcase products; `discussion` for group deliberation before or during project development.
- **`--context`**: Carries the driving question, grade level, what the group is actually doing, what data or research they've gathered, and what final product they're building. This is what makes the scenario-generator produce realistic agents.
- **`--flaws`**: Which flaw types to emphasize. Vary across examples to cover all four types (reasoning, epistemic, completeness, coherence).

**Adapting these prompts:**

To create new prompts for topics not listed here (e.g., genotypes/phenotypes/probabilities), follow the same pattern: start with the driving question, imagine what specific angle a student group would take, and describe their actual project work in `--context`. For example:

```
/create_scenario "How do genotypes determine phenotypes, and can we use Punnett squares to predict the probability of inherited traits in our families?" presentation --context "7th grade STEM PBL on heredity and genetics. This group is investigating how genetic information passes from parents to offspring and determines observable traits. They collected family trait data (eye color, earlobes, tongue rolling), built Punnett squares to calculate expected ratios, and compared predictions to actual family data. They are presenting their findings including probability calculations and a discussion of why predictions don't always match reality." --flaws reasoning,epistemic
```
