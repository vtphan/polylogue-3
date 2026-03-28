# Design: Per-Group Learning Phases + Student Readiness

## Problem

Currently, phases are session-level — all groups advance together. But groups work at different speeds. The teacher waits for the slowest group before advancing everyone, or advances too early for groups that aren't ready. There's no signal from students about their readiness.

## New Model

Separate session lifecycle from group learning phases.

| Level | States | Who controls |
|-------|--------|-------------|
| **Session** | `active` → `complete` | Teacher |
| **Group** | `individual` → `group` → `reviewing` | Teacher, informed by student readiness |

### Session states

- **Active**: Session is running. Each group progresses independently.
- **Complete**: Session archived. All data preserved for review.

No more `setup` — groups start in `individual` phase as soon as the session is created. Students can begin immediately.

No more `closed` — renamed to `complete`.

### Group phases

Each group has its own phase, stored on the `Group` model:

- **Individual**: Students work alone. Each student sees only their own annotations.
- **Group**: Students see all group members' annotations. Confirm/unconfirm for consensus. Physical discussion.
- **Reviewing**: Feedback revealed. Annotations colored by match result. Reference evaluation visible.

Teacher advances each group independently by clicking a button on the group chip or detail panel.

### Student readiness

Within any phase, students can tap a "Ready" button to signal the teacher. This is informational — it does not advance the phase.

- Group chip shows readiness count: `3/5 ready`
- Readiness resets when the group advances to a new phase
- Teacher sees at a glance which groups are waiting vs. still working

---

## Schema Changes

### Session model

```prisma
model Session {
  // Remove: status field (was setup/individual/group/reviewing/closed)
  // Add: status with only 2 values
  status     SessionStatus @default(active)
  // ... rest unchanged
}

enum SessionStatus {
  active
  complete
}
```

### Group model

```prisma
model Group {
  // Add: phase field
  phase     GroupPhase @default(individual)
  // ... rest unchanged
}

enum GroupPhase {
  individual
  group
  reviewing
}
```

### Student readiness

```prisma
model GroupReady {
  groupId String @map("group_id") @db.Uuid
  userId  String @map("user_id") @db.Uuid

  group   Group  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user    User   @relation(fields: [userId], references: [id])

  @@id([groupId, userId])
  @@map("group_ready")
}
```

Readiness is a join table (not a boolean on GroupMember) so it can be cleared in bulk when phase advances.

### Migration notes

- `SessionStatus` enum changes from 6 values to 2. Existing sessions: `setup`/`individual`/`group`/`reviewing` → `active`, `closed` → `complete`.
- New `GroupPhase` enum with 3 values.
- New `phase` column on `groups` table, default `individual`.
- New `group_ready` table.
- User model gets `groupReady GroupReady[]` relation.

---

## API Changes

### Modified: `PATCH /api/sessions/[id]`

Only accepts `{ status: "complete" }` now. No more phase transitions here.

### New: `PATCH /api/groups/[id]/phase`

Body: `{ phase: "group" | "reviewing" }`

- Validates teacher owns the session
- Phase can only advance forward (individual → group → reviewing)
- Clears readiness signals for the group on advance
- Emits Socket.IO event `group:phase_changed` to the group room

### New: `POST /api/groups/[id]/ready`

Body: `{ ready: true | false }`

- Student toggles their readiness signal
- Creates or deletes a `GroupReady` record
- Emits Socket.IO event `group:ready_changed` to the session room (teacher sees it)

### Modified: `POST /api/sessions`

- No longer sets session status to `setup` — starts as `active`
- Groups created with `phase: "individual"` (default)

### Modified: `GET /api/sessions/[id]`

- Include `group.phase` and readiness counts in response

### Modified: Annotation APIs

- Individual phase filtering: use `group.phase` instead of `session.status`
- Group phase consensus: check `group.phase` instead of `session.status`

---

## Socket.IO Events

### New events

| Event | Emitted by | Rooms | Payload |
|-------|-----------|-------|---------|
| `group:phase_changed` | `PATCH /api/groups/[id]/phase` | group + session | `{ groupId, phase }` |
| `group:ready_changed` | `POST /api/groups/[id]/ready` | session | `{ groupId, userId, ready, readyCount, totalMembers }` |

### Modified events

| Event | Change |
|-------|--------|
| `session:phase_changed` | Removed (replaced by `group:phase_changed`) |

---

## Teacher Dashboard Changes

### Phase bar (top of page)

Remove the 5-step session phase bar. Replace with:

- Session title + "Complete Session" button
- No per-step indicator needed — phase is now per-group

### Group chips (left column)

Each chip shows the group's current phase:

```
┌──────────────────────────────┐
│ ● Group A  5  Classify       │
│ Individual · 3 ann · 3/5 ✓   │
└──────────────────────────────┘
```

