# CrossCheck — Classroom Context

How CrossCheck fits into the project-based learning (PBL) model at University Middle School (UMS) in Memphis, TN.

---

## School Profile

University Middle School enrolls ~270 students in grades 6–8, drawn from all 36 zip codes in Memphis–Shelby County. Class size averages 20:1. The student body is 49% White / 51% BIPOC; staff is 50/50.

UMS is part of University Schools, a state-recognized district. Its mission centers on preparing diverse students through PBL to be culturally competent, intellectually inquisitive, and emotionally intelligent.

---

## The PBL Model

### Structure

- **6th and 7th grade**: Two semester-long PBL cycles per year — one STEM, one Humanities. Teachers design driving questions aligned to Tennessee content standards. Students work in collaborative groups of ~5.
- **8th grade**: Year-long self-guided capstone project. Students choose a cluster (Arts & Humanities, Community Issues, Sports & Health Sciences, STEM) and work more independently.

### Timeline

Each 6th/7th grade project runs ~13 Fridays:

| Phase | Duration | What happens |
|-------|----------|-------------|
| Project Launch | 1 Friday | Entry event, team formation, driving question introduction |
| Build Knowledge & Develop | 11 Fridays | Research, prototyping, peer feedback, revision cycles |
| Present Products | STRIPES Showcase | Public presentation to authentic audience |

This means a CrossCheck session must fit within a single Friday class period (typically 45–60 minutes), or be split across two Fridays.

### Current Driving Questions (2025)

| Grade | Subject | Driving Question |
|-------|---------|-----------------|
| 6th | STEM | "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?" |
| 6th | Humanities | "How do the choices and roles of small communities impact the overall culture of a larger society?" |
| 7th | STEM | "How do our senses influence our actions and decisions, both now and in the future?" |
| 7th | Humanities | "What lessons from historical civilizations may help solve modern challenges?" |

8th grade capstone questions are student-chosen, ranging from STEM accessibility to emotional expression through visual storytelling.

### Pedagogical Practices

UMS teachers already use these practices that CrossCheck builds on:

- **Scaffolding**: Entry events, structured activities, gallery walks, guest experts. CrossCheck's 6-level scaffold system maps to this — from gentle redirects to direct hints.
- **Peer feedback**: Gallery walks and structured critique cycles. CrossCheck's group phase (where students see each other's annotations and confirm group answers) is the digital equivalent.
- **Authentic audience**: STRIPES Showcase presentations. CrossCheck's AI-generated presentations mirror this format — 5-section group presentations with speaker roles.
- **Driving questions**: Every project starts with a big question. CrossCheck activities are generated from similar driving questions so students practice critical evaluation on familiar topics.

---

## Where CrossCheck Fits

CrossCheck is a **critical thinking practice tool** embedded within PBL projects. It does not replace any part of the PBL cycle — it supplements the "Build Knowledge" phase by giving students structured practice in evaluating group work.

### The Pedagogical Logic

1. **Students will present at STRIPES Showcase** — they need to evaluate group presentations critically.
2. **AI generates intentionally flawed presentations and discussions** on topics that mirror the students' own PBL driving questions (e.g., environmental threats, sensory science).
3. **Students practice identifying flaws** in someone else's work before they have to identify flaws in their own.
4. **Teachers scaffold the process** using real-time monitoring and the 6-level hint system.
5. **The evaluation feedback loop** shows students what they caught and what they missed — building metacognitive awareness.

### Typical Usage Pattern

A teacher might use CrossCheck 2–3 times during the 11-week Build Knowledge phase:

| When | Purpose | Suggested Mode |
|------|---------|---------------|
| Week 2–3 (early) | Introduce flaw vocabulary | Learn (standalone) then Recognize |
| Week 5–6 (mid) | Practice finding flaws with support | Locate or Classify (detect only) |
| Week 9–10 (late) | Independent critical evaluation | Classify (full) or Explain |

Different groups within the same session can use different modes. There is no required sequence — a teacher can start any group at any mode. Choose based on what your students need to practice.

### Example: A Friday Session in Practice

