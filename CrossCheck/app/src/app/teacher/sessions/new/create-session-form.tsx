"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DIFFICULTY_MODE_INFO } from "@/lib/types";
import type { DifficultyMode } from "@/lib/types";

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
  difficultyMode: string;
}

export function CreateSessionForm({
  activities,
  students,
}: {
  activities: Activity[];
  students: Student[];
}) {
  const router = useRouter();
  const [activityId, setActivityId] = useState("");
  const [groups, setGroups] = useState<GroupDraft[]>([
    { name: "Group A", studentIds: [], difficultyMode: "recognize" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const assignedStudentIds = new Set(groups.flatMap((g) => g.studentIds));

  function addGroup() {
    const letter = String.fromCharCode(65 + groups.length); // A, B, C, ...
    setGroups([...groups, { name: `Group ${letter}`, studentIds: [], difficultyMode: "recognize" }]);
  }

  function removeGroup(index: number) {
    setGroups(groups.filter((_, i) => i !== index));
  }

  function updateGroupName(index: number, name: string) {
    const updated = [...groups];
    updated[index] = { ...updated[index], name };
    setGroups(updated);
  }

  function toggleStudent(groupIndex: number, studentId: string) {
    const updated = [...groups];
    const group = updated[groupIndex];
    if (group.studentIds.includes(studentId)) {
      group.studentIds = group.studentIds.filter((id) => id !== studentId);
    } else {
      // Remove from any other group first
      for (const g of updated) {
        g.studentIds = g.studentIds.filter((id) => id !== studentId);
      }
      group.studentIds = [...group.studentIds, studentId];
    }
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
      body: JSON.stringify({ activityId, groups: groups.map((g) => ({ name: g.name, studentIds: g.studentIds, difficultyMode: g.difficultyMode })) }),
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {/* Activity selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activity
        </label>
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

      {/* Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Groups</label>
          <button
            type="button"
            onClick={addGroup}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add group
          </button>
        </div>

        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  value={group.name}
                  onChange={(e) => updateGroupName(gi, e.target.value)}
                  className="font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                />
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {students.map((s) => {
                  const inThisGroup = group.studentIds.includes(s.id);
                  const inOtherGroup =
                    !inThisGroup && assignedStudentIds.has(s.id);

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(gi, s.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        inThisGroup
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : inOtherGroup
                            ? "bg-gray-50 border-gray-200 text-gray-400"
                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                      }`}
                    >
                      {s.displayName}
                    </button>
                  );
                })}
              </div>
              {group.studentIds.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Click students to add them to this group
                </p>
              )}

              {/* Per-group practice mode */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">Practice Mode</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(Object.entries(DIFFICULTY_MODE_INFO) as [DifficultyMode, { label: string; desc: string }][]).map(([value, info]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        const updated = [...groups];
                        updated[gi] = { ...updated[gi], difficultyMode: value };
                        setGroups(updated);
                      }}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        group.difficultyMode === value
                          ? "border-blue-400 bg-blue-50 text-blue-800 font-medium"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {DIFFICULTY_MODE_INFO[group.difficultyMode as DifficultyMode]?.desc}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  Choose any mode — no sequence required.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Creating..." : "Create Session"}
      </button>
    </form>
  );
}
