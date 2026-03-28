# CrossCheck — Manual Test Script

Step-by-step walkthrough of all features. Use two browser windows: one for the teacher, one for a student.

## Setup

All commands must be run from `CrossCheck/app/` (not `CrossCheck/`):

```bash
cd CrossCheck/app
npm run db:reset    # Resets DB, seeds users from seed.yaml, ingests activities
npm run dev          # Start server with Socket.IO
```

Open two browser windows:
- **Window T** (teacher): `http://localhost:3000/auth/login`
- **Window S** (student): `http://localhost:3000/auth/login` (use incognito or a different browser)

---

## Part 1: Teacher — Transcripts & Guide

### 1.1 Transcripts page
- **Window T**: Log in with display name `Ms. Johnson`, password `teacher123`
- Click **Transcripts** in the nav bar
- **Verify**: Grid of activity cards (at least 2 if both scenarios ingested)
- **Verify**: Each card shows: topic, type badge (presentation/discussion), agent count, flaw severity counts
- Click any activity card
- **Verify**: Opens `/teacher/activities/[id]` with 3-tab preview (Overview, Meet the Team, Transcript)

### 1.2 Activity preview — Overview tab
- **Verify**: Flaw distribution horizontal bars (Reasoning, Epistemic, Completeness, Coherence) with counts
- **Verify**: Severity line ("N major · N moderate · N minor")
- **Verify**: Key Patterns prose block
- **Verify**: All Flaws list with type badge (R/E/Cp/Co), severity, description
- Click any flaw card — **verify**: switches to Transcript tab and popover opens on the highlighted passage

### 1.3 Activity preview — Meet the Team tab
- Click **Meet the Team**
- **Verify**: Agent cards in 2-column grid, ordered by first transcript appearance
- **Verify**: Each card shows: avatar, name, role, "Speaks in" (section names for presentations, stage names for discussions)
- **Verify**: Disposition pills (confidence, engagement style, expressiveness) + reactive tendency quote
- **Verify**: Expected Flaws section with type badge and description
- **Verify**: Matched expected flaws show "See in transcript →" link; unmatched show "Not detected in transcript" (dimmed)
- Click "See in transcript →" — **verify**: switches to Transcript tab, scrolls to section, popover opens

### 1.4 Activity preview — Transcript tab (Teacher View)
- Click **Transcript**
- **Verify**: Default is "Teacher View" (toggle at top)
- **Verify**: Transcript sections show flaw type badges (R/E/Cp/Co) in the header
- **Verify**: Flaw evidence passages are highlighted with type-colored backgrounds
- Click a highlighted passage — **verify**: Popover appears near the highlight with type badge, severity, description, evidence quote, explanation
- Click elsewhere or press Escape — **verify**: Popover closes
- Click a different highlight — **verify**: Previous popover closes, new one opens
- For cross-section flaws: **verify** popover shows "Also in: [section]" link; clicking it closes popover and scrolls to the other section

### 1.5 Activity preview — Transcript tab (Student View)
- Toggle to **Student View**
- **Verify**: Clean transcript with no highlights, no badges, no popover on click

### 1.6 Guide page — Methodology tab
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

### 1.7 Guide page — Flaw Types tab
- Click **Flaw Types** tab
- **Verify**: 4 color-coded cards (Reasoning=red, Epistemic=amber, Completeness=blue, Coherence=purple)
- **Verify**: Each card shows: abbreviation + label in header, definition, 2 example passages with explanations
- **Verify**: "How Flaws Appear in Activities" table at bottom with columns for Presentations and Discussions

---

## Part 2: Teacher — Class & Session Setup

### 2.1 Login as teacher
- **Window T**: Enter display name `Ms. Johnson`, password `teacher123`
- **Verify**: Lands on teacher dashboard showing classes (not sessions)

### 2.2 Create a class
- Click **New Class** (or equivalent button on the classes page)
- Enter a class name (e.g., "6th Grade STEM — Period 3")
- **Verify**: Class is created and you land on the class detail page

### 2.3 Add students to the class
- On the class detail page, add the following 20 students:

| Students |
|----------|
| Maya Johnson, DeAndre Williams, Sophia Chen, Jaylen Brooks, Aaliyah Mitchell |
| Carlos Ramirez, Emma Thompson, Malik Harris, Chloe Patterson, Isaiah Davis |
| Lily Nguyen, Marcus Jackson, Ava Washington, Tyler Lee, Jasmine King |
| Noah Garcia, Brianna Smith, Ethan Moore, Zara Ahmed, Liam Foster |

- **Verify**: All 20 students appear in the class roster

### 2.4 Create a session with differentiated practice modes
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

## Part 3: Student — Vocabulary Primer

### 3.1 Login as a student and access Learn
- **Window S**: Enter name `Noah Garcia`
- Click **Learn** in the top nav bar
- **Verify**: Sees the **definitions screen** (4 flaw type cards with examples)
- **Verify**: No bottom bar, no sidebar

### 3.2 Take the quiz
- Click **Start Quiz**
- Answer a few questions — verify immediate feedback (green/red + explanation)
- **Navigate away** (click "Transcripts" in nav)
- Come back to the Learn page
- **Verify**: Quiz resumes at the same question (not reset)

### 3.3 Learn results
- Complete the quiz
- **Verify**: Results saved to student's active group with "(self)" tag on teacher dashboard

---

## Part 4: Student — Recognize Mode (Group C)

