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
import { FlawToolbar } from "@/components/annotation/flaw-toolbar";
import { FlawPalette } from "@/components/annotation/flaw-palette";

interface ActivityViewerProps {
  activityId: string;
  activityType: "presentation" | "discussion";
  transcript: unknown;
  agents: Agent[];
  initialAnnotations: Annotation[];
}

export function ActivityViewer({
  activityId,
  activityType,
  transcript,
  agents,
  initialAnnotations,
}: ActivityViewerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [pendingLocation, setPendingLocation] = useState<AnnotationLocation | null>(null);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const handleTextSelected = useCallback((location: AnnotationLocation) => {
    // Position toolbar near the selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPos({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY,
      });
    }
    setPendingLocation(location);
  }, []);

  const handleFlawTypeSelected = useCallback(
    async (flawType: FlawType) => {
      if (!pendingLocation || saving) return;

      setSaving(true);
      try {
        const res = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityId,
            location: pendingLocation,
            flawType,
          }),
        });

        if (res.ok) {
          const newAnnotation = await res.json();
          setAnnotations((prev) => [
            ...prev,
            {
              id: newAnnotation.id,
              location: newAnnotation.location as AnnotationLocation,
              flawType: newAnnotation.flawType,
              createdAt: newAnnotation.createdAt,
            },
          ]);
        }
      } finally {
        setSaving(false);
        setPendingLocation(null);
      }
    },
    [activityId, pendingLocation, saving]
  );

  const handleAnnotationDelete = useCallback(async (annotationId: string) => {
    const res = await fetch(`/api/annotations/${annotationId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    }
  }, []);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    const el = document.getElementById(annotation.location.item_id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleToolbarDismiss = useCallback(() => {
    setPendingLocation(null);
  }, []);

  return (
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
            onAnnotationDelete={handleAnnotationDelete}
          />
        </div>
      </div>

      {/* Floating toolbar */}
      <FlawToolbar
        visible={pendingLocation !== null}
        position={toolbarPos}
        onSelect={handleFlawTypeSelected}
        onDismiss={handleToolbarDismiss}
      />
    </div>
  );
}
