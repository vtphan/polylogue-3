"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteActivityButton({ activityId, sessionCount }: { activityId: string; sessionCount: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(force: boolean = false) {
    setDeleting(true);
    setError("");

    const url = `/api/activities/${activityId}${force ? "?force=true" : ""}`;
    const res = await fetch(url, { method: "DELETE" });

    if (res.ok) {
      setConfirming(false);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Delete failed");
      // If it's a force-able error (completed sessions), show force option
      if (res.status === 409 && data.completedSessions && !data.activeSessions) {
        setError(`${data.completedSessions} completed session(s) will be deleted.`);
      }
    }

    setDeleting(false);
  }

  if (!confirming) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
        title="Delete activity"
      >
        Delete
      </button>
    );
  }

  return (
    <div
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className="flex items-center gap-2"
    >
      {error && <span className="text-xs text-red-600">{error}</span>}

      {sessionCount > 0 ? (
        <>
          <span className="text-xs text-amber-600">{sessionCount} session(s)</span>
          <button
            onClick={() => handleDelete(true)}
            disabled={deleting}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            {deleting ? "..." : "Force delete"}
          </button>
        </>
      ) : (
        <button
          onClick={() => handleDelete(false)}
          disabled={deleting}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
        >
          {deleting ? "..." : "Confirm delete"}
        </button>
      )}

      <button
        onClick={() => { setConfirming(false); setError(""); }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  );
}
