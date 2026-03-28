# CrossCheck — User Workflows

How students, teachers, and researchers use CrossCheck in practice. Each workflow describes the steps, what the user sees, and what happens in the system.

For pedagogical details on the five-stage flow, see [Pedagogical Model](pedagogical-model.md).

---

## Before Class

### Teacher: Create a Class and Add Students

1. Log in as teacher (name + password).
2. Go to **Classes** (top nav).
3. Click **New Class**.
4. Name the class (e.g., "6th STEM Period 2").
5. Add students: enter one name per line.
6. Click **Create Class**. Students can also be added later from the class detail page.
7. Students log in by entering their name — no passwords, no usernames to distribute.

### Teacher: Preview an Activity

1. Go to **Transcripts** (top nav) to browse available activities.
2. Select an activity from the grid. Each card shows: topic, type badge, agent count, flaw severity counts.
3. Review the activity with three tabs:
   - **Overview** — Flaw distribution bars, severity breakdown, key patterns, all flaws list.
   - **Meet the Team** — Agent cards with disposition, reactive tendency, expected flaws.
   - **Transcript** — Toggle between Teacher View (highlights + popovers) and Student View (clean).
4. Click any flaw in Overview or Meet the Team to jump to its location in the transcript.

### Teacher: Create a Session

1. From the class detail page, click **New Session**.
2. Select the activity. Click **Preview** to review before committing.
3. Create groups and assign students from the class roster.
4. **Set pass thresholds** for each stage (optional — defaults are 50% for Recognize/Collaborate/Locate, 2 explanations for Explain). Thresholds determine how many correct answers students need to "pass" each stage.
5. Click **Create Session**. Every session runs the five-stage flow (Recognize → Explain → Collaborate → Locate → Results) — no mode selection needed.

### Session Timing Guide (45-minute class period)

| Phase | Time | Notes |
|-------|------|-------|
| Setup + Start | 2 min | Teacher starts session; students open devices |
| Recognize (individual) | 10–12 min | Students work through turns on their own iPads |
| Explain (group, teach back) | 5–8 min | Articulate what the group got right |
| Collaborate (group, team building) | 10–15 min | Physical discussion + collaborative writing on errors |
| Locate (group, if triggered) | 5–8 min | Search for missed flaws |
| Results + Debrief | 5–10 min | Review results; whole-class discussion |

---

## During Class

### Teacher: Start the Session

1. Open the session from the class detail page.
2. The dashboard shows all groups in a grid. Each group card shows: group name, student names, annotation count, connection status, coin totals.
3. Groups start in the **Recognize** stage automatically.

### Student: Recognize Stage (Individual)

1. Log in by entering their name.
2. The home page shows assigned sessions. Click the active session.
3. The transcript is displayed **turn by turn**. Each turn is highlighted.
4. A **goal bar** shows progress toward the pass threshold (e.g., "3 / 7 correct").
5. For each turn, pick from 4 flaw type choices (Reasoning, Epistemic, Completeness, Coherence). Every turn has exactly one flaw — no trick questions.
6. **Immediate feedback:** Correct answer shows a green checkmark and coins earned ("+3 coins!"). Wrong answer shows the correct type.
7. **"Narrow it down" button** (hints): unlocks after ~18 seconds. Each use eliminates one wrong choice. Max 2 hints per turn. Using hints reduces coin reward.
8. When the goal bar fills, a brief celebration plays. Students can keep going for more coins.
9. Students who finish early see a "Waiting for your group" screen with their stats and coin total.

### Teacher: Monitor Recognize

1. The dashboard updates in real time:
   - Group cards show completion progress (e.g., "3/5 students complete").
   - Connection dots: green (all connected), orange (some), gray (disconnected).
   - Coin totals per group.
2. Click a group card to see detailed student progress.
3. The **Answer Key** is available at any time — expand it to see all flaws with descriptions and evidence.
4. When enough students are done, press **"Move to Explain"** to advance the group.