### 4.1 Login as a Group C student
- **Window S**: Log out, enter name `Lily Nguyen`
- Click the active session
- **Verify**: Sees the transcript with **yellow highlighted sentences** within each section (not the whole section)
- **Verify**: Each highlighted sentence has a **numbered badge** (1, 2, 3...)
- **Verify**: Cross-section flaws appear as purple **"Compare sections"** badges at the end of the section
- **Verify**: No bottom bar (read-only — no text selection)
- **Verify**: Score tracker visible

### 4.2 Answer response cards
- Click a highlighted sentence badge
- **Verify**: A **centered popup** appears with a semi-transparent backdrop
- **Verify**: Popup shows "What type of problem is this?" with 4 **color-coded buttons with definitions** (e.g., "Reasoning — The logic doesn't hold up...")
- **Verify**: Click a flaw type — if wrong but attempts remain, shows "Not quite — try again" for 1.5s, then the wrong choice is grayed out
- **Verify**: If correct or out of attempts (default: 2), shows explanation and the badge turns green (correct) or red (wrong)
- **Verify**: Close popup (click backdrop, X, or same badge) — reopen shows preserved state (attempts, eliminated choices)
- **Verify**: Refresh page — answered flaws still show as resolved (green/red badges)
- **Verify**: Score updates after each resolved flaw

---

## Part 5: Teacher — Start Session + Monitor

### 5.1 Start the session
- **Window T**: Open the session dashboard
- Click **Start Session** (transitions to Individual phase)
- **Verify**: Student windows show the session content (may need to refresh if opened before start)

### 5.2 Monitor the dashboard
- **Verify**: 4 group cards visible, each showing the practice mode badge
- **Verify**: Group D shows "Explain", Group C shows "Recognize", Group B shows "Locate", Group A shows "Classify"
- **Verify**: Connection dots update as students connect

---

## Part 6: Student — Locate Mode (Group B)

### 6.1 Login as a Group B student
- **Window S**: Log out, enter name `Carlos Ramirez`
- Click the active session
- **Verify**: Sees a **hint card** at top (flaw type badge + section name + reading strategy)
- **Verify**: Target section is at full opacity, other sections are **dimmed** (faded)
- **Verify**: Previous/Next buttons for navigating hints
- **Verify**: Bottom bar shows single **"Flag This"** button (not 4 type buttons)

### 6.2 Annotate
- Select text in the highlighted (non-dimmed) section
- Click **Flag This**
- **Verify**: Annotation appears as underline
- **Verify**: Sidebar shows the flag in "Your Flags" list

### 6.3 Reference
- In Locate mode, the **hint card** itself serves as the scaffold (flaw type + reading strategy)
- The Flaw Field Guide is available in **Spot and Classify** modes, not Locate (hint card replaces it)
- Students can always access the standalone **Learn** page from the nav bar for full definitions

---

## Part 7: Student — Classify Mode (Group A)

### 7.1 Login as a Group A student
- **Window S**: Log out, enter name `Maya Johnson`
- Click the active session
- **Verify**: Full transcript, no dimming, no hints
- **Verify**: Bottom bar shows **4 flaw type buttons** (Reasoning, Epistemic, Completeness, Coherence)
- **Verify**: Flaw Field Guide in sidebar

### 7.2 Annotate
- Select text, click a flaw type button
- **Verify**: Annotation appears with color matching the flaw type
- Click **Undo** — verify last annotation removed

---

## Part 8: Teacher — Mid-Session Mode Change

### 8.1 Change Group B's mode
- **Window T**: On the dashboard, find Group B's card
- Click the **"Locate"** mode badge
- **Verify**: A dropdown appears with all 6 practice modes
- Select **Spot**
- **Verify**: Badge updates to "Spot"

### 8.2 Verify student sees the change
- **Window S** (logged in as Carlos Ramirez): Page should **auto-refresh**
- **Verify**: Hint card is gone, sections are no longer dimmed
- **Verify**: Bottom bar still shows single "Flag This" button (Spot mode)
- **Verify**: Previous annotations are preserved

---

## Part 9: Teacher — Scaffolding

### 9.1 Send a scaffold
- **Window T**: Click **Send scaffold** on Group A's card
- Pick a template or type a custom message
- Click **Send**
- **Verify**: Scaffold appears on the student's screen (Window S, logged in as Maya Johnson) as a blue notification card
- Student clicks **Dismiss** — verify the scaffold disappears and the teacher dashboard shows a checkmark

---

## Part 10: Group Phase

### 10.1 Advance to Group Phase
- **Window T**: Click **Group Phase**
- **Verify**: Student windows show notification "Group Phase — discuss with your team!"

### 10.2 Student group experience
- **Window S** (any annotating student):
- **Verify**: Can see other group members' annotations
- **Verify**: Each annotation has **Confirm** / **Unconfirm** buttons
- Confirm 2 annotations — **verify** they get a green "Group answer" border after 2 votes

---

## Part 11: Review Phase

### 11.1 Release evaluation
- **Window T**: Click **Release Evaluation**
- **Verify**: Students transition to feedback view

### 11.2 Student feedback view
- **Window S**:
- **Verify**: Three tabs — Transcript, Your Annotations, Reference Flaws
- **Verify**: Annotations show match colors (green = exact, blue = wrong type, red = false positive)
- **Verify**: Summary stats at top (found X of Y flaws)

### 11.3 Class view
- **Window T**: Click **Class View**
- **Verify**: Projectable screen with aggregate results

---

## Part 12: Student Progress

- **Window S**: Click **Progress** in nav
- **Verify**: Shows the session just completed with detection rate and flaw type breakdown

---

## Part 13: Edge Cases

| Test | Expected |
|------|----------|
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
