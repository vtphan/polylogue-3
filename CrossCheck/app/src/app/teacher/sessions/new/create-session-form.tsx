"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTY_MODE_INFO, SESSION_MODES, MODE_KNOB_INFO } from "@/lib/types";
import type { SessionMode } from "@/lib/types";

interface Activity {
  id: string;
  scenarioId: string;
  type: string;
  topic: string;
  agents: unknown;
}

interface Student {
  id: string;
  displayName: string;
  username: string;
}

interface GroupDraft {
  name: string;
  studentIds: string[];
  difficultyMode: SessionMode;
  knobValue: string;
}

function defaultKnob(mode: SessionMode): string {
  return MODE_KNOB_INFO[mode].default;
}

const GROUP_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700", activeBorder: "border-blue-500", label: "bg-blue-200 text-blue-800" },
  { bg: "bg-green-100", border: "border-green-300", text: "text-green-700", activeBorder: "border-green-500", label: "bg-green-200 text-green-800" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", activeBorder: "border-amber-500", label: "bg-amber-200 text-amber-800" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700", activeBorder: "border-purple-500", label: "bg-purple-200 text-purple-800" },
  { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-700", activeBorder: "border-rose-500", label: "bg-rose-200 text-rose-800" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-700", activeBorder: "border-teal-500", label: "bg-teal-200 text-teal-800" },
];

function getGroupColor(index: number) {
  return GROUP_COLORS[index % GROUP_COLORS.length];
}

function getGroupLetter(index: number) {
  return String.fromCharCode(65 + index);
}