### Student: Explain Stage (Group — Teach Back)

1. Students sit together. The system shows turns **the group got unanimously correct** in Recognize.
2. Framing: "Teach your group — explain why this is a [flaw type] flaw."
3. The correct flaw type is already shown (no type-selection step). Students go straight to writing.
4. **Write-then-reveal:** Students write explanations independently (~45–60 seconds), then all explanations become visible simultaneously, attributed to each author. Brief verbal discussion follows.
5. **"Narrow it down" button** (hints): unlocks after ~30 seconds. Shows a guided template ("This is a [type] flaw because ___"). Max 1 hint per turn.
6. **Goal bar** tracks explanations submitted toward the pass threshold.
7. **Coins:** 1 coin per explanation submitted. 2 bonus coins per student when all Explain turns are completed.
8. **Flaw Field Guide** available as a sidebar reference.
9. The system automatically transitions to Collaborate when all Explain turns are done.

### Student: Collaborate Stage (Group — Team Building)

1. The system shows turns where **any student was wrong** in Recognize.
2. Framing: "These ones stumped some of us — let's figure them out together."
3. For each turn, the group sees the **Recognize distribution** (e.g., "2 said reasoning, 1 said epistemic").
4. **Step 1:** Group selects the flaw type (4 choices).
5. **Step 2:** Students write justifications collaboratively — each on their own iPad.
   - **Write-then-reveal:** Students write independently for ~60–90 seconds, then all explanations become visible simultaneously.
   - Students can revise after seeing each other's work.
6. **Structured disagreement:** When Recognize results show disagreement, minority-voice students are prompted to share first.
7. **"Narrow it down" button** (hints): unlocks after ~45 seconds. Hint 1 reveals the correct type. Hint 2 provides a guided template.
8. **Goal bar** tracks correct group selections toward the pass threshold.
9. **Coins:** 2 coins per student for correct group selection (3 if no hints). 1 coin per explanation submitted.
10. **Flaw Field Guide** available.

### Student: Locate Stage (Group — Detective Challenge, Conditional)

Locate triggers **only if flaws remain unidentified** after Collaborate. If the group caught everything, the session skips directly to Results.

1. Framing: "X flaws are still hiding in the transcript — can your team find them?"
2. Full transcript displayed. Goal bar shows flaws found toward the pass threshold.
3. Students search the transcript together and flag turns they believe contain missed flaws.
4. **Student-targeted hints:** Tap a section to search, then request a hint.
   - Hint 1: Confirms or denies a flaw is in that section (denials are free — not counted as hints).
   - Hint 2: Highlights the specific turn.
   - Hint 3: Reveals the flaw type.
5. **Coins:** 3 coins for finding a flaw independently, 2 with 1 hint, 1 with 2+ hints.
6. **Flaw Field Guide** available.

### Teacher: Send Scaffolds

At any stage:
1. Click **Send scaffold** on any group card.
2. Pick a **template** from quick-pick buttons (12 templates across 6 levels) or type a custom message.
3. The scaffold appears on students' screens as a blue notification card. Students can dismiss it.

### Teacher: Stage Transitions

| Transition | How |
|------------|-----|
| Recognize → Explain | Teacher presses "Move to Explain" on the dashboard |
| Explain → Collaborate | Automatic — triggers when all Explain turns are completed |
| Collaborate → Locate | Automatic — triggers if flaws remain unidentified after Collaborate |
| Collaborate → Results | Automatic — triggers if all flaws were caught across Recognize and Collaborate |
| Locate → Results | Group finishes or teacher ends the session |

### Student: Results View

A single end-of-session view showing the group's journey:

- **Recognize results:** Per-student accuracy, coins earned, hint usage.
- **Explain results:** Written explanations (attributed), contribution counts, coins earned.
- **Collaborate results:** Group's flaw type selections, written explanations (attributed), disagreement resolution, coins earned.
- **Locate results** (if triggered): Missed flaw count, found count, hints needed, coins earned.
- **Summary:** Total flaws in transcript, caught in Recognize, explained in Explain, corrected in Collaborate, found in Locate, remaining unfound. Total coins per student and per group.