It's Friday, week 6 of a 7th grade STEM project on sensory science. The teacher has 20 students in 4 groups of 5. She creates a session using a Polylogue-generated presentation on "How do our senses influence decision-making?" — a topic that mirrors the students' own driving question.

She assigns different practice modes based on what each group needs:

- **Group A** (strong critical thinkers) gets **Classify (full)** — find and categorize flaws independently.
- **Group B** (solid but needs focus) gets **Locate** — hint cards direct them to specific sections.
- **Group C** (new to flaw analysis) gets **Recognize** — pre-highlighted passages with inline quizzes.
- **Group D** (one absent student, rest are mixed) gets **Classify (detect only)** — just flag what seems wrong, no categorization pressure.

She starts the session. Students open their tablets and begin working.

**10 minutes in**, the teacher checks her dashboard. Group B has found 4 of 5 hinted flaws. She clicks their mode badge and switches them to **Classify (detect only)** — removing the hints to see if they can work independently. Their screens refresh automatically. Group C is struggling with epistemic flaws — she sends a scaffold ("What evidence does the speaker actually have for this claim?") and keeps them on Recognize for now.

A student in Group A can't remember the difference between reasoning and coherence flaws. She taps **Learn** in the nav bar, reviews the definitions and examples, then returns to her annotation task — her annotations are still there, nothing lost.

**After 20 minutes**, the teacher advances to Group phase. Students discuss face-to-face, confirm annotations on their devices. After 10 more minutes, she releases the evaluation. The feedback view shows each group what they caught and missed. The projector view shows class-wide patterns for a 5-minute debrief.

**Total time: 40 minutes.** The teacher made all the pedagogical decisions — which mode for each group, when to adjust, what scaffolds to send. The app made those decisions easy to execute in real time.

### Session Timing Guide

For a 45-minute class period:

| Phase | Time | Notes |
|-------|------|-------|
| Setup + Start | 2 min | Teacher starts session; students open devices |
| Individual | 15–20 min | Students work independently |
| Group | 10–15 min | Physical discussion + digital confirmation |
| Review + Debrief | 10 min | Teacher releases evaluation; whole-class discussion |

If time runs short, the teacher can skip the group phase and go directly from Individual to Reviewing. The feedback view works with individual annotations if no group answers exist.

---

## Classroom Environment

### Technology

- **Devices**: Primarily tablets (Chromebooks or iPads); some desktop computers in labs.
- **Network**: School WiFi shared by all students and staff. Socket.IO auto-reconnects on brief drops. Annotations save via HTTP even if the WebSocket is temporarily down.
- **Platform**: Google Classroom is the primary LMS. CrossCheck is a separate web app — teachers share the URL or link from Google Classroom.

### Physical Setup

Students sit in groups of ~5. During the group phase, they discuss physically (face to face) while referring to the shared transcript on their individual devices. The teacher circulates between groups while monitoring the dashboard on their own device.

### Student Login

Students log in by name only — no passwords. This was a deliberate design choice for middle school: it minimizes friction (no "I forgot my password" interruptions) while the app runs on a local network behind school authentication. Teachers create student accounts in advance using batch import.

---

## Alignment with UMS Assessment

CrossCheck does not produce grades. It produces **formative feedback** — detection rates, flaw type breakdowns, and matched/missed comparisons. Teachers can use this data to:

- Identify which flaw types the class struggles with (e.g., consistently missing coherence flaws).
- Track individual progress across sessions (the Progress page shows detection rates over time).
- Decide which scaffolds to deploy (if many groups miss epistemic flaws, the teacher can do a mini-lesson on evidence quality).
- Inform their own PBL assessment by observing how well students evaluate group work.

UMS uses rubrics for PBL project assessment. CrossCheck's flaw taxonomy (reasoning, epistemic, completeness, coherence) aligns with common rubric criteria for critical thinking, evidence use, and communication.

---

## Research Context

CrossCheck collects data for educational research (with consent). The researcher role provides:

- Anonymized annotation data (who found what, when, with what scaffolding).
- Pipeline visibility into how AI-generated flaws map to student detection.
- Export capabilities for quantitative analysis.

Student data is only included in exports when `researchConsent = true`. The researcher view anonymizes student identifiers.
