"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { HintCard } from "./hint-card";
import { useSelectionClear } from "@/hooks/useSelectionClear";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import type {
  AnnotationCreatedEvent,
  AnnotationDeletedEvent,
  AnnotationConfirmedEvent,
  ScaffoldSentEvent,
  PhaseChangedEvent,
} from "@/hooks/useSessionSocket";

interface FlawIndexEntry {
  flaw_id: string;
  locations: string[];
  flaw_type: string;
  severity: string;
}

interface LocateModeProps {
  sessionId: string;
  groupId: string;
  userId: string;
  activityType: "presentation" | "discussion";
  transcript: unknown;
  agents: Agent[];
  flawIndex: FlawIndexEntry[];
  initialAnnotations: Annotation[];
  pendingScaffolds: { id: string; text: string; level: number; type: string }[];
  readOnly: boolean;
  hintScope?: "sentence" | "section";
  sessionPhase: string;
  existingNoFlawIds?: string[];
}

const SECTION_LABELS: Record<string, string> = {
  introduction: "the Introduction section",
  approach: "the Approach section",
  findings: "the Findings section",
  solution: "the Solution section",
  conclusion: "the Conclusion section",
};

function getLocationLabel(locations: string[], activityType: string, hintScope: "sentence" | "section", transcript?: unknown): string {
  const sectionLabel = (() => {
    if (activityType === "presentation") {
      for (const loc of locations) {
        const sectionKey = loc.replace("section_", "");
        if (SECTION_LABELS[sectionKey]) return SECTION_LABELS[sectionKey];
      }
      return `section: ${locations[0]}`;
    }
    return `turns ${locations.join(", ")}`;
  })();

  if (hintScope === "sentence" && transcript && locations.length > 0) {
    // Sentence-level: find the section content and identify which sentence area
    const sections = (transcript as PresentationTranscript).sections || [];
    const section = sections.find((s) => locations.includes(s.section_id));
    if (section) {
      const sentences = section.content.split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
      if (sentences.length > 2) {
        // Give a general position hint
        return `${sectionLabel} (near the ${sentences.length <= 3 ? "middle" : "first half"})`;
      }
    }
  }

  return sectionLabel;
}

