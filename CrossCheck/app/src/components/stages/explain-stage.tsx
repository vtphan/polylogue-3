"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FlawType, FlawIndexEntry } from "@/lib/types";
import { FLAW_TYPES, HINT_UNLOCK_DELAY } from "@/lib/types";
import type { ExplainTurn } from "@/lib/turn-selection";
import { HintButton } from "@/components/shared/hint-button";
import { RecognizeDistribution } from "@/components/explain/recognize-distribution";
import { DisagreementPrompt } from "@/components/explain/disagreement-prompt";
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

type Step = "type_selection" | "writing";

const BUTTON_COLORS: Record<FlawType, { base: string; hover: string }> = {
  reasoning:    { base: "border-red-200 bg-red-50 text-red-700",        hover: "hover:border-red-400 hover:bg-red-100" },
  epistemic:    { base: "border-amber-200 bg-amber-50 text-amber-700",  hover: "hover:border-amber-400 hover:bg-amber-100" },
  completeness: { base: "border-blue-200 bg-blue-50 text-blue-700",     hover: "hover:border-blue-400 hover:bg-blue-100" },
  coherence:    { base: "border-purple-200 bg-purple-50 text-purple-700", hover: "hover:border-purple-400 hover:bg-purple-100" },
};

const ALL_FLAW_TYPES: FlawType[] = ["reasoning", "epistemic", "completeness", "coherence"];

// --- Component ---

