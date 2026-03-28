"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FlawType, FlawIndexEntry } from "@/lib/types";
import { FLAW_TYPES, HINT_UNLOCK_DELAY } from "@/lib/types";
import type { ExplainTurn } from "@/lib/turn-selection";
import { HintButton } from "@/components/shared/hint-button";
import { CollaborativeEditor } from "@/components/explain/collaborative-editor";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { FlawFieldGuide, FlawFieldGuideDrawer } from "@/components/annotation/flaw-field-guide";

// --- Types ---

interface GroupMember {
  id: string;
  displayName: string;
}

interface ExplainStageProps {
  sessionId: string;
  groupId: string;
  userId: string;
  explainTurns: ExplainTurn[];
  flawIndex: FlawIndexEntry[];
  groupMembers: GroupMember[];
  existingGroupSelections?: { turnId: string; flawId: string; typeAnswer: string }[];
  existingExplanations?: {
    id: string;
    turnId: string;
    authorId: string;
    authorName: string;
    text: string;
    revisionOf?: string;
    createdAt: string;
  }[];
  existingHints?: { turnId: string; hintLevel: number }[];
}

// --- Component ---

export function ExplainStage({
  sessionId,
  groupId,
  userId,
  explainTurns,
  groupMembers,
  existingExplanations = [],
  existingHints = [],
}: ExplainStageProps) {
  const router = useRouter();

  // Build member name lookup
  const memberNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of groupMembers) {
      map.set(m.id, m.displayName);
    }
    return map;
  }, [groupMembers]);

  // Per-turn state — simplified: no type selection, just writing
  interface TurnExplainState {
    hintsUsed: number;
    hintTemplate: string | null;
    discussed: boolean;
  }

  const initialTurnStates = useMemo(() => {
    const states = new Map<string, TurnExplainState>();
    for (const turn of explainTurns) {
      const hintData = existingHints.filter((h) => h.turnId === turn.id);
      const maxHint = hintData.length > 0 ? Math.max(...hintData.map((h) => h.hintLevel)) : 0;

      // A turn is "discussed" if we have an explanation for it
      const hasExplanation = existingExplanations.some((e) => e.turnId === turn.id);

      states.set(turn.id, {
        hintsUsed: maxHint,
        hintTemplate: maxHint >= 1 ? `This is a ${turn.correctFlawType} flaw because ___` : null,
        discussed: hasExplanation,
      });
    }
    return states;
  }, [explainTurns, existingExplanations, existingHints]);

  const [turnStates, setTurnStates] = useState(initialTurnStates);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = explainTurns.findIndex((t) => !turnStates.get(t.id)?.discussed);
    return idx >= 0 ? idx : 0;
  });
  const [hintLoading, setHintLoading] = useState(false);

  const currentTurn = explainTurns[currentIndex];
  const currentState = currentTurn ? turnStates.get(currentTurn.id) : undefined;
  const discussedCount = Array.from(turnStates.values()).filter((s) => s.discussed).length;

  // Track explanations with real-time updates
  const [liveExplanations, setLiveExplanations] = useState(existingExplanations);

  // Socket.IO for real-time updates
  const { isConnected } = useSessionSocket(sessionId, groupId, {
    onStageTransition: () => {
      router.refresh();
    },
    onExplanationSubmitted: (event) => {
      fetch(`/api/explanations?sessionId=${sessionId}&groupId=${groupId}&turnId=${event.turnId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setLiveExplanations(data.map((e: { id: string; turnId: string; authorId: string; author: { displayName: string }; text: string; revisionOf?: string; createdAt: string }) => ({
              id: e.id,
              turnId: e.turnId,
              authorId: e.authorId,
              authorName: e.authorId === userId ? "You" : e.author?.displayName || e.authorId,
              text: e.text,
              revisionOf: e.revisionOf || undefined,
              createdAt: e.createdAt,
            })));
          }
        })
        .catch(() => {});
    },
  });

  // --- Handlers ---

  const handleMarkDiscussed = useCallback(() => {
    if (!currentTurn) return;
    setTurnStates((prev) => {
      const next = new Map(prev);
      next.set(currentTurn.id, {
        ...prev.get(currentTurn.id)!,
        discussed: true,
      });
      return next;
    });
  }, [currentTurn]);

  const handleNext = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < explainTurns.length) {
      setCurrentIndex(nextIndex);
    } else {
      // All turns discussed — trigger transition to Collaborate
      try {
        await fetch(`/api/groups/${groupId}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        router.refresh();
      }
    }
  }, [currentIndex, explainTurns, groupId, router]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleRequestHint = useCallback(async () => {
    if (!currentTurn || hintLoading) return;

    setHintLoading(true);
    try {
      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId,
          turnId: currentTurn.id,
          stage: "explain",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.template) {
          setTurnStates((prev) => {
            const next = new Map(prev);
            next.set(currentTurn.id, {
              ...prev.get(currentTurn.id)!,
              hintsUsed: 1,
              hintTemplate: data.template,
            });
            return next;
          });
        }
      }
    } catch {
      // Silently fail
    }
    setHintLoading(false);
  }, [currentTurn, sessionId, groupId, hintLoading]);

  // --- Render ---

  // Auto-transition when no turns need discussion
  useEffect(() => {
    if (explainTurns.length === 0) {
      fetch(`/api/groups/${groupId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((res) => {
        if (res.ok) {
          setTimeout(() => router.refresh(), 200);
        }
      }).catch(() => {
        setTimeout(() => router.refresh(), 500);
      });
    }
  }, [explainTurns.length, groupId, router]);

  if (explainTurns.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <h2 className="text-lg font-bold text-green-900">All correct!</h2>
          <p className="text-sm text-green-700 mt-2">
            Your group identified every flaw correctly in Recognize. Moving on...
          </p>
        </div>
      </div>
    );
  }

  // Max 1 hint in Explain (template only)
  const hintsRemaining = currentState ? 1 - currentState.hintsUsed : 1;
  const allDiscussed = discussedCount === explainTurns.length;

  // Get existing explanations for current turn
  const currentExplanations = currentTurn
    ? liveExplanations
        .filter((e) => e.turnId === currentTurn.id)
        .map((e) => ({
          ...e,
          authorName: e.authorId === userId ? "You" : (memberNames.get(e.authorId) || e.authorId),
        }))
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-xs text-yellow-700">
          Reconnecting to live updates...
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Explain</h2>
        <p className="text-sm text-gray-500 mt-1">
          Teach your group — explain why each flaw is a problem in your own words.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Turn {currentIndex + 1} of {explainTurns.length}</span>
          <span>{discussedCount} explained</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(discussedCount / explainTurns.length) * 100}%` }}
          />
        </div>
      </div>

      {currentTurn && currentState && (
        <>
          {/* Turn content */}
          <div key={currentTurn.id} className="bg-white border border-gray-200 rounded-xl p-6 mb-4 animate-turn-enter">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-900">{currentTurn.speaker}</span>
              {currentTurn.role && (
                <span className="text-xs text-gray-400">{currentTurn.role}</span>
              )}
              {currentTurn.section && (
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded">
                  {currentTurn.section}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{currentTurn.content}</p>
          </div>

          {/* Flaw type badge — always shown (students already know the answer) */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-gray-500">Flaw type:</span>
            {(() => {
              const type = currentTurn.correctFlawType as FlawType;
              const info = FLAW_TYPES[type];
              return info ? (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${info.bgColor} ${info.color}`}>
                  {info.label}
                </span>
              ) : null;
            })()}
          </div>

          {/* Framing prompt */}
          <p className="text-xs font-medium text-gray-500 mb-3">
            Teach your group — explain why this is a {FLAW_TYPES[currentTurn.correctFlawType as FlawType]?.label?.toLowerCase() || currentTurn.correctFlawType} flaw.
          </p>

          {/* Collaborative writing */}
          <div className="mb-4">
            <CollaborativeEditor
              sessionId={sessionId}
              groupId={groupId}
              turnId={currentTurn.id}
              userId={userId}
              stage="explain"
              template={currentState.hintTemplate || undefined}
              existingExplanations={currentExplanations}
            />

            {/* Mark as discussed button */}
            {!currentState.discussed && (
              <button
                onClick={handleMarkDiscussed}
                className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
              >
                Mark as explained
              </button>
            )}
          </div>
        </>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          &larr; Previous
        </button>

        <div className="flex items-center gap-3">
          {/* Hint button — 1 max (template only) */}
          {currentState && !currentState.discussed && (
            <HintButton
              hintsRemaining={hintsRemaining}
              unlockDelay={HINT_UNLOCK_DELAY.explain}
              onRequestHint={handleRequestHint}
              loading={hintLoading}
              exhausted={hintsRemaining <= 0}
              resetKey={currentTurn?.id}
            />
          )}

          {/* Next button — only when turn is discussed */}
          {currentState?.discussed && (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              {currentIndex < explainTurns.length - 1 ? "Next \u2192" : allDiscussed ? "Finish Explain" : "Next \u2192"}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {discussedCount > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
          {discussedCount} of {explainTurns.length} turns explained
        </div>
      )}

      {/* Flaw Field Guide — desktop sidebar + mobile drawer */}
      <div className="hidden lg:block fixed top-24 right-4 w-64 z-10">
        <FlawFieldGuide />
      </div>
      <FlawFieldGuideDrawer />
    </div>
  );
}
