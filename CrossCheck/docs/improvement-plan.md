# CrossCheck — Improvement Plan (Post-v1)

This plan covers Tiers 1-4. Tiers 1-3 are complete. Tier 4 contains lower-priority items for future iteration.

---

## Status

| Tier | Status |
|------|--------|
| Tier 1: Before Classroom Use | **Complete** |
| Tier 2: Quality-of-Life | **Complete** |
| Tier 3: Learning Enhancements | **Complete** |
| Tier 4: Future Improvements | Not started |

Additionally, a comprehensive code review was conducted and all critical/high findings were fixed:
- Auth simplified to name-only login for students (passwords removed)
- Socket.IO room joins validated against database
- JWT salt fixed for production HTTPS
- Individual phase annotation leak fixed
- Researcher pages auth checks added
- Research consent enforced in exports
- Cascading deletes added to schema
- Session delete simplified (atomic)
- Fetch error handling added to dashboard
- Socket.IO double-delivery prevented
- Performance optimizations (useMemo)

---

## Tier 1: Before Classroom Use (Complete)

### 1.1 Teacher Evaluation Access

**Problem:** Teacher sees stats (found/missed counts) but cannot read flaw descriptions, evidence, or explanations. They can't prep for a session, write targeted scaffolds, or exercise professional judgment about the AI evaluation.

**Solution:** Add an "Evaluation" tab to the teacher session dashboard.

**Files to modify:**
- `src/app/teacher/sessions/[id]/session-dashboard.tsx` — add Evaluation tab/panel
- `src/app/api/sessions/[id]/route.ts` — already returns `activity` with evaluation; ensure `evaluation` field is included in the response

**Design:**
- Tab or expandable section on the dashboard (not a separate page — teacher needs it alongside the group overview)
- Shows all reference flaws: flaw type badge, severity, location, description, evidence quote, explanation
- Available at **all phases** (not gated by reviewing) — this is the teacher's answer key
- Also accessible from the session creation flow as a preview

**New component:** `<EvaluationPanel>` — reusable, shows a list of flaws with full details. Used by teacher dashboard and potentially by the activity preview.

---

### 1.2 Transcript in Feedback View

**Problem:** In reviewing mode, students see the feedback view (annotations + reference flaws) but the actual transcript is gone. They can't re-read what the agents said while reviewing the flaw explanations.

**Solution:** Add the transcript as a third column (or a toggleable panel) in the feedback view.

**Files to modify:**
- `src/components/feedback/feedback-view.tsx` — add transcript panel
- `src/app/student/session/[id]/page.tsx` — pass transcript data to FeedbackView

**Design:**
- Three-column layout on large screens: Transcript (left) | Your Annotations (center) | Reference Flaws (right)
- On smaller screens: tabbed view (Transcript / Your Annotations / Reference Flaws)
- Transcript shows annotations with match-colored underlines (green/red/blue instead of flaw-type colors) so students can see which highlights were correct
- Reference flaws link to their location in the transcript (click to scroll)

---

### 1.3 Activity Preview Before Session Creation

**Problem:** Teacher picks activities from a dropdown without seeing the content. They need to read the transcript and evaluation to decide if it's appropriate for their class.

**Solution:** Add a preview link/modal from the session creation form + a standalone teacher activity preview page.

**Files to create:**
- `src/app/teacher/activities/[id]/page.tsx` — teacher activity preview page

**Files to modify:**
- `src/app/teacher/sessions/new/create-session-form.tsx` — add "Preview" link next to activity dropdown

**Design:**
- When teacher selects an activity in the dropdown, a "Preview" link appears
- Preview page shows: transcript (content only, same as student view) + full evaluation (same as the EvaluationPanel from 1.1)
- Uses `transcriptContent` (metadata stripped) — teacher sees what students will see
- Evaluation section uses the same `<EvaluationPanel>` component from 1.1

---

### ~~1.4 Password Reset~~ — Superseded

Password reset was implemented then removed. Auth was simplified: students log in by name only (no password). Teachers and researchers still use passwords. The password reset API route and UI button have been deleted.

---

### ~~1.5 Research Consent Enforcement~~ — Removed

Out of scope. Research consent is handled externally (IRB process), not within the app. Researcher access is controlled at account creation. The `researchConsent` field remains in the schema but is not enforced by the app.

---

## Tier 2: Quality-of-Life (Complete)

### 2.1 Teacher Sees Annotations on Transcript

