"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [batchNames, setBatchNames] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    // Step 1: Create student accounts from batch names
    const names = batchNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const studentIds: string[] = [];

    for (const displayName of names) {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (res.ok) {
        const data = await res.json();
        studentIds.push(data.id);
      } else {
        const data = await res.json();
        // If username taken, try to find the existing student
        if (res.status === 409) {
          setError((prev) =>
            prev ? `${prev}\n${displayName}: already exists` : `${displayName}: already exists`
          );
        } else {
          setError((prev) =>
            prev ? `${prev}\n${displayName}: ${data.error}` : `${displayName}: ${data.error}`
          );
        }
      }
    }

    // Step 2: Create the class with student roster
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        studentIds: studentIds.length > 0 ? studentIds : undefined,
      }),
    });

    if (res.ok) {
      const cls = await res.json();
      router.push(`/teacher/classes/${cls.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create class");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <a href="/teacher" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to classes
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-4">New Class</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm whitespace-pre-wrap">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g., "6th STEM Period 2"'
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Students (optional — you can add later)
          </label>
          <textarea
            value={batchNames}
            onChange={(e) => setBatchNames(e.target.value)}
            placeholder={"Maya Johnson\nEthan Park\nSofia Rodriguez"}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            One name per line. Student accounts are created automatically.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Creating..." : "Create Class"}
        </button>
      </form>
    </div>
  );
}
