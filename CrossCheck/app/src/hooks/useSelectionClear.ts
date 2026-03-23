"use client";

import { useEffect } from "react";

/**
 * Clears pendingLocation when the browser selection collapses
 * (user clicks elsewhere without selecting new text).
 */
export function useSelectionClear(
  hasPending: boolean,
  clearPending: () => void
) {
  useEffect(() => {
    if (!hasPending) return;

    const handleSelectionChange = () => {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed) {
        clearPending();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [hasPending, clearPending]);
}
