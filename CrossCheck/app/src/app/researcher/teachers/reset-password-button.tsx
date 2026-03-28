"use client";

import { useState } from "react";

export default function ResetPasswordButton({
  teacherId,
  teacherName,
}: {
  teacherId: string;
  teacherName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        Reset Password
      </button>
    );
  }

  if (success) {
    return (
      <div className="text-xs space-y-1">
        <p className="text-green-600 font-medium">
          Password reset for {teacherName}.
        </p>
        <p className="text-gray-500">
          New password: <span className="font-mono bg-gray-100 px-1 rounded">{password}</span>
        </p>
        <button
          onClick={handleClose}
          className="text-blue-600 hover:text-blue-800"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="text-xs space-y-2">
      <div className="text-gray-500 font-medium">Reset for {teacherName}</div>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full border border-gray-300 rounded px-2 py-1 text-xs"
        autoFocus
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="block w-full border border-gray-300 rounded px-2 py-1 text-xs"
      />
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Reset"}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 px-2 py-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
