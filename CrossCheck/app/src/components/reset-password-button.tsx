"use client";

import { useState } from "react";

export function ResetPasswordButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirm(`Reset password for ${studentName}?`)) return;

    setLoading(true);
    const res = await fetch(`/api/users/${studentId}/reset-password`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      setNewPassword(data.password);
    }
    setLoading(false);
  }

  if (newPassword) {
    return (
      <span className="text-xs font-mono">
        New password: <strong className="text-green-700">{newPassword}</strong>
      </span>
    );
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-gray-600"
    >
      {loading ? "..." : "Reset password"}
    </button>
  );
}
