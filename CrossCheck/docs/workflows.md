# CrossCheck — Workflows

How students, teachers, and researchers use CrossCheck in practice. Each workflow describes the steps, what the user sees, and what happens in the system.

---

## Before Class

### Teacher: Add Students

1. Log in as teacher (name + password).
2. Go to **Students** (top nav).
3. Click **Add Students**.
4. Choose **Batch** mode. Enter one name per line (e.g., "Maya Johnson").
5. Click **Add N Students**. Usernames are auto-generated from names.
6. Note: Students log in by entering their name — no passwords to distribute.

### Teacher: Preview an Activity

1. Go to **Sessions** (top nav) → **New Session**.
2. Select an activity from the dropdown.
3. Click the **Preview** link next to the dropdown.
4. Review the transcript (what students will see) and the reference evaluation (the "answer key" — all flaws with descriptions, evidence, and explanations).
5. Decide if this activity is appropriate for the class.

### Teacher: Create a Session

1. From **New Session**, select the activity.
2. Create groups (e.g., "Group A", "Group B"). Assign students to each group.
3. Set the practice mode per group. Four session modes, ordered by independence (how much the system does for the student):
   - **Recognize** — Pre-highlighted transcript with inline quizzes. Students identify the flaw type of each highlighted passage (includes false positive passages). Read-only — no annotation. The default for new groups. Knob: response format (A/B choice or multiple choice).
   - **Locate** — Hint cards tell students the flaw type and which section to look in. Students flag the exact text (includes false positive hint cards). Knob: hint scope (sentence or section).
   - **Classify** — Open search. Students read the full transcript and flag flaws. Knob: categorization level (detect only / assisted / full — controls whether and how students categorize). "Show Hint" button always available.
   - **Explain** — Full analysis: flag + categorize + severity + written explanation. Knob: explanation format (guided template or free text). "Show Hint" button always available.

   **Learn** is a standalone vocabulary primer accessible from the nav bar — not a session mode.

   The selected mode's description and granularity knob appear below the pills. Different groups in the same session can use different modes — choose based on what your students need to practice.
4. Click **Create Session**. Session starts in **Setup** phase.

---

## During Class

### Teacher: Start the Session

1. Open the session from the **Sessions** list.
2. The dashboard shows all groups in a grid. Each group card shows: group name, student names, annotation count, sections touched.
3. Click **Start Session**. Phase changes to **Individual**.
4. Students are notified on their devices that the session has started.

### Student: Individual Phase

1. Log in by entering their name.
2. The home page shows assigned sessions. Click the active session.
3. What the student sees depends on their group's practice mode:

**Learn mode:**
- No transcript. Instead, a self-contained vocabulary primer.
- Phase 1: Read definitions and examples of the 4 flaw types (reasoning, epistemic, completeness, coherence).
- Phase 2: 8-question quiz — read a passage, pick the flaw type.
- Immediate feedback on each answer with explanation.
- Completion is saved locally so students don't re-do the quiz if they navigate away.
- When the teacher advances to Reviewing, students see the feedback view.

**Recognize mode:**
- Read-only transcript with specific flaw sentences highlighted in yellow, each with a numbered badge.
- Click a badge to open a centered popup with color-coded flaw type buttons and concise definitions (scaffolding for students still learning the vocabulary).
- Students get configurable max attempts (default: 2). Wrong answers show "Not quite — try again" briefly, then gray out the wrong choice. After all attempts, the correct answer + explanation is revealed.
- Badge colors: yellow (unanswered), amber with retry arrow (wrong, retries left), green with checkmark (correct), red with X (wrong, no retries left).
- Cross-section flaws (spanning multiple sections) appear as purple "Compare sections" badges.
- Results persist across popup close and page refresh (stored in database). Score tracker at top.
- Scaffolds from the teacher appear as blue notification cards at the top.
- When the teacher advances to Reviewing, the page refreshes to show the feedback view.

**Locate mode:**
- Full transcript, but with hint cards at the top.
- Each hint card shows: the flaw type (color-coded), which section/turn to look in, and a reading strategy tip.
- Navigate between hints with Previous/Next buttons.
- The hinted section is at full opacity; other sections are dimmed (40% opacity).
- Some hint cards are false positives (no flaw in that section). Students can click "No flaw found" to correctly resolve these.
- To annotate: select text in the hinted section, click "Flag This" (single button).
- The flaw type is recorded automatically from the hint — students just find the location.
- Sidebar shows a list of flags. Undo button available.
- Full socket integration: phase transitions, scaffolds, live updates in group phase.