export function ExplainStage({
  sessionId,
  groupId,
  userId,
  explainTurns,
  flawIndex,
  groupMembers,
  existingGroupSelections = [],
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

  // Enrich the Recognize distribution with display names
  const enrichedTurns = useMemo(() => {
    return explainTurns.map((turn) => {
      const namedDistribution: Record<string, string[]> = {};
      for (const [type, userIds] of Object.entries(turn.recognizeDistribution)) {
        namedDistribution[type] = userIds.map((id) => memberNames.get(id) || id);
      }
      return { ...turn, namedDistribution };
    });
  }, [explainTurns, memberNames]);

  // Per-turn state
  interface TurnExplainState {
    step: Step;
    groupTypeAnswer: FlawType | "no_flaw" | null;
    hintsUsed: number;
    hintTemplate: string | null;
    flawTypeRevealed: boolean;
    discussed: boolean;
  }

  const initialTurnStates = useMemo(() => {
    const states = new Map<string, TurnExplainState>();
    for (const turn of enrichedTurns) {
      // Check if there's an existing group selection
      const existing = existingGroupSelections.find((s) => s.flawId === turn.flawId);
      const hintData = existingHints.filter((h) => h.turnId === turn.id);
      const maxHint = hintData.length > 0 ? Math.max(...hintData.map((h) => h.hintLevel)) : 0;

      states.set(turn.id, {
        step: existing ? "writing" : "type_selection",
        groupTypeAnswer: existing ? (existing.typeAnswer as FlawType | "no_flaw") : null,
        hintsUsed: maxHint,
        hintTemplate: maxHint >= 2 ? `This is a ${turn.correctFlawType} flaw because ___` : null,
        flawTypeRevealed: maxHint >= 1,
        discussed: existing !== undefined,
      });
    }
    return states;
  }, [enrichedTurns, existingGroupSelections, existingHints]);

  const [turnStates, setTurnStates] = useState(initialTurnStates);
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Start at first undiscussed turn
    const idx = enrichedTurns.findIndex((t) => !turnStates.get(t.id)?.discussed);
    return idx >= 0 ? idx : 0;
  });
  const [hintLoading, setHintLoading] = useState(false);

  const currentTurn = enrichedTurns[currentIndex];
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
      // Fetch the new explanation to get full data
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

  // Determine if current user is in the minority
  const isMinority = useMemo(() => {
    if (!currentTurn?.hasDisagreement) return false;
    const dist = currentTurn.recognizeDistribution;
    // Find what the current user selected
    let userType: string | null = null;
    for (const [type, userIds] of Object.entries(dist)) {
      if (userIds.includes(userId)) {
        userType = type;
        break;
      }
    }
    if (!userType) return false;

    // Check if user's type has fewer votes than the majority
    const counts = Object.entries(dist).map(([type, ids]) => ({ type, count: ids.length }));
    counts.sort((a, b) => b.count - a.count);
    const majorityCount = counts[0]?.count || 0;
    const userCount = dist[userType]?.length || 0;
    return userCount < majorityCount;
  }, [currentTurn, userId]);

  // Get user's Recognize answer for this turn
  const userRecognizeAnswer = useMemo(() => {
    if (!currentTurn) return undefined;
    for (const [type, userIds] of Object.entries(currentTurn.recognizeDistribution)) {
      if (userIds.includes(userId)) return type;
    }
    return undefined;
  }, [currentTurn, userId]);

  // --- Handlers ---

  const handleSelectType = useCallback(async (type: FlawType | "no_flaw") => {
    if (!currentTurn || !currentState) return;

    // Save group selection to API
    try {
      await fetch("/api/flaw-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          flawId: currentTurn.flawId,
          typeAnswer: type,
          correctType: currentTurn.correctFlawType,
          hintLevel: currentState.hintsUsed,
          stage: "explain",
        }),
      });
    } catch {
      // Silently fail
    }

    if (type === "no_flaw") {
      // Skip writing step — mark as discussed and advance
      setTurnStates((prev) => {
        const next = new Map(prev);
        next.set(currentTurn.id, {
          ...prev.get(currentTurn.id)!,
          step: "writing",
          groupTypeAnswer: type,
          discussed: true,
        });
        return next;
      });
    } else {
      // Move to writing step
      setTurnStates((prev) => {
        const next = new Map(prev);
        next.set(currentTurn.id, {
          ...prev.get(currentTurn.id)!,
          step: "writing",
          groupTypeAnswer: type,
        });
        return next;
      });
    }
  }, [currentTurn, currentState, groupId]);

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
    if (nextIndex < enrichedTurns.length) {
      setCurrentIndex(nextIndex);
    } else {
      // All turns discussed — trigger stage transition
      try {
        await fetch(`/api/groups/${groupId}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // Server auto-determines locate vs results
        });
      } catch {
        // Fallback: refresh
        router.refresh();
      }
    }
  }, [currentIndex, enrichedTurns, groupId, router]);

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
        setTurnStates((prev) => {
          const next = new Map(prev);
          const state = prev.get(currentTurn.id)!;

          if (data.hintLevel === 1 && data.autoCompleteStep1) {
            // Hint 1: auto-select flaw type
            next.set(currentTurn.id, {
              ...state,
              hintsUsed: 1,
              flawTypeRevealed: true,
              step: "writing",
              groupTypeAnswer: data.flawType as FlawType,
            });
          } else if (data.hintLevel === 2 && data.template) {
            // Hint 2: show guided template
            next.set(currentTurn.id, {
              ...state,
              hintsUsed: 2,
              hintTemplate: data.template,
            });
          }

          return next;
        });

        // If hint auto-completed step 1, also save the response
        if (data.autoCompleteStep1) {
          try {
            await fetch("/api/flaw-responses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                groupId,
                flawId: currentTurn.flawId,
                typeAnswer: data.flawType,
                correctType: currentTurn.correctFlawType,
                hintLevel: 1,
                stage: "explain",
              }),
            });
          } catch { /* ok */ }
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
    if (enrichedTurns.length === 0) {
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
  }, [enrichedTurns.length, groupId, router]);

  if (enrichedTurns.length === 0) {
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

  const hintsRemaining = currentState ? 2 - currentState.hintsUsed : 2;
  const allDiscussed = discussedCount === enrichedTurns.length;

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
          Discuss each turn with your group. Select the flaw type, then write why it&apos;s a flaw.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Turn {currentIndex + 1} of {enrichedTurns.length}</span>
          <span>{discussedCount} discussed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(discussedCount / enrichedTurns.length) * 100}%` }}
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

          {/* Recognize distribution */}
          <div className="mb-4">
            <RecognizeDistribution
              distribution={currentTurn.namedDistribution}
              hasDisagreement={currentTurn.hasDisagreement}
            />
            <DisagreementPrompt
              isMinority={isMinority}
              minorityTypes={[]}
              userAnswer={userRecognizeAnswer}
            />
          </div>

          {/* Step 1: Type selection */}
          {currentState.step === "type_selection" && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                As a group, what type of flaw is this?
              </p>
              <div className="space-y-2">
                {ALL_FLAW_TYPES.map((type) => {
                  const info = FLAW_TYPES[type];
                  const colors = BUTTON_COLORS[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className={`w-full text-left text-sm p-3 rounded-lg border transition-all ${colors.base} ${colors.hover} cursor-pointer`}
                    >
                      <span className="font-semibold">{info.label}</span>
                      <span className="text-xs ml-2 opacity-75">{info.description}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => handleSelectType("no_flaw")}
                  className="w-full text-left text-sm p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <span className="font-semibold">No flaw here</span>
                  <span className="text-xs ml-2 opacity-75">This turn doesn&apos;t contain a problem.</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Collaborative writing */}
          {currentState.step === "writing" && currentState.groupTypeAnswer && currentState.groupTypeAnswer !== "no_flaw" && (
            <div className="mb-4">
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-500">Flaw type:</span>
                {(() => {
                  const type = currentState.groupTypeAnswer as FlawType;
                  const info = FLAW_TYPES[type];
                  return info ? (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${info.bgColor} ${info.color}`}>
                      {info.label}
                    </span>
                  ) : null;
                })()}
                {currentState.flawTypeRevealed && (
                  <span className="text-[10px] text-gray-400 italic">via strategic support</span>
                )}
              </div>

              <CollaborativeEditor
                sessionId={sessionId}
                groupId={groupId}
                turnId={currentTurn.id}
                userId={userId}
                template={currentState.hintTemplate || undefined}
                existingExplanations={currentExplanations}
              />

              {/* Mark as discussed button — only after type selection */}
              {!currentState.discussed && currentState.groupTypeAnswer && (
                <button
                  onClick={handleMarkDiscussed}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                >
                  Mark as discussed
                </button>
              )}
            </div>
          )}

          {/* No flaw selected — just show a note */}
          {currentState.step === "writing" && currentState.groupTypeAnswer === "no_flaw" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                Your group decided this turn has no flaw.
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          {/* Hint button */}
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
              {currentIndex < enrichedTurns.length - 1 ? "Next →" : allDiscussed ? "Finish Explain" : "Next →"}
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {discussedCount > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
          {discussedCount} of {enrichedTurns.length} turns discussed
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
