# CrossCheck — Manual Test Script

Step-by-step walkthrough of all features. Three browser windows: researcher, teacher, student.

> **Note:** Parts 7–12 test the **legacy v1 mode system** (teacher-selected modes per group). New sessions use the **three-stage flow** (Recognize → Explain → Locate) — see Part 14. Legacy mode support will be removed once all old sessions are migrated.

## Setup

All commands from `CrossCheck/app/`:

```bash
cd CrossCheck/app
npm run db:reset    # Resets DB, seeds users from seed.yaml, ingests activities
npm run dev          # Start server with Socket.IO
```

Open three browser windows:
- **Window R** (researcher): `http://localhost:3000/auth/login`
- **Window T** (teacher): `http://localhost:3000/auth/login` (incognito or different browser)
- **Window S** (student): `http://localhost:3000/auth/login` (another incognito window)

> `db:reset` seeds test accounts from `seed.yaml` (Dr. Chen, Ms. Johnson, Mr. Davis) and pre-creates classes with students for convenience. Parts 1–3 test the researcher's ability to do this from scratch.

---

## Part 1: Researcher — Teacher Management

### 1.1 Login as researcher
- **Window R**: Enter display name `Dr. Chen`, password `researcher123`
- **Verify**: Lands on Activities page
- **Verify**: Nav shows **Activities | Sessions | Teachers | Mock Data**

### 1.2 Browse teachers
- Click **Teachers** in the nav bar
- **Verify**: Table of existing teachers (Ms. Johnson, Mr. Davis from seed)
- **Verify**: Each row shows: name, username, classes count, sessions count, created date, actions

### 1.3 Create a new teacher
- Click **+ Add Teacher**
- **Verify**: Route is `/researcher/teachers/new`
- Enter display name: `Mrs. Rodriguez`
- Enter password: `teach456`
- Confirm password: `teach456`
- Click **Create Teacher**
- **Verify**: Success message shows login name and password
- Click **Back to teachers**
- **Verify**: Mrs. Rodriguez appears in the table with 0 classes, 0 sessions

### 1.4 Reset a teacher's password
- On the Teachers page, click the reset password action for any teacher
- **Verify**: Password reset completes (or confirmation dialog appears)

---

## Part 2: Researcher — Activity Ingestion

### 2.1 Browse activities
- Click **Activities** in the nav bar
- **Verify**: Activity cards listed (pre-ingested from `db:reset`)
- **Verify**: Each card shows: type badge, scenario ID, topic, agents, flaw distribution, session count

### 2.2 Ingest panel
- **Verify**: "Ingest from Registry" panel at top of page
- Leave the registry path empty (uses default project registry)
- Click **Scan**
- **Verify**: If all scenarios are already ingested, shows "All scenarios in this registry have been ingested."
- If un-ingested scenarios exist: **verify** each shows type badge, topic, agent count, and an **Ingest** button

### 2.3 Delete an activity
- On an activity card with 0 sessions, click the delete button
- **Verify**: Activity is removed from the list
- Re-ingest it via the Ingest panel to restore

### 2.4 Activity pipeline view
- Click any activity card
- **Verify**: Opens `/researcher/activity/[id]` with pipeline view
- **Verify**: 4 tabs — Scenario, Profiles, Transcript, Evaluation
- **Scenario tab**: Driving question, agent sketches, expected flaws, design notes
- **Profiles tab**: Each agent's knowledge profile (strong, shallow, misconception, blind spot) and disposition
- **Transcript tab**: Full transcript with metadata visible (knowledge areas, rationale, reactive tendency)
- **Evaluation tab**: All flaws with type, source, severity, evidence, explanation

---

## Part 3: Researcher — Mock Data & Sessions