**Classify and Explain modes:**
- Read the full AI-generated transcript:
  - **Presentations**: sections displayed as cards (Introduction, Approach, Findings, Solution, Conclusion). Each section has a speaker name, role, and avatar.
  - **Discussions**: turns displayed as chat bubbles grouped by stage (Opening Up, Working Through, Converging).
- To annotate a flaw:
  - Select (highlight) the problematic text in the transcript.
  - The bottom bar activates:
    - **Classify (detect only)**: Single "Flag This" button. Compact field guide.
    - **Classify (assisted)**: 2–4 flaw type buttons (correct type + random distractors, varies per flaw).
    - **Classify (full)**: All 4 flaw type buttons (Reasoning, Epistemic, Completeness, Coherence).
    - **Explain**: All 4 flaw type buttons. After selecting a type, an explanation prompt appears (guided template or free text, based on knob) with a severity selector.
  - The annotation appears as a colored underline on the transcript.
- **Show Hint** button (always available): reveals the section of an unfound flaw with a pulse animation. Hint-assisted annotations are tracked and visible to the teacher.
- The sidebar (desktop) shows the Flaw Field Guide (definitions, reading strategies, examples) and all annotations. Click an annotation to scroll to it. Click the X to delete it.
- The **Undo** button on the bottom bar removes the most recent annotation.
- During Individual phase, students see only their own annotations — not their group members'.

### Teacher: Monitor Individual Phase

1. The dashboard updates in real time:
   - **Live Activity feed** shows annotations as students create them (timestamp, group name, flaw type, highlighted text).
   - **Group cards** show annotation counts and sections touched, updating live.
   - **Connection dots** on each group card: green (all connected), orange (some connected), gray (disconnected).
2. Click a group card to expand the **Group Detail** panel:
   - See the annotation list with student names, flaw types, and highlighted text.
   - Click **View on transcript** to see annotations overlaid on the actual text.
   - Compare what the group has found vs. the reference evaluation (found/missed counts).
3. The **Reference Evaluation (Answer Key)** is available at any phase — expand it at the bottom of the dashboard to see all flaws with descriptions and evidence.

### Teacher: Send Scaffolds

1. Click **Send scaffold** on any group card.
2. The scaffold form opens:
   - Pick a **template** from the quick-pick buttons (12 templates across 6 levels, from gentle "Take another look at Section 3" to direct "There's a reasoning flaw in Turns 7-9").
   - Or type a **custom message**.
   - Edit the template text if needed, then click **Send**.
3. The scaffold appears immediately on the students' screens as a blue notification card pinned to the top.
4. Students can **Dismiss** the scaffold (which marks it as acknowledged on the teacher dashboard with a checkmark).

### Teacher: Advance to Group Phase

1. Click **Group Phase** on the dashboard.
2. All students in the session are notified: "Group Phase — discuss with your team!"
3. Students now see all group members' annotations (color-coded).
4. The teacher dashboard continues to update in real time.

### Student: Group Phase

1. A notification appears: "Group Phase — discuss with your team!"
2. All group members' annotations are now visible on the transcript.
3. Students discuss physically (in the classroom) which annotations to keep.
4. To confirm a group answer:
   - In the sidebar, each annotation shows **Confirm** / **Unconfirm** buttons.
   - When 2+ group members confirm an annotation, it becomes a **group answer** (shown with a solid green border).
5. Students can also create new annotations during group phase.
6. Group answers are what get compared to the reference evaluation in the feedback view.

### Teacher: Release Evaluation

1. When the group phase is done, click **Release Evaluation**.
2. Phase changes to **Reviewing**. Students see the feedback view.
3. The dashboard now shows match stats per group: found (green), missed (yellow), detection rate.
4. Click **Class View** for a projectable screen showing aggregate results for whole-class debrief.

### Student: Feedback View

1. The transcript view is replaced by the **Feedback View** with three tabs:
   - **Transcript** — The original transcript with annotations colored by match result (green = correct, blue = right location wrong type, red = false positive).
   - **Your Annotations** — List of all group annotations with match indicators.
   - **Reference Flaws** — The full reference evaluation: every flaw with type badge, severity, evidence quote, and explanation. Matched flaws in green, missed in yellow.
