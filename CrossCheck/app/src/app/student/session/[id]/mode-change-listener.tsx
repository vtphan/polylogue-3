"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import type { ModeChangedEvent } from "@/hooks/useSessionSocket";

/**
 * Thin client component that listens for mid-session practice mode changes
 * and triggers a page refresh so the server component re-renders the correct mode.
 *
 * Rendered on every student session page regardless of which mode is active,
 * because Learn/Recognize/Locate modes don't use SessionActivityViewer
 * and thus don't have their own socket listeners for this event.
 */
export function ModeChangeListener({
  sessionId,
  groupId,
}: {
  sessionId: string;
  groupId: string;
}) {
  const router = useRouter();

  const onModeChanged = useCallback(
    (_event: ModeChangedEvent) => {
      router.refresh();
    },
    [router]
  );

  useSessionSocket(sessionId, groupId, { onModeChanged });

  return null;
}