- Phase name shown (Individual / Group / Reviewing)
- Readiness count: `3/5 ✓` (3 of 5 students tapped Ready)
- Teacher clicks the chip to see detail, clicks a "Next Phase" button in the detail panel to advance that group

### Group detail panel (right column)

Five sections, top to bottom:

#### Section 1: Header row — name + phase + advance

```
Group A · Classify    Individual → [Start Group Work]
```

- Group name (left)
- Practice mode badge
- Current phase label
- Advance button with next phase name as label:
  - In `individual`: "Start Group Work"
  - In `group`: "Show Results"
  - In `reviewing`: no advance button (terminal phase)
- Reopen button (reviewing → group) shown only in reviewing, with confirmation

#### Section 2: Scaffold

Always visible for active sessions. Same as current: template pills + text input + send button + recent scaffold history (last 3 with checkmarks).

#### Section 3: Group stats

One compact row of aggregate numbers:

```
12 annotations · 4/7 flaws found · 2 sections touched
```

- **Annotation modes** (Locate/Classify/Explain): annotation count, flaws found/missed (derived from matching engine), sections touched
- **Response modes** (Recognize): response count, accuracy percentage
- **Reviewing phase**: adds detection rate

#### Section 4: Individual student stats

One row per student. All stats for a student on a single line — no separate "Learning Progress" section.

```
● Maya Johnson      Quiz 6/8 · 3 ann · 2 confirmed
● DeAndre Williams  Quiz —   · 5 ann · 3 confirmed
○ Sophia Chen       Quiz 7/8 · 1 ann · 0 confirmed
○ Jaylen Brooks     Quiz 4/8 · 0 ann
● Aaliyah Mitchell  Quiz 8/8 · 4 ann · 1 confirmed
```

Per student:
- **Connection dot**: ● green (connected) / ○ gray (disconnected)
- **Name**
- **Quiz**: Learn quiz score if taken, "—" if not. Format: `Quiz N/M`
- **Activity stat** (adapts per mode):
  - Recognize: `N/M correct` (response accuracy)
  - Locate/Classify/Explain: `N ann` (annotation count)
- **Confirmed** (group phase only): how many of their annotations received group consensus. Omitted in individual phase.
- **Ready indicator**: checkmark if student tapped "Ready" (once readiness feature exists)

Compact layout: use `text-xs`, `tabular-nums` for alignment, truncate long names.

#### Section 5: Annotation list + transcript (collapsible)

```
▸ Annotations (12)        [View on transcript]
  "Studies consistently show..." · Reasoning · Maya
  "without exception" · Epistemic · DeAndre
  ...
```

- Collapsed by default — teacher expands when they want the deep dive
- "View on transcript" toggle shows annotations overlaid on the actual transcript
- Each annotation row: highlighted text (truncated), flaw type badge, student name
- In reviewing: match color (green/blue/red) on each annotation
- Comment/Bonus actions on each annotation (existing functionality)

### "Complete Session" button

In the session header (top of page), replaces the old phase-advance buttons. Shown when teacher is ready to archive. Warning if some groups haven't reached reviewing: "Groups B, D haven't seen results yet. Complete anyway?"

---

## Student View Changes

### Ready button

- Appears at the bottom of the annotation interface (or as a floating button)
- "I'm ready" / "Not ready" toggle
- Shows how many group members are ready: "3 of 5 ready"
- Disabled in reviewing phase (no next phase for students to be ready for)

### Phase transitions

- When teacher advances the group: student screen refreshes automatically (Socket.IO event)
- Individual → Group: "Your group is now discussing! You can see everyone's annotations."
- Group → Reviewing: "Results are in! See how your group did."

---

## Edge Cases

| Situation | Behavior |
|-----------|----------|
| Teacher completes session while some groups are in individual | Warning: "Groups B, D haven't seen results yet. Complete anyway?" |
| Student joins late, group already in group phase | They enter group phase directly, see all annotations |
| All students in a group tap Ready | Visual indicator on chip (e.g., green border or checkmark). Teacher still must click to advance. |
| Teacher wants to reopen a reviewing group | Allow reviewing → group (same as current reopen behavior, but per-group) |
| Class View while groups are at different phases | Only shows data for groups in reviewing phase |

---

## Implementation Sequence

1. **Schema migration**: New enum, add `phase` to Group, create `group_ready` table, simplify `SessionStatus` enum
2. **API changes**: Group phase endpoint, ready endpoint, modify session/annotation APIs
3. **Socket.IO**: New events for group phase changes and readiness
4. **Dashboard**: Remove session phase bar, add phase + readiness to group chips, add advance button to detail panel
5. **Student view**: Add ready button, update phase transition handling to use group phase
6. **Cleanup**: Remove old session status values, update docs