export function CreateSessionForm({
  activities,
  students,
  classId,
}: {
  activities: Activity[];
  students: Student[];
  classId?: string;
}) {
  const router = useRouter();
  const [activityId, setActivityId] = useState("");
  const [groups, setGroups] = useState<GroupDraft[]>([
    { name: "Group A", studentIds: [], difficultyMode: "recognize", knobValue: defaultKnob("recognize") },
  ]);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Build a map: studentId → groupIndex
  const studentGroupMap = new Map<string, number>();
  groups.forEach((g, gi) => {
    g.studentIds.forEach((sid) => studentGroupMap.set(sid, gi));
  });

  const unassignedCount = students.filter((s) => !studentGroupMap.has(s.id)).length;

  function addGroup() {
    const letter = getGroupLetter(groups.length);
    setGroups([...groups, { name: `Group ${letter}`, studentIds: [], difficultyMode: "recognize", knobValue: defaultKnob("recognize") }]);
    setActiveGroupIndex(groups.length);
  }

  function removeGroup(index: number) {
    const updated = groups.filter((_, i) => i !== index);
    setGroups(updated);
    if (activeGroupIndex >= updated.length) {
      setActiveGroupIndex(Math.max(0, updated.length - 1));
    } else if (activeGroupIndex > index) {
      setActiveGroupIndex(activeGroupIndex - 1);
    }
  }

  function updateGroupName(index: number, name: string) {
    const updated = [...groups];
    updated[index] = { ...updated[index], name };
    setGroups(updated);
  }

  function toggleStudent(studentId: string) {
    const updated = groups.map((g) => ({ ...g, studentIds: [...g.studentIds] }));
    const currentGroup = studentGroupMap.get(studentId);

    if (currentGroup === activeGroupIndex) {
      // Unassign from active group
      updated[activeGroupIndex].studentIds = updated[activeGroupIndex].studentIds.filter((id) => id !== studentId);
    } else {
      // Remove from any current group
      if (currentGroup !== undefined) {
        updated[currentGroup].studentIds = updated[currentGroup].studentIds.filter((id) => id !== studentId);
      }
      // Add to active group
      updated[activeGroupIndex].studentIds.push(studentId);
    }
    setGroups(updated);
  }

  function autoAssign() {
    const unassigned = students.filter((s) => !studentGroupMap.has(s.id));
    if (unassigned.length === 0) return;
    const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
    const updated = groups.map((g) => ({ ...g, studentIds: [...g.studentIds] }));
    shuffled.forEach((s, i) => {
      updated[i % updated.length].studentIds.push(s.id);
    });
    setGroups(updated);
  }

  function setGroupMode(mode: SessionMode) {
    const updated = [...groups];
    updated[activeGroupIndex] = { ...updated[activeGroupIndex], difficultyMode: mode, knobValue: defaultKnob(mode) };
    setGroups(updated);
  }

  function setGroupKnob(value: string) {
    const updated = [...groups];
    updated[activeGroupIndex] = { ...updated[activeGroupIndex], knobValue: value };
    setGroups(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activityId) {
      setError("Select an activity");
      return;
    }
    if (groups.some((g) => g.studentIds.length === 0)) {
      setError("Each group needs at least one student");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        activityId,
        groups: groups.map((g) => ({
          name: g.name,
          studentIds: g.studentIds,
          difficultyMode: g.difficultyMode,
          modeConfig: { [MODE_KNOB_INFO[g.difficultyMode].key]: g.knobValue },
        })),
      }),
    });

    if (res.ok) {
      const session = await res.json();
      router.push(`/teacher/sessions/${session.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create session");
      setSaving(false);
    }
  }

  const activeGroup = groups[activeGroupIndex];
  const activeKnob = MODE_KNOB_INFO[activeGroup.difficultyMode];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {/* Activity selection + Create button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activity
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select an activity...</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.type}] {a.topic}
                </option>
              ))}
            </select>
            {activityId && (
              <a
                href={`/teacher/activities/${activityId}`}
                target="_blank"
                className="inline-block mt-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Preview transcript & evaluation
              </a>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {saving ? "Creating..." : "Create Session"}
          </button>
        </div>
      </div>

      {/* Group bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Groups</label>
          <div className="flex items-center gap-3">
            {students.length > 0 && (
              <button
                type="button"
                onClick={autoAssign}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Auto-assign
              </button>
            )}
            <button
              type="button"
              onClick={addGroup}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add group
            </button>
          </div>
        </div>

        {/* Group cards */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((group, gi) => {
            const color = getGroupColor(gi);
            const isActive = gi === activeGroupIndex;
            return (
              <button
                key={gi}
                type="button"
                onClick={() => setActiveGroupIndex(gi)}
                className={`flex-shrink-0 rounded-lg border-2 p-3 text-left transition-colors min-w-[140px] ${
                  isActive
                    ? `${color.bg} ${color.activeBorder}`
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isActive ? color.text : "text-gray-700"}`}>
                    {group.name}
                  </span>
                  {groups.length > 1 && !isActive && (
                    <span
                      onClick={(e) => { e.stopPropagation(); removeGroup(gi); }}
                      className="text-xs text-gray-400 hover:text-red-500 ml-2"
                    >
                      &times;
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {group.studentIds.length} {group.studentIds.length === 1 ? "student" : "students"}
                </div>
                {group.difficultyMode && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {DIFFICULTY_MODE_INFO[group.difficultyMode].label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mode config for active group */}
        <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
          <span className="text-xs font-medium text-gray-500">
            Practice Mode ({activeGroup.name})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {SESSION_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setGroupMode(mode)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeGroup.difficultyMode === mode
                    ? "border-blue-400 bg-blue-50 text-blue-800 font-medium"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {DIFFICULTY_MODE_INFO[mode].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {DIFFICULTY_MODE_INFO[activeGroup.difficultyMode].desc}
          </p>

          <div className="mt-2">
            <span className="text-xs text-gray-400">{activeKnob.label}:</span>
            <div className="flex gap-1 mt-1">
              {activeKnob.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGroupKnob(opt.value)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    activeGroup.knobValue === opt.value
                      ? "border-gray-400 bg-gray-100 text-gray-800 font-medium"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Student roster */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Students</label>
          {unassignedCount > 0 && (
            <span className="text-xs text-gray-400">{unassignedCount} unassigned</span>
          )}
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {students.map((s) => {
            const groupIndex = studentGroupMap.get(s.id);
            const isAssigned = groupIndex !== undefined;
            const inActiveGroup = groupIndex === activeGroupIndex;
            const color = isAssigned ? getGroupColor(groupIndex) : null;
            const letter = isAssigned ? getGroupLetter(groupIndex) : null;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStudent(s.id)}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-colors text-left ${
                  inActiveGroup
                    ? `${color!.bg} ${color!.border} ${color!.text} font-medium`
                    : isAssigned
                      ? "bg-gray-50 border-gray-200 text-gray-500"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {isAssigned ? (
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${color!.label}`}>
                    {letter}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-400 text-[10px]">
                    &ndash;
                  </span>
                )}
                <span className="truncate">{s.displayName}</span>
              </button>
            );
          })}
        </div>

        {students.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">
            No students yet. <a href="/teacher/students/new" className="text-blue-600 hover:text-blue-800">Add students</a> first.
          </p>
        )}
      </div>

    </form>
  );
}