### 3.1 Generate mock data
- Click **Mock Data** in the nav bar
- **Verify**: Route is `/researcher/mock`
- **Verify**: Teacher dropdown lists all teachers (including Mrs. Rodriguez)
- Select a teacher (e.g., Mrs. Rodriguez)
- Set class name: "Demo Class"
- Set student count: 20
- Click **Generate Mock Class**
- **Verify**: Success message shows class name, teacher, student count
- **Verify**: Student names listed (login by name, no password)

### 3.2 Browse sessions
- Click **Sessions** in the nav bar
- **Verify**: Lists all sessions across all teachers
- **Verify**: Student data is anonymized (opaque IDs, no names)
- **Verify**: Each session shows: status, activity, group count, annotation counts

### 3.3 Export data
- From the Sessions page, click the export buttons:
- **Export Annotations** — **verify**: CSV downloads with annotation details
- **Export Scaffolds** — **verify**: CSV downloads with scaffold details
- **Export Hints** — **verify**: CSV downloads with hint usage
- **Export Sessions** — **verify**: CSV downloads with session summaries

---

## Part 4: Teacher — Transcripts & Guide

### 4.1 Login as teacher
- **Window T**: Enter display name `Ms. Johnson`, password `teacher123`
- **Verify**: Lands on teacher dashboard showing classes
- **Verify**: Nav shows **Classes | Transcripts | Guide**

### 4.2 Transcripts page
- Click **Transcripts** in the nav bar
- **Verify**: Grid of activity cards (at least 2 if both scenarios ingested)
- **Verify**: Each card shows: topic, type badge (presentation/discussion), agent count, flaw severity counts
- Click any activity card
- **Verify**: Opens `/teacher/activities/[id]` with 3-tab preview (Overview, Meet the Team, Transcript)

### 4.3 Activity preview — Overview tab
- **Verify**: Flaw distribution horizontal bars (Reasoning, Epistemic, Completeness, Coherence) with counts
- **Verify**: Severity line ("N major · N moderate · N minor")
- **Verify**: Key Patterns prose block
- **Verify**: All Flaws list with type badge (R/E/Cp/Co), severity, description
- Click any flaw card — **verify**: switches to Transcript tab and popover opens on the highlighted passage

### 4.4 Activity preview — Meet the Team tab
- Click **Meet the Team**
- **Verify**: Agent cards in 2-column grid, ordered by first transcript appearance
- **Verify**: Each card shows: avatar, name, role, "Speaks in" (section names for presentations, stage names for discussions)
- **Verify**: Disposition pills (confidence, engagement style, expressiveness) + reactive tendency quote
- **Verify**: Expected Flaws section with type badge and description
- **Verify**: Matched expected flaws show "See in transcript →" link; unmatched show "Not detected in transcript" (dimmed)
- Click "See in transcript →" — **verify**: switches to Transcript tab, scrolls to section, popover opens

### 4.5 Activity preview — Transcript tab (Teacher View)
- Click **Transcript**
- **Verify**: Default is "Teacher View" (toggle at top)
- **Verify**: Transcript sections show flaw type badges (R/E/Cp/Co) in the header
- **Verify**: Flaw evidence passages are highlighted with type-colored backgrounds
- Click a highlighted passage — **verify**: Popover appears near the highlight with type badge, severity, description, evidence quote, explanation
- Click elsewhere or press Escape — **verify**: Popover closes
- Click a different highlight — **verify**: Previous popover closes, new one opens
- For cross-section flaws: **verify** popover shows "Also in: [section]" link; clicking it closes popover and scrolls to the other section

### 4.6 Activity preview — Transcript tab (Student View)
- Toggle to **Student View**
- **Verify**: Clean transcript with no highlights, no badges, no popover on click

