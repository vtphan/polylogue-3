"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AddStudentsToClassPage() {
  const router = useRouter();
  const { classId } = useParams<{ classId: string }>();
  const [batchNames, setBatchNames] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const names = batchNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    setSaving(true);
    setError("");

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
      } else if (res.status === 409) {
        // Already exists — skip for now (could look up by username)
        setError((prev) =>
          prev ? `${prev}\n${displayName}: already exists` : `${displayName}: already exists`
        );
      } else {
        const data = await res.json();
        setError((prev) =>
          prev ? `${prev}\n${displayName}: ${data.error}` : `${displayName}: ${data.error}`
        );
      }
    }

    if (studentIds.length > 0) {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setAdded(data.added);
      }
    }

    setSaving(false);
    if (!error) {
      router.push(`/teacher/classes/${classId}`);
    }
  }

  return (
    <div className="max-w-xl">
      <a
        href={`/teacher/classes/${classId}`}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to class
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Add Students</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm whitespace-pre-wrap">{error}</div>
        )}
        {added > 0 && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm">
            {added} students added to class.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student names (one per line)
          </label>
          <textarea
            value={batchNames}
            onChange={(e) => setBatchNames(e.target.value)}
            placeholder={"Maya Johnson\nEthan Park\nSofia Rodriguez"}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Student accounts are created automatically. Existing accounts are skipped.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !batchNames.trim()}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Adding..." : `Add ${batchNames.split("\n").filter((n) => n.trim()).length} Students`}
        </button>
      </form>
    </div>
  );
}
