# Design: Session Creation Redesign

## Problem

The current session creation form repeats the full student roster inside every group card. With 20 students and 4 groups, 80 pill buttons render on the page. On tablets, this means heavy scrolling and cognitive overhead — the teacher scans the same list repeatedly, tracking grayed-out pills to figure out who's still unassigned. With larger classes the problem worsens linearly.

## Current State

**Route:** `/teacher/sessions/new`

**Current layout per group:** Group name (editable) + full student roster as pills (blue = in this group, gray = in another group, white = unassigned) + practice mode pills + knob selector. Each group is a tall card. The page grows with `groups × students`.

**File:** `CrossCheck/app/src/app/teacher/sessions/new/create-session-form.tsx`

## Design: Select-then-assign

Replace per-group student lists with a **single roster** and an **active group selector**.

### Layout

Single page, vertical scroll, three sections:

```
┌─────────────────────────────────────────────────────┐
│  Activity: [Select an activity...          ▼]       │
│  Preview transcript & evaluation                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Groups    [+ Add]               [Auto-assign]      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Group A  │ │ Group B  │ │ Group C  │ │ Group D  │ │
│  │ 5 students│ 5 students│ 0 students│ 0 students│ │
│  │ Classify │ │ Locate   │ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  ▲ active                                           │
│                                                     │
│  Practice Mode (Group A)                            │
│  [Recognize] [Locate] [Classify●] [Explain]         │
│  Open search                                        │
│  Categorization: [Detect only] [Assisted] [Full●]   │
│                                                     │
├─ Students ──────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ A  Maya   │ │ A  DeAndre│ │ A  Sophia │ │ ○ Lily │ │
│  │ B  Carlos │ │ B  Emma   │ │ B  Malik  │ │ ○ Marcus│ │
│  │ A  Jaylen │ │ A  Aaliyah│ │ ○ Tyler   │ │ ○ Zara │ │
│  │ ...       │ │          │ │          │ │        │ │
│                                                     │
│  4 unassigned                                       │
│                                                     │
│  [Create Session]                                   │
└─────────────────────────────────────────────────────┘
```

### Section 1: Activity Selector

Same as current. Dropdown + preview link. No changes.

### Section 2: Group Bar + Mode Config

**Group bar:** Horizontal row of group cards, scrollable if many groups.

Each group card shows:
- Editable name (inline, click to edit)
- Student count ("5 students" or "empty")
- Mode label if set ("Classify", "Locate", etc.)
- Remove button (×), hidden on the active group if it's the last one

Click a group card to make it the **active group** (blue border). The first group is active by default.

**Buttons:**
- `+ Add` — creates a new group with next letter name
- `Auto-assign` — randomly distributes all unassigned students evenly across existing groups. Useful for quick setup.

**Mode config panel:** Appears below the group bar, configures the **active group only**.
- Practice mode pills (Recognize, Locate, Classify, Explain)
- Mode description text
- Per-mode knob selector
- Label shows which group: "Practice Mode (Group A)"

### Section 3: Student Roster

Single responsive grid of all students, rendered **once**.

**Student pill states:**

| State | Visual | Tap action |
|-------|--------|------------|
| Unassigned | White pill, gray circle (○) | Assign to active group |
| In active group | Blue pill, group letter badge (A) | Unassign |
| In another group | Muted pill with group color + letter badge (B) | Move to active group |

**Group color coding:** Each group gets a distinct color for its letter badge so the roster is scannable at a glance.

| Group | Color | Tailwind |
|-------|-------|----------|
| A | Blue | `bg-blue-100 text-blue-700` |
| B | Green | `bg-green-100 text-green-700` |
| C | Amber | `bg-amber-100 text-amber-700` |
| D | Purple | `bg-purple-100 text-purple-700` |
| E | Rose | `bg-rose-100 text-rose-700` |
| F+ | Cycle from top | |

**Responsive columns:**

| Viewport | Columns | Tailwind |
|----------|---------|----------|
| Mobile | 2 | `grid-cols-2` |
| Tablet portrait | 3 | `sm:grid-cols-3` |
| Tablet landscape / desktop | 4 | `md:grid-cols-4` |

**Unassigned counter:** Below the roster, shows "N unassigned" in gray. When submitting with unassigned students, show a warning (not an error — unassigned students simply don't participate).

### Interaction Flow

1. Teacher selects activity from dropdown
2. Groups A (default) is active (blue border)
3. Teacher taps students in the roster → they turn blue with "A" badge
4. Teacher taps Group B card → it becomes active
5. Teacher taps more students → they get "B" badge
6. Repeat for C, D
7. Teacher taps each group card to set its practice mode + knob
8. Click "Create Session"

**Shortcut:** Teacher clicks `Auto-assign`, then just adjusts modes per group. Under 30 seconds for a 20-student class.

### Validation

- Each group must have at least 1 student (same as current)
- Activity must be selected (same as current)
- Unassigned students: show count but allow submission (they won't participate)

## Comparison

| Metric | Current | Proposed |
|--------|---------|----------|
| Pills rendered (20 students, 4 groups) | 80 | 20 |
| Page height | ~4 screen heights on tablet | ~1.5 screen heights |
| Taps to assign 20 students | 20 + scrolling between groups | 20 + 3 group switches = 23 |
| Time with Auto-assign | N/A | ~10 seconds total |
| Works at 30+ students | Painful | Same layout, just more rows |

## Implementation

### Modified file

`CrossCheck/app/src/app/teacher/sessions/new/create-session-form.tsx` — full rewrite of the form component. The server component (`page.tsx`) and API endpoint stay unchanged.

### Key state changes

Current state:
```typescript
groups: GroupDraft[]  // each with studentIds[], difficultyMode, knobValue
```

New state (same shape, add active group tracking):
```typescript
groups: GroupDraft[]           // unchanged
activeGroupIndex: number       // which group is selected for editing
```

The `toggleStudent` function simplifies: always assigns to `activeGroupIndex` or unassigns if already there. Moving from another group is implicit (remove from old, add to active).

### Auto-assign algorithm

```typescript
function autoAssign(students: Student[], groups: GroupDraft[]): GroupDraft[] {
  const unassigned = students.filter(s => !groups.some(g => g.studentIds.includes(s.id)));
  const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
  const updated = groups.map(g => ({ ...g, studentIds: [...g.studentIds] }));
  shuffled.forEach((s, i) => {
    updated[i % updated.length].studentIds.push(s.id);
  });
  return updated;
}
```

## What This Does NOT Change

- Activity selection (same dropdown + preview link)
- API endpoint (`POST /api/sessions`) — same request shape
- Server component (`page.tsx`) — same data fetching
- Mode/knob options — same pills, same values
- Validation rules — same constraints
