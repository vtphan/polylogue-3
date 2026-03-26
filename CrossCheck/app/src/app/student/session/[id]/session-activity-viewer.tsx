"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  Agent,
  Annotation,
  AnnotationLocation,
  ClassifyConfig,
  DifficultyMode,
  FlawType,
  PresentationTranscript,
  DiscussionTranscript,
} from "@/lib/types";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";
import { FlawBottomBar } from "@/components/annotation/flaw-toolbar";
import { FlawPalette } from "@/components/annotation/flaw-palette";
import { FlawFieldGuide, FlawFieldGuideDrawer } from "@/components/annotation/flaw-field-guide";
import { ExplanationPrompt } from "@/components/modes/explanation-prompt";
import type { ExplainConfig } from "@/lib/types";
import { useSelectionClear } from "@/hooks/useSelectionClear";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import type { AnnotationCreatedEvent, AnnotationDeletedEvent, AnnotationConfirmedEvent, ScaffoldSentEvent, PhaseChangedEvent } from "@/hooks/useSessionSocket";

interface ScaffoldNotification {
  id: string;
  text: string;
  level: number;
  type: string;
}

interface FlawIndexEntry {
  flaw_id: string;
  locations: string[];
  flaw_type: string;
  severity: string;
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
  difficultyMode?: DifficultyMode;
  categorization?: ClassifyConfig["categorization"];
  explanationFormat?: ExplainConfig["explanation_format"];
  flawIndex?: FlawIndexEntry[];
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
  categorization = "full",
  explanationFormat = "guided",
  flawIndex = [],
  sessionPhase = "individual",
  userId = "",
}: SessionActivityViewerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [pendingLocation, setPendingLocation] = useState<AnnotationLocation | null>(null);
  const [pendingExplainType, setPendingExplainType] = useState<FlawType | null>(null);
  const [saving, setSaving] = useState(false);
  const [scaffolds, setScaffolds] = useState(initialScaffolds);
  const [phaseNotice, setPhaseNotice] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(sessionPhase);
  const router = useRouter();

  const clearPending = useCallback(() => setPendingLocation(null), []);
  useSelectionClear(pendingLocation !== null, clearPending);

  // Assisted mode: compute dynamic button options when text is selected
  // Uses deterministic RNG seeded by item_id so buttons are stable across re-renders
  const assistedOptions = useMemo<FlawType[] | undefined>(() => {
    if (difficultyMode !== "classify" || categorization !== "assisted" || !pendingLocation) return undefined;

    // Deterministic pseudo-random seeded by item_id
    let seed = 0;
    for (const ch of pendingLocation.item_id) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    const allTypes: FlawType[] = ["reasoning", "epistemic", "completeness", "coherence"];
    const matchingFlaw = flawIndex.find((f) => f.locations.includes(pendingLocation.item_id));
    if (!matchingFlaw) {
      const shuffled = [...allTypes].sort(() => rng() - 0.5);
      return shuffled.slice(0, 2 + (rng() > 0.5 ? 1 : 0));
    }
    const correctType = matchingFlaw.flaw_type as FlawType;
    const others = allTypes.filter((t) => t !== correctType);
    const numDistractors = 1 + Math.floor(rng() * 3);
    const shuffled = [...others].sort(() => rng() - 0.5);
    const distractors = shuffled.slice(0, numDistractors);
    return [correctType, ...distractors].sort(() => rng() - 0.5);
  }, [difficultyMode, categorization, pendingLocation, flawIndex]);

  // ---- Show Hint system (Classify + Explain) ----
  const [hintsUsed, setHintsUsed] = useState<Set<string>>(new Set());
  const [hintPulseTarget, setHintPulseTarget] = useState<string | null>(null);

  const hintsRemaining = useMemo(() => {
    if (difficultyMode !== "classify" && difficultyMode !== "explain") return 0;
    if (flawIndex.length === 0) return 0;
    let remaining = 0;
    for (const flaw of flawIndex) {
      if (hintsUsed.has(flaw.flaw_id)) continue;
      const found = annotations.some((a) => flaw.locations.includes(a.location.item_id));
      if (!found) remaining++;
    }
    return remaining;
  }, [difficultyMode, flawIndex, annotations, hintsUsed]);

  const handleShowHint = useCallback(() => {
    if (flawIndex.length === 0) return;
    // Find first unfound, un-hinted flaw
    for (const flaw of flawIndex) {
      if (hintsUsed.has(flaw.flaw_id)) continue;
      const found = annotations.some((a) => flaw.locations.includes(a.location.item_id));
      if (!found && flaw.locations.length > 0) {
        const targetId = flaw.locations[0];
        setHintsUsed((prev) => new Set(prev).add(flaw.flaw_id));
        setHintPulseTarget(targetId);
        // Scroll to the section
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Clear pulse after animation
        setTimeout(() => setHintPulseTarget(null), 3000);
        return;
      }
    }
  }, [flawIndex, annotations, hintsUsed]);

  // Apply/remove pulse CSS class on hint target
  useEffect(() => {
    if (!hintPulseTarget) return;
    const el = document.getElementById(hintPulseTarget);
    if (el) {
      el.classList.add("hint-pulse");
      return () => el.classList.remove("hint-pulse");
    }
  }, [hintPulseTarget]);

  // ---- Socket.IO: live updates ----
  const onAnnotationCreated = useCallback((event: AnnotationCreatedEvent) => {
    // Skip own annotations — already added optimistically
    if (event.annotation.userId === userId) return;
    // In individual phase, don't show others' annotations
    if (currentPhase === "individual") return;
    setAnnotations((prev) => {
      if (prev.some((a) => a.id === event.annotation.id)) return prev;
      return [...prev, {
        id: event.annotation.id,
        location: event.annotation.location as AnnotationLocation,
        flawType: event.annotation.flawType as Annotation["flawType"],
        createdAt: event.annotation.createdAt,
        hinted: event.annotation.hinted,
        isGroupAnswer: event.annotation.isGroupAnswer,
        confirmedBy: event.annotation.confirmedBy,
        userId: event.annotation.userId,
      }];
    });
  }, [userId, currentPhase]);

  const onAnnotationDeleted = useCallback((event: AnnotationDeletedEvent) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== event.annotationId));
  }, []);

  const onAnnotationConfirmed = useCallback((event: AnnotationConfirmedEvent) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === event.annotationId
          ? { ...a, isGroupAnswer: event.isGroupAnswer, confirmedBy: event.confirmedBy }
          : a
      )
    );
  }, []);

  const onScaffoldSent = useCallback((event: ScaffoldSentEvent) => {
    setScaffolds((prev) => {
      if (prev.some((s) => s.id === event.scaffold.id)) return prev;
      return [...prev, {
        id: event.scaffold.id,
        text: event.scaffold.text,
        level: event.scaffold.level,
        type: event.scaffold.type,
      }];
    });
  }, []);

  const onPhaseChanged = useCallback((event: PhaseChangedEvent) => {
    setCurrentPhase(event.to);
    const labels: Record<string, string> = {
      individual: "Individual Phase",
      group: "Group Phase — discuss with your team!",
      reviewing: "Review Phase — see how you did!",
      closed: "Session closed",
    };
    setPhaseNotice(labels[event.to] || `Phase: ${event.to}`);
    // Refresh to get the correct server-rendered view for the new phase
    setTimeout(() => router.refresh(), 1500);
  }, [router]);

  const { isConnected } = useSessionSocket(sessionId, groupId, {
    onAnnotationCreated,
    onAnnotationDeleted,
    onAnnotationConfirmed,
    onScaffoldSent,
    onPhaseChanged,
  });

  const handleTextSelected = useCallback(
    (location: AnnotationLocation) => {
      if (readOnly) return;
      setPendingLocation(location);
    },
    [readOnly]
  );

  const saveAnnotation = useCallback(
    async (flawType: FlawType, explanation?: string, severity?: string) => {
      if (!pendingLocation || saving) return;
      setSaving(true);

      const isHinted = flawIndex.some(
        (f) => hintsUsed.has(f.flaw_id) && f.locations.includes(pendingLocation.item_id)
      );

      try {
        const res = await fetch("/api/annotations/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            groupId,
            location: pendingLocation,
            flawType,
            ...(isHinted ? { hinted: true } : {}),
            ...(explanation ? { explanation } : {}),
            ...(severity ? { severity } : {}),
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
        setPendingExplainType(null);
      }
    },
    [sessionId, groupId, pendingLocation, saving, flawIndex, hintsUsed]
  );

  const handleFlawTypeSelected = useCallback(
    async (flawType: FlawType) => {
      if (!pendingLocation || saving) return;

      // In Explain mode, show the explanation prompt before saving
      if (difficultyMode === "explain") {
        setPendingExplainType(flawType);
        return;
      }

      saveAnnotation(flawType);
    },
    [pendingLocation, saving, difficultyMode, saveAnnotation]
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
      {/* Connection indicator */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          Reconnecting to live updates...
        </div>
      )}

      {/* Phase transition notification */}
      {phaseNotice && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-indigo-800">{phaseNotice}</p>
          <button
            onClick={() => setPhaseNotice(null)}
            className="text-indigo-400 hover:text-indigo-600 text-xs"
          >
            &times;
          </button>
        </div>
      )}

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
            <FlawFieldGuide compact={difficultyMode === "classify" && categorization === "detect_only"} />
            <FlawPalette
              annotations={annotations}
              onAnnotationClick={handleAnnotationClick}
              onAnnotationDelete={readOnly ? () => {} : handleAnnotationDelete}
              onConfirm={currentPhase === "group" ? handleConfirm : undefined}
              sessionPhase={currentPhase}
              userId={userId}
            />
          </div>
        </div>
      </div>

      {/* Mobile field guide drawer */}
      <FlawFieldGuideDrawer compact={difficultyMode === "classify" && categorization === "detect_only"} />

      {/* Fixed bottom bar */}
      {/* Explanation prompt modal (Explain mode) */}
      {pendingExplainType && (
        <ExplanationPrompt
          flawType={pendingExplainType}
          format={explanationFormat}
          onSubmit={(explanation, severity) => saveAnnotation(pendingExplainType, explanation, severity)}
          onCancel={() => { setPendingExplainType(null); setPendingLocation(null); }}
        />
      )}

      <FlawBottomBar
        hasSelection={pendingLocation !== null}
        annotations={annotations}
        onSelect={handleFlawTypeSelected}
        onUndo={handleUndo}
        readOnly={readOnly}
        difficultyMode={difficultyMode}
        categorization={difficultyMode === "classify" ? categorization : undefined}
        assistedOptions={assistedOptions}
        onShowHint={(difficultyMode === "classify" || difficultyMode === "explain") ? handleShowHint : undefined}
        hintsRemaining={(difficultyMode === "classify" || difficultyMode === "explain") ? hintsRemaining : undefined}
      />
    </div>
  );
}