### Teacher: Class View

Click **Class View** for a projectable screen showing aggregate results across all groups — useful for whole-class debrief.

---

## After Class

### Teacher: Post-Session

1. Add **session notes** (free-text field, auto-saves on blur).
2. The session can be **reopened** if needed.
3. Click **Close Session** when done.
4. Closed sessions remain visible on the class detail page.
5. Sessions can be **deleted** (with confirmation) when in active or complete status.

### Student: View Progress

1. Click **Progress** in the top nav.
2. See all past sessions: activity topic, date, detection rate, flaws found/missed, coins earned.
3. Per-flaw-type breakdown shows improvement trends.

---

## Researcher Workflows

### Browse Pipeline

1. Log in as researcher (name + password).
2. The home page lists all activities with metadata: scenario ID, topic, type, agent count, flaw distribution.
3. Click an activity to see the **Pipeline View** with 4 tabs:
   - **Scenario** — Driving question, agent sketches, expected flaws, design notes.
   - **Profiles** — Each agent's knowledge profile and disposition.
   - **Transcript** — Full transcript with hidden metadata visible (knowledge areas, rationale, reactive tendency activation).
   - **Evaluation** — All flaws with type, source, severity, evidence, explanation.

### Browse Sessions

1. Click **Sessions** in the top nav.
2. See all sessions across all teachers: status, activity, group count, annotation counts, match stats, coin totals.
3. Student data is anonymized (opaque IDs, no names).

### Export Data

1. From the Sessions page, click export buttons:
   - **Export Annotations** — CSV with annotation details, anonymized student IDs.
   - **Export Scaffolds** — CSV with scaffold details, level, type, context at send.
   - **Export Hints** — CSV with hint usage per student, stage, and turn.
   - **Export Sessions** — CSV with session summaries, per-group match stats, coin totals.
2. All exports filter to students with `researchConsent = true` only.

### Manage Teachers

1. Click **Teachers** in the top nav.
2. Create new teacher accounts (name + password).
3. Ingest or delete activities from the registry.

---

## Real-time Behavior

These happen automatically via Socket.IO — no user action needed:

| Event | Teacher sees | Students see |
|-------|-------------|-------------|
| Student creates annotation | Activity feed updates, group card counts update | Own annotation appears immediately |
| Student completes Recognize turn | Progress count updates on group card | Next turn appears, coins animate |
| Student earns coins | Group coin total updates | Coin animation on their device |
| Teacher sends scaffold | Scaffold appears in group card | Blue notification card at top |
| Student acknowledges scaffold | Checkmark next to scaffold | Scaffold disappears |
| Teacher advances stage | Dashboard stage indicator updates | Stage transition with new UI |
| System advances stage | Dashboard stage indicator updates | Stage transition with new UI |
| Student connects/disconnects | Connection dot changes color | Reconnecting indicator |

---

## Edge Cases

| Situation | What happens |
|-----------|-------------|
| Student joins late | They enter their name, see the session, and start at the current stage |
| WiFi drops briefly | Socket.IO auto-reconnects. HTTP requests still save. Updates resume on reconnect |
| Teacher reopens session | Students are notified and can resume work |
| Teacher deletes session | All groups, annotations, and scaffolds cascade-deleted |
| Student in multiple sessions | Home page lists all active sessions; student picks which one |
| All flaws caught by end of Collaborate | Locate stage is skipped; session goes directly to Results |
| No turns unanimously correct | Explain stage has zero turns; system transitions immediately to Collaborate |
| All turns unanimously correct | Collaborate stage has zero turns; system checks Locate trigger (likely skips to Results) |
| Fast student in Recognize | Sees "Waiting for your group" screen with coins earned until teacher advances |
| Student hits pass threshold | Celebration animation plays; student can continue for more coins |
