"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreatedStudent {
  displayName: string;
  username: string;
}

export default function AddStudentsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [batchNames, setBatchNames] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedStudent[]>([]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) return;

    setSaving(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreated((prev) => [...prev, {
        displayName: data.displayName,
        username: data.username,
      }]);
      setDisplayName("");
      setUsername("");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create student");
    }
    setSaving(false);
  }

  async function handleBatchAdd(e: React.FormEvent) {
    e.preventDefault();
    const names = batchNames.split("\n").map((n) => n.trim()).filter((n) => n.length > 0);
    if (names.length === 0) return;

    setSaving(true);
    setError("");

    for (const name of names) {
      const auto = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: auto, displayName: name }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreated((prev) => [...prev, {
          displayName: data.displayName,
          username: data.username,
        }]);
      } else {
        const data = await res.json();
        setError((prev) => prev ? `${prev}\n${name}: ${data.error}` : `${name}: ${data.error}`);
      }
    }
    setBatchNames("");
    setSaving(false);
  }

  // Auto-generate username from display name
  function handleNameChange(name: string) {
    setDisplayName(name);
    const auto = name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
    setUsername(auto);
  }

  return (
    <div className="max-w-xl">
      <a href="/teacher/students" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to students
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Add Students</h1>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("single")}
          className={`text-sm px-3 py-1 rounded ${mode === "single" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
        >
          One at a time
        </button>
        <button
          onClick={() => setMode("batch")}
          className={`text-sm px-3 py-1 rounded ${mode === "batch" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:text-gray-700"}`}
        >
          Batch (multiple)
        </button>
      </div>

      {/* Batch mode */}
      {mode === "batch" && (
        <form onSubmit={handleBatchAdd} className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4 whitespace-pre-wrap">{error}</div>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student names (one per line)
          </label>
          <textarea
            value={batchNames}
            onChange={(e) => setBatchNames(e.target.value)}
            placeholder={"Maya Johnson\nEthan Park\nSofia Rodriguez"}
            rows={6}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
          />
          <p className="text-xs text-gray-400 mb-3">
            Usernames will be auto-generated from names.
          </p>
          <button
            type="submit"
            disabled={saving || !batchNames.trim()}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Adding..." : `Add ${batchNames.split("\n").filter((n) => n.trim()).length} Students`}
          </button>
        </form>
      )}

      {/* Single mode */}
      {mode === "single" && (
      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Maya Johnson"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., maya.johnson"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Students use this to log in. Auto-generated from name.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !displayName.trim() || !username.trim()}
          className="mt-4 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Adding..." : "Add Student"}
        </button>
      </form>
      )}

      {/* Show created students with passwords */}
      {created.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h2 className="font-semibold text-green-900 mb-1">
            Students Created
          </h2>
          <p className="text-xs text-green-700 mb-3">
            Students log in by entering their name — no password needed.
          </p>

          <div className="bg-white rounded border border-green-200 divide-y divide-green-100">
            {created.map((s, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <span className="font-medium text-gray-900">{s.displayName}</span>
                <span className="text-sm text-gray-500">{s.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {created.length > 0 && (
        <button
          onClick={() => router.push("/teacher/students")}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Done — go to student list
        </button>
      )}
    </div>
  );
}