**Problem:** Group detail shows an annotation list but not overlaid on the actual text. Teacher can't see what students highlighted in context.

**Solution:** Add a transcript view to the group detail panel with annotations overlaid.

**Files to modify:**
- `src/app/teacher/sessions/[id]/session-dashboard.tsx` — expand GroupDetail to show transcript

**Design:**
- When teacher clicks a group, the detail panel includes a read-only transcript with student annotations shown as colored underlines
- Reuses `<PresentationView>` or `<DiscussionView>` with annotations passed in but `onTextSelected` disabled
- Each annotation underline shows which student made it (via tooltip or small label)
- Match indicators (green/red/blue) shown when in reviewing phase

**Dependency:** This reuses existing transcript components — no new components needed.

---

### 2.2 Session Notes

**Problem:** Teacher can't record observations about a session.

**Solution:** Add a notes text field to the session dashboard.

**Files to modify:**
- `src/app/api/sessions/[id]/route.ts` — accept `notes` in PATCH body
- `src/app/teacher/sessions/[id]/session-dashboard.tsx` — add notes textarea

**Schema change:**
- Add `notes` field to `Session` model (String, nullable) via Prisma migration

**Design:**
- Expandable textarea at the bottom of the dashboard
- Auto-saves on blur (PATCH to session with `{ notes: "..." }`)
- Preserved across phases, visible when session is closed
- Included in researcher session export

---

### 2.3 Scaffold Library

**Problem:** Every scaffold is typed from scratch. Repetitive during live sessions.

**Solution:** Pre-loaded scaffold templates that teacher can send with one click or customize.

**Files to create:**
- `src/lib/scaffold-templates.ts` — static template library

**Files to modify:**
- `src/app/teacher/sessions/[id]/session-dashboard.tsx` — scaffold form gets a template picker

**Design:**
- Templates organized by the 6 scaffold levels from the concept doc:
  1. Attention redirect: "Take another look at {section}."
  2. Comparison prompt: "Compare what {agent_a} says about {topic} with what {agent_b} says."
  3. Category nudge: "You've found {type} flaws — are there other types of problems?"
  4. Question prompt: "Does the evidence {agent} cites actually support their conclusion?"
  5. Flaw type hint: "There's a {type} flaw in {location}."
  6. Metacognitive: "Your group disagreed about {location} — what would help you decide?"
- Template picker appears above the free-text input
- Click a template → fills the text field with the template text, teacher can edit before sending
- Some templates have `{placeholders}` that get filled from the session context (agent names, section IDs)
- Teacher can also type freely (current behavior preserved)

---

### 2.4 Bulk Student Creation

**Problem:** Creating 30 students one at a time is tedious.

**Solution:** Batch creation form — enter multiple names at once.

**Files to modify:**
- `src/app/teacher/students/new/page.tsx` — add batch mode

**Design:**
- Toggle between "Add one" (current form) and "Add batch"
- Batch mode: textarea where teacher enters one name per line
- System auto-generates usernames and passwords for all
- All credentials shown in the green results box with "Copy all" button
- API: extend `POST /api/users` to accept an array, or create `POST /api/users/batch`

---

### 2.5 Session Delete

**Problem:** No way to remove test sessions. Clutters the teacher dashboard.

**Solution:** Delete button with confirmation.

**Files to create:**
- `src/app/api/sessions/[id]/route.ts` — add DELETE handler

**Files to modify:**
- `src/app/teacher/sessions/[id]/session-dashboard.tsx` — add delete button (only in setup or closed status)

**Design:**
- Delete available only when session is in `setup` or `closed` status
- Confirmation dialog: "Delete this session? This removes all groups, annotations, and scaffolds."
- Cascading delete: session → groups → group_members, annotations, scaffolds, session_events
- Redirect to `/teacher` after deletion

---

## Tier 3: Learning Experience Enhancements (Complete)

### 3.1 Student Progress Across Sessions

**Problem:** No cross-session view. Students can't see improvement. Teachers can't track growth.

**Solution:** Progress dashboard for students and a student detail view for teachers.

**Files to create:**
- `src/app/student/progress/page.tsx` — student progress page
- `src/app/teacher/students/[id]/page.tsx` — teacher view of student history

**Files to modify:**
- `src/app/student/layout.tsx` — add "Progress" link to nav

**Design:**

