"use client";

import { useState, useCallback } from "react";
import type {
  Agent,
  Annotation,
  AnnotationLocation,
  FlawType,
  PresentationTranscript,
  DiscussionTranscript,
} from "@/lib/types";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";
import { FlawBottomBar } from "@/components/annotation/flaw-toolbar";
import { FlawPalette } from "@/components/annotation/flaw-palette";
import { useSelectionClear } from "@/hooks/useSelectionClear";

interface ScaffoldNotification {
  id: string;
  text: string;
  level: number;
  type: string;
}

interface SessionActivityViewerProps {
  sessionId: string;
  groupId: string;
  activityId: string;
  activityType: "presentation" | "discussion";
  transcript: unknown;
  agents: Agent[];
  initialAnnotations: Annotation[];
  pendingScaffolds: ScaffoldNotification[];
  readOnly: boolean;
  difficultyMode?: "spot" | "classify" | "full";
  sessionPhase?: string;
  userId?: string;
}

export function SessionActivityViewer({
  sessionId,
  groupId,
  activityId,
  activityType,
  transcript,
  agents,
  initialAnnotations,
  pendingScaffolds: initialScaffolds,
  readOnly,
  difficultyMode = "classify",
  sessionPhase = "individual",
  userId = "",
}: SessionActivityViewerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [pendingLocation, setPendingLocation] = useState<AnnotationLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [scaffolds, setScaffolds] = useState(initialScaffolds);

  const clearPending = useCallback(() => setPendingLocation(null), []);
  useSelectionClear(pendingLocation !== null, clearPending);

  const handleTextSelected = useCallback(
    (location: AnnotationLocation) => {
      if (readOnly) return;
      setPendingLocation(location);
    },
    [readOnly]
  );

  const handleFlawTypeSelected = useCallback(
    async (flawType: FlawType) => {
      if (!pendingLocation || saving) return;
      setSaving(true);
      try {
        const res = await fetch("/api/annotations/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            groupId,
            location: pendingLocation,
            flawType,
          }),
        });
        if (res.ok) {
          const newAnn = await res.json();
          setAnnotations((prev) => [
            ...prev,
            {
              id: newAnn.id,
              location: newAnn.location as AnnotationLocation,
              flawType: newAnn.flawType,
              createdAt: newAnn.createdAt,
            },
          ]);
        }
      } finally {
        setSaving(false);
        setPendingLocation(null);
      }
    },
    [sessionId, groupId, pendingLocation, saving]
  );

  const handleAnnotationDelete = useCallback(async (annotationId: string) => {
    if (readOnly) return;
    const res = await fetch(`/api/annotations/${annotationId}`, { method: "DELETE" });
    if (res.ok) {
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    }
  }, [readOnly]);

  const handleUndo = useCallback(async () => {
    if (readOnly || annotations.length === 0) return;
    const last = annotations[annotations.length - 1];
    const res = await fetch(`/api/annotations/${last.id}`, { method: "DELETE" });
    if (res.ok) {
      setAnnotations((prev) => prev.slice(0, -1));
    }
  }, [readOnly, annotations]);

  const handleConfirm = useCallback(async (annotationId: string, action: "confirm" | "unconfirm") => {
    const res = await fetch(`/api/annotations/${annotationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? { ...a, isGroupAnswer: updated.isGroupAnswer, confirmedBy: updated.confirmedBy as string[] }
            : a
        )
      );
    }
  }, []);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    const el = document.getElementById(annotation.location.item_id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const acknowledgeScaffold = useCallback(async (scaffoldId: string) => {
    await fetch(`/api/scaffolds/${scaffoldId}`, { method: "PATCH" });
    setScaffolds((prev) => prev.filter((s) => s.id !== scaffoldId));
  }, []);

  return (
    <div className="pb-20"> {/* Bottom padding for the fixed bar */}
      {/* Scaffold notifications */}
      {scaffolds.length > 0 && (
        <div className="mb-4 space-y-2">
          {scaffolds.map((s) => (
            <div
              key={s.id}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-medium text-blue-700">
                  From your teacher:
                </span>
                <p className="text-sm text-blue-900 mt-0.5">{s.text}</p>
              </div>
              <button
                onClick={() => acknowledgeScaffold(s.id)}
                className="text-xs text-blue-500 hover:text-blue-700 shrink-0 ml-3"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {readOnly && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-600">
          This session is in review mode. Annotations are locked.
        </div>
      )}

      <div className="flex gap-6">
        {/* Transcript */}
        <div className="flex-1 min-w-0">
          {activityType === "presentation" ? (
            <PresentationView
              sections={(transcript as PresentationTranscript).sections}
              agents={agents}
              annotations={annotations}
              onTextSelected={handleTextSelected}
              onAnnotationClick={handleAnnotationClick}
            />
          ) : (
            <DiscussionView
              turns={(transcript as DiscussionTranscript).turns}
              agents={agents}
              annotations={annotations}
              onTextSelected={handleTextSelected}
              onAnnotationClick={handleAnnotationClick}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <FlawPalette
              annotations={annotations}
              onAnnotationClick={handleAnnotationClick}
              onAnnotationDelete={readOnly ? () => {} : handleAnnotationDelete}
              onConfirm={sessionPhase === "group" ? handleConfirm : undefined}
              sessionPhase={sessionPhase}
              userId={userId}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <FlawBottomBar
        hasSelection={pendingLocation !== null}
        annotations={annotations}
        onSelect={handleFlawTypeSelected}
        onUndo={handleUndo}
        readOnly={readOnly}
        difficultyMode={difficultyMode}
      />
    </div>
  );
}
