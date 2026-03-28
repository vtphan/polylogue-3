"use client";

import { useState } from "react";

interface Teacher {
  id: string;
  displayName: string;
}

interface CreatedResult {
  class: { id: string; name: string };
  students: { id: string; displayName: string; username: string }[];
  count: number;
}

export function MockClassForm({ teachers }: { teachers: Teacher[] }) {
  const [teacherId, setTeacherId] = useState("");
  const [className, setClassName] = useState("Demo Class");
  const [studentCount, setStudentCount] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreatedResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!teacherId) {
      setError("Select a teacher");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/classes/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId,
        className: className.trim() || undefined,
        studentCount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(data);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to generate mock data");
    }

    setSaving(false);
  }

  if (result) {
    const teacher = teachers.find((t) => t.id === teacherId);
    return (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-4">
          <h2 className="text-sm font-bold text-green-800 mb-1">Mock class created!</h2>
          <p className="text-sm text-green-700">
            <strong>{result.class.name}</strong> for {teacher?.displayName} with {result.count} students.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Student names (login by name, no password):
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {result.students.map((s) => (
              <div key={s.id} className="text-xs text-gray-600 py-0.5">
                {s.displayName}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setResult(null); setTeacherId(""); }}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Generate another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teacher
        </label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">Select a teacher...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.displayName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Name
        </label>
        <input
          type="text"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Students
        </label>
        <input
          type="number"
          value={studentCount}
          onChange={(e) => setStudentCount(Math.min(40, Math.max(1, parseInt(e.target.value) || 20)))}
          min={1}
          max={40}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Max 40 students per mock class.</p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Generating..." : "Generate Mock Class"}
      </button>
    </form>
  );
}