**Student progress page:**
- List of all sessions the student participated in
- Per-session: activity topic, date, detection rate, flaws found/missed, flaw type breakdown
- Trend line or simple table showing detection rate over time
- "You're getting better at spotting epistemic flaws" type insights (computed from by-type trends)

**Teacher student detail:**
- Click a student name on the students page → see their session history
- Same data as student progress but for any student
- Useful for parent conferences and progress reports

**Data source:** All data already exists in the database — this is purely a new query + display.

---

### 3.2 Practice Modes

**Problem:** All students get the same annotation interface. Teacher can't differentiate by group ability.

**Solution:** Per-session practice mode setting that changes the bottom bar and feedback.

**Files to modify:**
- `src/app/teacher/sessions/new/create-session-form.tsx` — add practice mode selector
- `src/app/api/sessions/route.ts` — store practice mode in session.config
- `src/components/annotation/flaw-toolbar.tsx` — adapt bottom bar based on mode
- `src/app/student/session/[id]/page.tsx` — pass practice mode to viewer
- `src/components/feedback/feedback-view.tsx` — adapt feedback based on mode

**Modes:**

| Mode | Bottom Bar | Annotations | Feedback |
|------|-----------|-------------|----------|
| **Spot** | One button: "Flag this" (no flaw type) | Location only, no type | Shows correct types in feedback |
| **Spot + Classify** | 4 flaw type buttons (current) | Location + type | Full match comparison (current) |
| **Full** | 4 flaw type buttons + severity dropdown + explanation field | Location + type + severity + explanation | Full comparison + severity accuracy |

**Schema:** `session.config.difficulty_mode: "spot" | "classify" | "full"` — already a JSONB field (internal name; user-facing label is "Practice Mode").

