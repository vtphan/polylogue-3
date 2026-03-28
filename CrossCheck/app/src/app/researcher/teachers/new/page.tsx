"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTeacherPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ displayName: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Display name required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim(),
        role: "teacher",
        password,
      }),
    });

    if (res.ok) {
      setCreated({ displayName: displayName.trim(), password });
      setDisplayName("");
      setPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create teacher");
    }

    setSaving(false);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Teacher</h1>

      {created && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-green-800 mb-2">Teacher created!</p>
          <div className="bg-white rounded p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Login name:</span>
              <span className="font-mono font-medium text-gray-900">{created.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Password:</span>
              <span className="font-mono font-medium text-gray-900">{created.password}</span>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Share these credentials with the teacher.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setCreated(null)}
              className="text-xs text-green-700 hover:text-green-900"
            >
              Add another
            </button>
            <button
              onClick={() => router.push("/researcher/teachers")}
              className="text-xs text-green-700 hover:text-green-900"
            >
              Back to teachers
            </button>
          </div>
        </div>
      )}

      {!created && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Ms. Thompson"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              This is how the teacher will log in (by name).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Teacher"}
          </button>
        </form>
      )}
    </div>
  );
}
