# CrossCheck — Manual Test Script

Step-by-step walkthrough of all features. Use two browser windows: one for the teacher, one for a student.

## Setup

All commands must be run from `CrossCheck/app/` (not `CrossCheck/`):

```bash
cd CrossCheck/app
npx tsx scripts/seed-test-classroom.ts    # 1 teacher + 20 students + 1 researcher
npx tsx scripts/ingest-registry.ts --all  # Load both activities
npm run dev                               # Start server with Socket.IO
```

Open two browser windows:
- **Window T** (teacher): `http://localhost:3000/auth/login`
- **Window S** (student): `http://localhost:3000/auth/login` (use incognito or a different browser)

---

## Part 1: Teacher — Session Setup

### 1.1 Login as teacher
- **Window T**: Enter username `teacher1`, password `teacher123`
- Verify: lands on teacher dashboard with session list

### 1.2 Create a session with differentiated practice modes
- Click **New Session**
- Select the **plastic pollution** activity (presentation type)
- Click **Preview** — verify the transcript and evaluation load
- Create 4 groups:

| Group | Students | Practice Mode |
|-------|----------|--------------|
| Group A | Maya Johnson, DeAndre Williams, Sophia Chen, Jaylen Brooks, Aaliyah Mitchell | Classify |
| Group B | Carlos Ramirez, Emma Thompson, Malik Harris, Chloe Patterson, Isaiah Davis | Locate |
| Group C | Lily Nguyen, Marcus Jackson, Ava Washington, Tyler Lee, Jasmine King | Recognize |
| Group D | Noah Garcia, Brianna Smith, Ethan Moore, Zara Ahmed, Liam Foster | Learn |

- **Verify**: Each group shows a "Practice Mode" label with the selected mode pill highlighted
- **Verify**: Below the pills, the mode description is visible (not just a tooltip)
- **Verify**: "Choose any mode — no sequence required." text appears
- Click **Create Session**

---

## Part 2: Student — Learn Mode (Group D)

### 2.1 Login as a Group D student
- **Window S**: Enter name `Noah Garcia`
- Click the active session
- **Verify**: Sees the **definitions screen** (4 flaw type cards with examples), NOT the transcript
- **Verify**: No bottom bar, no sidebar

### 2.2 Take the quiz
- Click **Start Quiz**
- Answer a few questions — verify immediate feedback (green/red + explanation)
- **Navigate away** (click "Activities" in nav)
- Come back to the session
- **Verify**: Quiz resumes at the same question (not reset)

### 2.3 Standalone Learn page
- Click **Learn** in the top nav bar
- **Verify**: Shows the same definitions + quiz experience
- **Verify**: Results saved to student's active group with "(self)" tag on teacher dashboard

---

## Part 3: Student — Recognize Mode (Group C)

### 3.1 Login as a Group C student
- **Window S**: Log out, enter name `Lily Nguyen`
- Click the active session
- **Verify**: Sees the transcript with **yellow highlighted sentences** within each section (not the whole section)
- **Verify**: Each highlighted sentence has a **numbered badge** (1, 2, 3...)
- **Verify**: Cross-section flaws appear as purple **"Compare sections"** badges at the end of the section
- **Verify**: No bottom bar (read-only — no text selection)
- **Verify**: Score tracker visible

### 3.2 Answer response cards
- Click a highlighted sentence badge
- **Verify**: A **centered popup** appears with a semi-transparent backdrop
- **Verify**: Popup shows "What type of problem is this?" with 4 **color-coded buttons with definitions** (e.g., "Reasoning — The logic doesn't hold up...")
- **Verify**: Click a flaw type — if wrong but attempts remain, shows "Not quite — try again" for 1.5s, then the wrong choice is grayed out
- **Verify**: If correct or out of attempts (default: 2), shows explanation and the badge turns green (correct) or red (wrong)
- **Verify**: Close popup (click backdrop, X, or same badge) — reopen shows preserved state (attempts, eliminated choices)
- **Verify**: Refresh page — answered flaws still show as resolved (green/red badges)
- **Verify**: Score updates after each resolved flaw

---

## Part 4: Teacher — Start Session + Monitor

