"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import type { ModeChangedEvent, GroupPhaseChangedEvent } from "@/hooks/useSessionSocket";

/**
 * Client component that:
 * 1. Listens for mid-session practice mode changes and refreshes the page
 * 2. Listens for group phase changes and refreshes the page
 * 3. Renders a "Ready" button for students to signal readiness
 */
export function ModeChangeListener({
  sessionId,
  groupId,
  groupPhase,
  sessionActive,
}: {
  sessionId: string;
  groupId: string;
  groupPhase: string;
  sessionActive: boolean;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [toggling, setToggling] = useState(false);

  const onModeChanged = useCallback(
    (_event: ModeChangedEvent) => {
      router.refresh();
    },
    [router]
  );

  const onGroupPhaseChanged = useCallback(
    (event: GroupPhaseChangedEvent) => {
      if (event.groupId === groupId) {
        setReady(false); // Reset ready state on phase change
        router.refresh();
      }
    },
    [router, groupId]
  );

  useSessionSocket(sessionId, groupId, { onModeChanged, onGroupPhaseChanged });

  async function toggleReady() {
    setToggling(true);
    const newReady = !ready;
    const res = await fetch(`/api/groups/${groupId}/ready`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ready: newReady }),
    });
    if (res.ok) {
      setReady(newReady);
    }
    setToggling(false);
  }

  // Show Ready button only during active session, not in reviewing phase
  if (!sessionActive || groupPhase === "reviewing") return null;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <button
        onClick={toggleReady}
        disabled={toggling}
        className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all ${
          ready
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-white text-gray-600 border border-gray-300 hover:border-green-400 hover:text-green-600"
        }`}
      >
        {toggling ? "..." : ready ? "Ready ✓" : "I'm ready"}
      </button>
    </div>
  );
}