### 4.7 Guide page — Methodology tab
- Click **Guide** in the nav bar
- **Verify**: "Teacher Guide" heading, two tabs (Methodology, Flaw Types)
- **Verify**: Methodology tab is active by default
- **Verify**: Practice Modes heading with intro text
- **Verify**: "Before starting" note about vocabulary primer (flaw type definitions + quiz)
- **Verify**: 4 horizontal mode cards in 1 row on desktop (Recognize, Locate, Classify, Explain) — no numbering, no Bloom's verbs
- **Verify**: Each card shows: mode name, description, knob label with option pills, and knob tip
- **Verify**: No independence gradient bar, no "More support"/"More independence" visual
- **Verify**: No Session Phases section (removed entirely)
- **Verify**: Scaffolding section with compact 2-column table (Type, What it does) — 6 rows
- **Verify**: No expanded cards, no level numbers, no example templates in scaffolding section
- **Verify**: Note below table: "Pre-written templates are available for each type when sending scaffolds during a session."

### 4.8 Guide page — Flaw Types tab
- Click **Flaw Types** tab
- **Verify**: 4 color-coded cards (Reasoning=red, Epistemic=amber, Completeness=blue, Coherence=purple)
- **Verify**: Each card shows: abbreviation + label in header, definition, 2 example passages with explanations
- **Verify**: "How Flaws Appear in Activities" table at bottom with columns for Presentations and Discussions

---

## Part 5: Teacher — Class & Session Setup

### 5.1 Create a class
- **Window T**: Click **Classes** in nav, then **New Class**
- Enter class name: "6th Grade STEM — Period 3"
- **Verify**: Class is created and you land on the class detail page

### 5.2 Add students to the class
- On the class detail page, add the following 20 students:

| Students |
|----------|
| Maya Johnson, DeAndre Williams, Sophia Chen, Jaylen Brooks, Aaliyah Mitchell |
| Carlos Ramirez, Emma Thompson, Malik Harris, Chloe Patterson, Isaiah Davis |
| Lily Nguyen, Marcus Jackson, Ava Washington, Tyler Lee, Jasmine King |
| Noah Garcia, Brianna Smith, Ethan Moore, Zara Ahmed, Liam Foster |

- **Verify**: All 20 students appear in the class roster