2. Summary stats at the top: "Your group found X of Y flaws", detection rate, precision.
3. If the teacher added **comments** on individual annotations, they appear next to the annotation (e.g., "Good catch!", "This is actually a coherence flaw — why?").
4. If the teacher flagged a **bonus find** (a legitimate flaw not in the reference evaluation), it overrides the red "false positive" indicator.

### Teacher: Post-Session

1. Add **session notes** (free-text field at the bottom of the dashboard, auto-saves on blur).
2. The session can be **reopened** (Reviewing → Group) if the teacher advanced too early. Students are notified and can annotate again.
3. Click **Close Session** when done.
4. Closed sessions remain visible on the Sessions list for future reference.
5. Sessions in Setup or Closed status can be **deleted** (with confirmation).

---

## Student Progress

### Student: View Progress

1. Click **Progress** in the top nav.
2. See all past sessions: activity topic, date, detection rate, flaws found/missed.
3. Per-flaw-type breakdown shows which types the student is improving at.

---

## Researcher Workflows

### Researcher: Browse Pipeline

1. Log in as researcher (name + password).
2. The home page lists all activities with metadata: scenario ID, topic, type, agent count, flaw distribution.
3. Click an activity to see the **Pipeline View** with 4 tabs:
   - **Scenario** — Driving question, agent sketches, expected flaws, design notes.
   - **Profiles** — Each agent's knowledge profile (strong, shallow, misconception, blind spot) and disposition.
   - **Transcript** — Full transcript with hidden metadata visible: knowledge areas engaged per section/turn, rationale, reactive tendency activation.
   - **Evaluation** — All flaws with type, source, severity, evidence, explanation.

### Researcher: Browse Sessions

1. Click **Sessions** in the top nav.
2. See all sessions across all teachers: status, activity, group count, annotation counts, match stats.
3. Student data is anonymized (opaque IDs, no names).

### Researcher: Export Data

1. From the Sessions page, click the export buttons:
   - **Export Annotations** — CSV with annotation_id, session_id, group_name, anonymized student_id, item_id, offsets, highlighted text, flaw type, timestamp.
   - **Export Scaffolds** — CSV with scaffold details, level, type, text, context at send, acknowledgment status.
   - **Export Sessions** — CSV with session summaries, per-group match stats.
2. All exports filter to students with `researchConsent = true` only.

---

## Real-time Behavior

These happen automatically — no user action needed:

| Event | What the teacher sees | What students see |
|-------|----------------------|-------------------|
| Student creates annotation | Annotation appears in Live Activity feed + group card count updates | (Own annotation appears immediately; group members see it in group phase) |
| Student deletes annotation | Count updates on group card | Annotation disappears |
| Student confirms annotation | Group answer status updates | Annotation gets green "Group answer" border |
| Teacher sends scaffold | Scaffold appears in group card's "Recent scaffolds" | Blue notification card appears at top of transcript |
| Student acknowledges scaffold | Checkmark appears next to scaffold | Scaffold disappears from their view |
| Teacher advances phase | Dashboard phase indicator updates | Notification banner: "Group Phase — discuss with your team!" / "Review Phase — see how you did!" |
| Student connects/disconnects | Connection dot changes color on group card | (Reconnecting indicator if disconnected) |

---

## Edge Cases

| Situation | What happens |
|-----------|-------------|
| Student joins late | They enter their name, see the session, and can start annotating at whatever phase the session is in. If group phase, they see existing annotations. |
| WiFi drops briefly | Socket.IO auto-reconnects. Annotations made via HTTP still save. Real-time updates resume on reconnect. |
| Teacher reopens session | Phase goes from Reviewing back to Group. Students are notified and can annotate again. Feedback view is hidden until teacher releases again. |
| Teacher deletes session | All groups, annotations, scaffolds, and events are cascaded-deleted. Students see the session disappear from their list. |
| Multiple teachers | Each teacher sees only sessions they own. Multiple teachers can run sessions simultaneously on different activities. |
| Student in multiple sessions | The home page lists all active sessions. The student picks which one to work on. |
| No group answers exist | Feedback compares all annotations (not just confirmed ones) against the reference evaluation. |