**Note:** Spot mode requires changes to the matching engine — match by location only (any annotation at the flaw's location counts as "found" regardless of type).

---

### 3.3 Group Consensus Flow

**Problem:** In group phase, students see each other's annotations but have no structured way to agree on a group answer. The `isGroupAnswer` and `confirmedBy` fields exist but aren't used.

**Solution:** After individual phase, add a consensus step where groups vote on which annotations to keep.

**Files to modify:**
- `src/app/student/session/[id]/session-activity-viewer.tsx` — add consensus UI in group phase
- `src/app/api/annotations/[id]/route.ts` — add PATCH for confirming/promoting to group answer
- `src/components/annotation/flaw-toolbar.tsx` — different bottom bar in group phase

**Design:**

**Group phase UI:**
- All individual annotations visible (color-coded by student)
- Each annotation card shows confirm/reject buttons
- When 2+ group members confirm → annotation promoted to "group answer" (isGroupAnswer = true, confirmedBy = [userIds])
- Group answer annotations get a distinct visual style (solid border vs dashed)
- Students can also create new group annotations
- Only group answer annotations are compared against the reference evaluation in feedback

**Phase flow change:**
- Individual phase: annotate alone (current)
- Group phase: see all annotations, discuss physically, vote to confirm/reject
- Reviewing phase: feedback shows group answer annotations vs reference

---

### 3.4 Teacher Feedback on Annotations

**Problem:** Teacher can't comment on individual student annotations. Can only send general scaffolds to a group.

**Solution:** Teacher can add comments to specific annotations, visible to the student after evaluation release.

**Files to create:**
- `src/app/api/annotations/[id]/comments/route.ts` — teacher adds comment to annotation

**Schema change:**
- New `AnnotationComment` model: id, annotationId, teacherId, text, createdAt

**Files to modify:**
- `src/app/teacher/sessions/[id]/session-dashboard.tsx` — add comment input in group detail annotation list
- `src/components/feedback/feedback-view.tsx` — show teacher comments on annotations in reviewing phase

**Design:**
- In reviewing phase on teacher dashboard, each annotation in the group detail has a small "Comment" button
- Teacher types a short comment (e.g., "Good catch!", "This is actually a coherence flaw — why?", "Bonus find!")
- Comments appear next to annotations in the student feedback view
- Teacher can also flag "bonus" annotations — flaws the student found that weren't in the reference evaluation
- Bonus flags override the "red" (false positive) match category

---

## Implementation Order

Dependencies flow top-to-bottom. Items at the same level can be built in parallel.

```
1.1 Teacher Evaluation Access ─────────────────────────────────────┐
    └─ creates <EvaluationPanel> component                         │
                                                                   │
1.3 Activity Preview ──────────────────────────────────────────────┤
    └─ reuses <EvaluationPanel> from 1.1                           │
                                                                   │
1.2 Transcript in Feedback ────────────────────────────────────────┤
    └─ independent (modifies FeedbackView)                         │
                                                                   │
1.4 Password Reset ────────────────────────────────────────────────┤
1.5 Research Consent ──────────────────────────────────────────────┤
    └─ both independent, small                                     │
                                                                   │
──── Tier 1 complete, ready for classroom ─────────────────────────┘
                                                                   │
2.1 Teacher Annotations on Transcript ─────────────────────────────┤
2.2 Session Notes ─────────────────────────────────────────────────┤
2.3 Scaffold Library ──────────────────────────────────────────────┤
2.4 Bulk Student Creation ─────────────────────────────────────────┤
2.5 Session Delete ────────────────────────────────────────────────┤
    └─ all independent, any order                                  │
                                                                   │
──── Tier 2 complete ──────────────────────────────────────────────┘
                                                                   │
3.1 Student Progress ──────────────────────────────────────────────┤
    └─ independent (new pages, existing data)                      │
                                                                   │
3.2 Practice Modes ───────────────────────────────────────────────┤
    └─ modifies matching engine + bottom bar + feedback            │
                                                                   │
3.3 Group Consensus ───────────────────────────────────────────────┤
    └─ modifies session viewer + annotation model                  │
    └─ should come before 3.4                                      │
                                                                   │
3.4 Teacher Annotation Feedback ───────────────────────────────────┤
    └─ requires schema migration (new model)                       │
    └─ builds on 3.3's group answer concept                        │
```

---

## Schema Migrations Required

| Improvement | Migration |
|------------|-----------|
| 2.2 Session Notes | Add `notes: String?` to Session model |
| 3.4 Teacher Annotation Feedback | New `AnnotationComment` model (id, annotationId, teacherId, text, createdAt) |

All other improvements use existing schema fields or JSONB config.

---

## Tier 4: Future Improvements (Not Started)

Lower-priority items. None are blocking classroom deployment.

### 4.1 Scenario Ingestion from UI

**Problem:** Activities are imported via CLI only (`npx tsx scripts/ingest-registry.ts --all`).

**Solution:** Add an admin page or "Refresh activities" button for teachers to trigger ingestion from the browser.

---

### 4.2 SessionEvent Analysis

**Problem:** Events are logged to the `session_events` table (phase changes, scaffold sends, annotation creates) but never queried or displayed. Rich data for researchers (phase timing, scaffold patterns).

**Solution:** Add event timeline to researcher session view and include in CSV export.

---

### 4.3 Scaffold Outcome Computation

**Problem:** The `outcome` field on scaffolds is nullable and never populated. Designed for post-session analysis correlating scaffold timestamps with subsequent annotation timestamps.

**Solution:** Post-session batch script to compute `annotations_after_5min`, `target_section_annotated`, `flaw_found_at_target`. Add to researcher scaffold export.

---

### 4.4 Mobile/Tablet Flaw Palette

**Problem:** The FlawPalette sidebar is `hidden lg:block`. Tablet users only have the bottom bar — no way to see the annotation list or delete annotations. No touch event handling for text selection.

**Solution:** Collapsible panel above the bottom bar on smaller screens. Add `onTouchEnd` handling for mobile text selection.

---

### 4.5 "Full" Practice Mode Completion

**Problem:** The schema has `severity` and `explanation` fields on annotations. The UI shows 3 practice modes but "Full" (severity + explanation) isn't fully wired.

**Solution:** Add severity dropdown and explanation textarea to the bottom bar in Full mode. Include severity accuracy in feedback comparison.

---

### 4.6 IndexedDB Offline Annotation Queue

**Problem:** If WiFi drops, annotations made during disconnection are lost (HTTP fetch fails). Socket.IO auto-reconnects but doesn't replay failed HTTP requests.

**Solution:** Store annotations in IndexedDB when fetch fails. Drain queue on reconnect. Server deduplicates by (groupId, userId, location, flawType).

**Status:** Deferred — Socket.IO auto-reconnection handles brief drops. Classroom WiFi is reliable enough for now.

---

### 4.7 Idle Detection on Teacher Dashboard

**Problem:** Connection status shows only active (connected) vs disconnected. No "connected but idle for N minutes" state.

**Solution:** Server tracks `lastActivity` timestamps. Dashboard polls or receives periodic updates. Show yellow dot for idle groups (connected but no events in N minutes).