### 4.1 Start the session
- **Window T**: Open the session dashboard
- Click **Start Session** (transitions to Individual phase)
- **Verify**: Student windows show the session content (may need to refresh if opened before start)

### 4.2 Monitor the dashboard
- **Verify**: 4 group cards visible, each showing the practice mode badge
- **Verify**: Group D shows "Learn", Group C shows "Recognize", Group B shows "Locate", Group A shows "Classify"
- **Verify**: Connection dots update as students connect

---

## Part 5: Student — Locate Mode (Group B)

### 5.1 Login as a Group B student
- **Window S**: Log out, enter name `Carlos Ramirez`
- Click the active session
- **Verify**: Sees a **hint card** at top (flaw type badge + section name + reading strategy)
- **Verify**: Target section is at full opacity, other sections are **dimmed** (faded)
- **Verify**: Previous/Next buttons for navigating hints
- **Verify**: Bottom bar shows single **"Flag This"** button (not 4 type buttons)

### 5.2 Annotate
- Select text in the highlighted (non-dimmed) section
- Click **Flag This**
- **Verify**: Annotation appears as underline
- **Verify**: Sidebar shows the flag in "Your Flags" list

### 5.3 Reference
- In Locate mode, the **hint card** itself serves as the scaffold (flaw type + reading strategy)
- The Flaw Field Guide is available in **Spot and Classify** modes, not Locate (hint card replaces it)
- Students can always access the standalone **Learn** page from the nav bar for full definitions

---

## Part 6: Student — Classify Mode (Group A)

### 6.1 Login as a Group A student
- **Window S**: Log out, enter name `Maya Johnson`
- Click the active session
- **Verify**: Full transcript, no dimming, no hints
- **Verify**: Bottom bar shows **4 flaw type buttons** (Reasoning, Epistemic, Completeness, Coherence)
- **Verify**: Flaw Field Guide in sidebar

### 6.2 Annotate
- Select text, click a flaw type button
- **Verify**: Annotation appears with color matching the flaw type
- Click **Undo** — verify last annotation removed

---

## Part 7: Teacher — Mid-Session Mode Change

### 7.1 Change Group B's mode
- **Window T**: On the dashboard, find Group B's card
- Click the **"Locate"** mode badge
- **Verify**: A dropdown appears with all 6 practice modes
- Select **Spot**
- **Verify**: Badge updates to "Spot"

### 7.2 Verify student sees the change
- **Window S** (logged in as Carlos Ramirez): Page should **auto-refresh**
- **Verify**: Hint card is gone, sections are no longer dimmed
- **Verify**: Bottom bar still shows single "Flag This" button (Spot mode)
- **Verify**: Previous annotations are preserved

---

## Part 8: Teacher — Scaffolding

### 8.1 Send a scaffold
- **Window T**: Click **Send scaffold** on Group A's card
- Pick a template or type a custom message
- Click **Send**
- **Verify**: Scaffold appears on the student's screen (Window S, logged in as Maya Johnson) as a blue notification card
- Student clicks **Dismiss** — verify the scaffold disappears and the teacher dashboard shows a checkmark

---

## Part 9: Group Phase

### 9.1 Advance to Group Phase
- **Window T**: Click **Group Phase**
- **Verify**: Student windows show notification "Group Phase — discuss with your team!"

### 9.2 Student group experience
- **Window S** (any annotating student):
- **Verify**: Can see other group members' annotations
- **Verify**: Each annotation has **Confirm** / **Unconfirm** buttons
- Confirm 2 annotations — **verify** they get a green "Group answer" border after 2 votes

---

## Part 10: Review Phase

### 10.1 Release evaluation
- **Window T**: Click **Release Evaluation**
- **Verify**: Students transition to feedback view

### 10.2 Student feedback view
- **Window S**:
- **Verify**: Three tabs — Transcript, Your Annotations, Reference Flaws
- **Verify**: Annotations show match colors (green = exact, blue = wrong type, red = false positive)
- **Verify**: Summary stats at top (found X of Y flaws)

### 10.3 Class view
- **Window T**: Click **Class View**
- **Verify**: Projectable screen with aggregate results

---

## Part 11: Student Progress

- **Window S**: Click **Progress** in nav
- **Verify**: Shows the session just completed with detection rate and flaw type breakdown

---

## Part 12: Edge Cases

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