### 5.3 Create a session with differentiated practice modes (legacy v1)
- From the class detail page, click **New Session**
- **Verify**: Route is `/teacher/classes/[classId]/sessions/new`
- Select the **plastic pollution** activity (presentation type)
- Click **Preview** — verify the transcript and evaluation load
- Create 4 groups (students are scoped to this class's roster):

| Group | Students | Practice Mode |
|-------|----------|--------------|
| Group A | Maya Johnson, DeAndre Williams, Sophia Chen, Jaylen Brooks, Aaliyah Mitchell | Classify |
| Group B | Carlos Ramirez, Emma Thompson, Malik Harris, Chloe Patterson, Isaiah Davis | Locate |
| Group C | Lily Nguyen, Marcus Jackson, Ava Washington, Tyler Lee, Jasmine King | Recognize |
| Group D | Noah Garcia, Brianna Smith, Ethan Moore, Zara Ahmed, Liam Foster | Explain |

- **Verify**: Each group shows a "Practice Mode" label with the selected mode pill highlighted
- **Verify**: Below the pills, the mode description is visible (not just a tooltip)
- **Verify**: "Choose any mode — no sequence required." text appears
- Click **Create Session**

---

## Part 6: Student — Vocabulary Primer

### 6.1 Login as a student and access Learn
- **Window S**: Enter name `Noah Garcia`
- Click **Learn** in the top nav bar
- **Verify**: Sees the **definitions screen** (4 flaw type cards with examples)
- **Verify**: No bottom bar, no sidebar

### 6.2 Take the quiz
- Click **Start Quiz**
- Answer a few questions — verify immediate feedback (green/red + explanation)
- **Navigate away** (click "Transcripts" in nav)
- Come back to the Learn page
- **Verify**: Quiz resumes at the same question (not reset)

### 6.3 Learn results
- Complete the quiz
- **Verify**: Results saved to student's active group with "(self)" tag on teacher dashboard

---

## Part 7: Student — Recognize Mode (Group C) [Legacy]

### 7.1 Login as a Group C student
- **Window S**: Log out, enter name `Lily Nguyen`
- Click the active session
- **Verify**: Sees the transcript with **yellow highlighted sentences** within each section (not the whole section)
- **Verify**: Each highlighted sentence has a **numbered badge** (1, 2, 3...)
- **Verify**: Cross-section flaws appear as purple **"Compare sections"** badges at the end of the section
- **Verify**: No bottom bar (read-only — no text selection)
- **Verify**: Score tracker visible

### 7.2 Answer response cards
- Click a highlighted sentence badge
- **Verify**: A **centered popup** appears with a semi-transparent backdrop
- **Verify**: Popup shows "What type of problem is this?" with 4 **color-coded buttons with definitions** (e.g., "Reasoning — The logic doesn't hold up...")
- **Verify**: Click a flaw type — if wrong but attempts remain, shows "Not quite — try again" for 1.5s, then the wrong choice is grayed out
- **Verify**: If correct or out of attempts (default: 2), shows explanation and the badge turns green (correct) or red (wrong)
- **Verify**: Close popup (click backdrop, X, or same badge) — reopen shows preserved state (attempts, eliminated choices)
- **Verify**: Refresh page — answered flaws still show as resolved (green/red badges)
- **Verify**: Score updates after each resolved flaw

---

## Part 8: Teacher — Start Session + Monitor

### 8.1 Start the session
- **Window T**: Open the session dashboard
- Click **Start Session** (transitions to Individual phase)
- **Verify**: Student windows show the session content (may need to refresh if opened before start)

### 8.2 Monitor the dashboard
- **Verify**: 4 group cards visible, each showing the practice mode badge
- **Verify**: Group D shows "Explain", Group C shows "Recognize", Group B shows "Locate", Group A shows "Classify"
- **Verify**: Connection dots update as students connect

---

## Part 9: Student — Locate Mode (Group B) [Legacy]

### 9.1 Login as a Group B student
- **Window S**: Log out, enter name `Carlos Ramirez`
- Click the active session
- **Verify**: Sees a **hint card** at top (flaw type badge + section name + reading strategy)
- **Verify**: Target section is at full opacity, other sections are **dimmed** (faded)
- **Verify**: Previous/Next buttons for navigating hints
- **Verify**: Bottom bar shows single **"Flag This"** button (not 4 type buttons)

### 9.2 Annotate
- Select text in the highlighted (non-dimmed) section
- Click **Flag This**
- **Verify**: Annotation appears as underline
- **Verify**: Sidebar shows the flag in "Your Flags" list

### 9.3 Reference
- In Locate mode, the **hint card** itself serves as the scaffold (flaw type + reading strategy)
- The Flaw Field Guide is available in **Spot and Classify** modes, not Locate (hint card replaces it)
- Students can always access the standalone **Learn** page from the nav bar for full definitions

---

## Part 10: Student — Classify Mode (Group A) [Legacy]

### 10.1 Login as a Group A student
- **Window S**: Log out, enter name `Maya Johnson`
- Click the active session
- **Verify**: Full transcript, no dimming, no hints
- **Verify**: Bottom bar shows **4 flaw type buttons** (Reasoning, Epistemic, Completeness, Coherence)
- **Verify**: Flaw Field Guide in sidebar

### 10.2 Annotate
- Select text, click a flaw type button
- **Verify**: Annotation appears with color matching the flaw type
- Click **Undo** — verify last annotation removed

---

## Part 11: Teacher — Mid-Session Mode Change [Legacy]

### 11.1 Change Group B's mode
- **Window T**: On the dashboard, find Group B's card
- Click the **"Locate"** mode badge
- **Verify**: A dropdown appears with all 6 practice modes
- Select **Spot**
- **Verify**: Badge updates to "Spot"

### 11.2 Verify student sees the change
- **Window S** (logged in as Carlos Ramirez): Page should **auto-refresh**
- **Verify**: Hint card is gone, sections are no longer dimmed
- **Verify**: Bottom bar still shows single "Flag This" button (Spot mode)
- **Verify**: Previous annotations are preserved

---

## Part 12: Teacher — Scaffolding

### 12.1 Send a scaffold
- **Window T**: Click **Send scaffold** on Group A's card
- Pick a template or type a custom message
- Click **Send**
- **Verify**: Scaffold appears on the student's screen (Window S, logged in as Maya Johnson) as a blue notification card
- Student clicks **Dismiss** — verify the scaffold disappears and the teacher dashboard shows a checkmark

---

## Part 13: Group Phase & Review (Legacy)

### 13.1 Advance to Group Phase
- **Window T**: Click **Group Phase**
- **Verify**: Student windows show notification "Group Phase — discuss with your team!"

### 13.2 Student group experience
- **Window S** (any annotating student):
- **Verify**: Can see other group members' annotations
- **Verify**: Each annotation has **Confirm** / **Unconfirm** buttons
- Confirm 2 annotations — **verify** they get a green "Group answer" border after 2 votes

### 13.3 Release evaluation
- **Window T**: Click **Release Evaluation**
- **Verify**: Students transition to feedback view

### 13.4 Student feedback view
- **Window S**:
- **Verify**: Three tabs — Transcript, Your Annotations, Reference Flaws
- **Verify**: Annotations show match colors (green = exact, blue = wrong type, red = false positive)
- **Verify**: Summary stats at top (found X of Y flaws)

### 13.5 Class view
- **Window T**: Click **Class View**
- **Verify**: Projectable screen with aggregate results

---

## Part 14: Three-Stage Flow (v3)

This tests the current session model where every session runs Recognize → Explain → Locate sequentially.

### 14.1 Create a v3 session
- **Window T**: From a class detail page, click **New Session**
- Select an activity
- Create 1 group with 3–4 students
- **Verify**: No mode selection UI — session creation only asks for activity + groups
- Click **Create Session**

### 14.2 Recognize stage (individual)
- **Window S**: Log in as a student in the group
- Click the active session
- **Verify**: Turn-by-turn transcript display (one turn at a time, highlighted)
- **Verify**: 4 flaw type choice buttons (Reasoning, Epistemic, Completeness, Coherence)
- **Verify**: No "No flaw" option
- **Verify**: "Narrow it down" button is visible but disabled (try-first period ~18s)
- Wait for try-first period — **verify** button becomes active
- Click "Narrow it down" — **verify** one wrong choice is removed
- Select a flaw type — **verify** green (correct) or feedback appears
- On a non-flawed turn — **verify** all choices are wrong, productive failure message shown
- Complete all turns — **verify** "Waiting for your group" screen appears

### 14.3 Teacher advances to Explain
- **Window T**: Dashboard shows "X/Y students complete" for the group
- Click **"Move to Explain"**
- **Verify**: Group stage updates to "Explain" on dashboard

### 14.4 Explain stage (group)
- **Window S**: Stage transitions automatically
- **Verify**: Turn-by-turn display with Recognize distribution shown (e.g., "2 said reasoning, 1 said epistemic")
- **Verify**: Step 1 — 4 flaw type choices + "No flaw" option
- **Verify**: Flaw Field Guide available in sidebar
- Select a flaw type (Step 1) — **verify** Step 2 writing area appears
- Write an explanation — **verify** write-then-reveal mechanic (explanation hidden during individual writing period, then revealed)
- **Verify**: "Narrow it down" button with ~45s try-first delay
- Click hint — **verify** Hint 1 reveals the correct flaw type
- Advance through all turns

### 14.5 Locate stage (conditional)
- If flaws remain unidentified after Explain:
  - **Verify**: Full transcript displayed
  - **Verify**: "Your group missed X flaws" message shown
  - **Verify**: Student-targeted hints — tap a section, request hint, get confirm/deny
  - **Verify**: Section denial is free (no hint counted)
  - **Verify**: Hint 2 highlights specific turn, Hint 3 reveals flaw type
- If all flaws were caught:
  - **Verify**: Locate stage is skipped, session goes directly to Results

### 14.6 Results view
- **Verify**: Single view showing journey across all stages
- **Verify**: Recognize results with per-student accuracy and hint usage
- **Verify**: Explain results with group selections, written explanations, hint usage
- **Verify**: Locate results (if triggered) with found/missed counts
- **Verify**: Summary totals (caught in Recognize + corrected in Explain + found in Locate)

---

## Part 15: Student Progress

- **Window S**: Click **Progress** in nav
- **Verify**: Shows completed sessions with detection rate and flaw type breakdown

---

## Part 16: Edge Cases

| Test | Expected |
|------|----------|
| Researcher creates teacher with duplicate name | Error message shown |
| Researcher generates mock class for teacher with no activities | Class created; teacher can create sessions after activities are ingested |
| Researcher deletes activity with active sessions | Delete blocked (session count shown) |
| Student navigates away mid-Learn-quiz, returns | Resumes at same question |
| Student closes and reopens Recognize popup after wrong answer | Attempt count and eliminated choices preserved |
| Student refreshes page during Recognize mode | Answered flaws show green/red badges, score restored |
| Student visits /student/learn then returns to session | Learn results saved to group with "(self)" tag, session state unchanged |
| Teacher dashboard for non-Learn group | Shows "X/Y learned" if students have Learn data; group detail shows Learning Progress section |
| Teacher changes mode to Learn for an annotating group | Student page refreshes to show Learn quiz (annotations preserved in DB for later) |
| Teacher changes mode from Learn to Classify | Student page refreshes to show transcript with 4-button toolbar |
| Student on Recognize mode when teacher advances to Reviewing | Page refreshes to show feedback view |
| WiFi drop during annotation | Annotation saves via HTTP; Socket.IO auto-reconnects |
| Teacher clicks mode badge in setup/closed phase | Badge is not clickable (no hover effect, no dropdown) |
| Student signs out on shared tablet | All crosscheck: localStorage cleared, next student starts fresh |
| Transcripts page with no activities ingested | Shows "No activities available yet." message |
| Activity preview with null metadata (no profiles) | Meet the Team tab shows agent names/roles only with "Profile data not available" |
| Activity preview with null evaluation | Overview tab shows "Evaluation pending — check back shortly." |
| Flaw popover near bottom of viewport | Popover flips above the highlight instead of below |
| Flaw popover near right edge of viewport | Popover shifts left to stay within viewport |
| Click highlighted passage, then click elsewhere | Popover closes |
| Click highlighted passage, then press Escape | Popover closes |
| Click highlighted passage, then click a different highlight | First popover closes, second opens |
| Cross-section flaw popover "Also in" link | Closes popover, scrolls to other section |
| Overview tab flaw click → Transcript tab | Switches tab, scrolls to section, opens popover |
| Meet the Team "See in transcript →" click | Switches tab, scrolls to section, opens popover |
| Guide page scaffolding table | 6 rows, compact table with Type and What it does columns |
| Teacher creates class then deletes it | Class and all associated sessions/groups cascade-deleted |
| Teacher creates session without a class | Not allowed — session creation requires navigating from a class detail page |
| Student logs in before teacher creates class | Student sees no active sessions (not pre-seeded) |
| Fast student finishes Recognize before others (v3) | Sees "Waiting for your group" screen |
| Teacher advances to Explain while student is mid-turn (v3) | Current turn state is preserved; stage transitions |
| All students correct on every Recognize turn (v3) | Explain has no turns to surface; skips to Results |
| Group catches all flaws in Explain (v3) | Locate is skipped; goes to Results |
| Student requests hint during try-first period (v3) | Button is disabled; countdown visible |
| Non-flawed turn in Recognize (v3) | All 4 choices wrong; productive failure feedback shown |
| Structured disagreement in Explain (v3) | Minority voice prompt appears when Recognize results diverge |