export function LocateMode({
  sessionId,
  groupId,
  userId,
  activityType,
  transcript,
  agents,
  flawIndex,
  initialAnnotations,
  pendingScaffolds: initialScaffolds,
  readOnly,
  hintScope = "section",
  sessionPhase,
  existingNoFlawIds = [],
}: LocateModeProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [pendingLocation, setPendingLocation] = useState<AnnotationLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [scaffolds, setScaffolds] = useState(initialScaffolds);
  const [phaseNotice, setPhaseNotice] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(sessionPhase);
  const [noFlawResolved, setNoFlawResolved] = useState<Set<string>>(new Set(existingNoFlawIds));
  const router = useRouter();

  const clearPending = useCallback(() => setPendingLocation(null), []);
  useSelectionClear(pendingLocation !== null, clearPending);

  // Inject false positive hint cards (deterministic per session+group)
  const augmentedFlawIndex = useMemo(() => {
    const all = [...flawIndex];
    const flawedLocations = new Set(flawIndex.flatMap((f) => f.locations));

    // Find non-flawed sections/turns
    const items = activityType === "presentation"
      ? ((transcript as PresentationTranscript).sections || []).map((s) => s.section_id)
      : ((transcript as DiscussionTranscript).turns || []).map((t) => t.turn_id);

    const nonFlawedItems = items.filter((id) => !flawedLocations.has(id));
    if (nonFlawedItems.length === 0) return all;

    // Deterministic pseudo-random
    let seed = 0;
    for (const ch of sessionId + groupId) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    const shuffled = [...nonFlawedItems].sort(() => rng() - 0.5);
    const fpCount = Math.min(shuffled.length, 1);

    for (let i = 0; i < fpCount; i++) {
      // Insert false positive at a random position in the hint list
      const insertPos = Math.floor(rng() * (all.length + 1));
      all.splice(insertPos, 0, {
        flaw_id: `fp_${shuffled[i]}`,
        locations: [shuffled[i]],
        flaw_type: "no_flaw",
        severity: "none",
      });
    }
    return all;
  }, [flawIndex, activityType, transcript, sessionId, groupId]);

  const currentHint = augmentedFlawIndex[currentHintIndex];

  // Items to emphasize (from current hint's locations)
  const emphasizedItems = useMemo(
    () => currentHint?.locations || [],
    [currentHint]
  );

  // Socket handlers
  const onAnnotationCreated = useCallback((event: AnnotationCreatedEvent) => {
    if (event.annotation.userId === userId) return;
    if (currentPhase === "individual") return;
    setAnnotations((prev) => {
      if (prev.some((a) => a.id === event.annotation.id)) return prev;
      return [...prev, {
        id: event.annotation.id,
        location: event.annotation.location as AnnotationLocation,
        flawType: event.annotation.flawType as Annotation["flawType"],
        createdAt: event.annotation.createdAt,
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

  const handleFlawTypeSelected = useCallback(
    async (_flawType: FlawType) => {
      if (!pendingLocation || saving || !currentHint) return;
      setSaving(true);
      // In Locate mode, the flaw type comes from the hint, not the button
      const hintType = currentHint.flaw_type as FlawType;
      try {
        const res = await fetch("/api/annotations/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            groupId,
            location: pendingLocation,
            flawType: hintType,
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
    [sessionId, groupId, pendingLocation, saving, currentHint]
  );

  const handleUndo = useCallback(async () => {
    if (readOnly || annotations.length === 0) return;
    const last = annotations[annotations.length - 1];
    const res = await fetch(`/api/annotations/${last.id}`, { method: "DELETE" });
    if (res.ok) {
      setAnnotations((prev) => prev.slice(0, -1));
    }
  }, [readOnly, annotations]);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    const el = document.getElementById(annotation.location.item_id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const acknowledgeScaffold = useCallback(async (scaffoldId: string) => {
    await fetch(`/api/scaffolds/${scaffoldId}`, { method: "PATCH" });
    setScaffolds((prev) => prev.filter((s) => s.id !== scaffoldId));
  }, []);

  return (
    <div className="pb-20">
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          Reconnecting to live updates...
        </div>
      )}

      {phaseNotice && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-indigo-800">{phaseNotice}</p>
          <button onClick={() => setPhaseNotice(null)} className="text-indigo-400 hover:text-indigo-600 text-xs">&times;</button>
        </div>
      )}

      {scaffolds.length > 0 && (
        <div className="mb-4 space-y-2">
          {scaffolds.map((s) => (
            <div key={s.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-blue-700">From your teacher:</span>
                <p className="text-sm text-blue-900 mt-0.5">{s.text}</p>
              </div>
              <button onClick={() => acknowledgeScaffold(s.id)} className="text-xs text-blue-500 hover:text-blue-700 shrink-0 ml-3">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Hint Card */}
          {currentHint && (
            <div>
              <HintCard
                flawType={currentHint.flaw_type as FlawType | "no_flaw"}
                locationLabel={getLocationLabel(currentHint.locations, activityType, hintScope, transcript)}
                currentIndex={currentHintIndex}
                totalCount={augmentedFlawIndex.length}
              />
              {augmentedFlawIndex.length > 1 && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setCurrentHintIndex((i) => Math.max(0, i - 1))}
                    disabled={currentHintIndex === 0}
                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentHintIndex((i) => Math.min(flawIndex.length - 1, i + 1))}
                    disabled={currentHintIndex === augmentedFlawIndex.length - 1}
                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Transcript with emphasis */}
          {activityType === "presentation" ? (
            <PresentationView
              sections={(transcript as PresentationTranscript).sections}
              agents={agents}
              annotations={annotations}
              onTextSelected={handleTextSelected}
              onAnnotationClick={handleAnnotationClick}
              emphasizedItems={emphasizedItems}
            />
          ) : (
            <DiscussionView
              turns={(transcript as DiscussionTranscript).turns}
              agents={agents}
              annotations={annotations}
              onTextSelected={handleTextSelected}
              onAnnotationClick={handleAnnotationClick}
              emphasizedItems={emphasizedItems}
            />
          )}
        </div>

        {/* Sidebar: annotation list only (no flaw type legend) */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-20">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Your Flags ({annotations.length})</h3>
            {annotations.length === 0 ? (
              <p className="text-xs text-gray-400">No flags yet. Select text and click &ldquo;Flag This&rdquo; to mark a flaw.</p>
            ) : (
              <div className="space-y-1.5">
                {annotations.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleAnnotationClick(a)}
                    className="w-full text-left text-xs p-2 rounded border border-gray-200 hover:bg-gray-50 truncate text-gray-700"
                  >
                    &ldquo;{a.location.highlighted_text.slice(0, 60)}{a.location.highlighted_text.length > 60 ? "..." : ""}&rdquo;
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "No flaw found" feedback for false positive hints */}
      {currentHint?.flaw_type === "no_flaw" && noFlawResolved.has(currentHint.flaw_id) && (
        <div className="fixed bottom-16 left-0 right-0 z-30 flex justify-center">
          <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 font-medium shadow">
            Correct! No flaw here.
          </span>
        </div>
      )}

      {/* Bottom bar */}
      {currentHint?.flaw_type === "no_flaw" && !noFlawResolved.has(currentHint.flaw_id) ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
            <button
              onClick={() => handleFlawTypeSelected("reasoning")}
              disabled={!pendingLocation}
              className={`text-sm font-medium px-6 py-2 rounded-lg transition-all ${
                pendingLocation
                  ? "bg-gray-800 text-white shadow-sm hover:bg-gray-900"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Flag This
            </button>
            <button
              onClick={async () => {
                setNoFlawResolved((prev) => new Set(prev).add(currentHint.flaw_id));
                // Persist to DB as a FlawResponse so teacher can see it
                try {
                  await fetch("/api/flaw-responses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      groupId,
                      flawId: currentHint.flaw_id,
                      typeAnswer: "no_flaw",
                      correctType: "no_flaw",
                    }),
                  });
                } catch { /* silent */ }
              }}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              No flaw found
            </button>
          </div>
        </div>
      ) : (
        <FlawBottomBar
          hasSelection={pendingLocation !== null}
          annotations={annotations}
          onSelect={handleFlawTypeSelected}
          onUndo={handleUndo}
          readOnly={readOnly}
          difficultyMode="locate"
        />
      )}
    </div>
  );
}
