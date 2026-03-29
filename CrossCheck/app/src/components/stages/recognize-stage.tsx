"use client";

import { useState, useMemo, useCallback } from "react";
import type { FlawType, TranscriptTurn, FlawIndexEntry } from "@/lib/types";
import { FLAW_TYPES, HINT_UNLOCK_DELAY, DEFAULT_THRESHOLDS, COIN_VALUES } from "@/lib/types";
import { HintButton } from "@/components/shared/hint-button";
import { HighlightedTurnContent } from "./highlighted-turn-content";
import { findEvidenceOffsets } from "@/lib/evidence-offsets";

// --- Types ---

interface FlawState {
  flawId: string;
  turnId: string;
  answered: boolean;
  correct: boolean;
  hintsUsed: number;
  selectedType: FlawType | null;
  eliminatedChoices: FlawType[];
  coins: number;
}

interface EvaluationFlaw {
  flaw_id: string;
  evidence: string;
  flaw_type: string;
}

interface RecognizeStageProps {
  sessionId: string;
  groupId: string;
  userId: string;
  turns: TranscriptTurn[];
  flawIndex: FlawIndexEntry[];
  evaluationFlaws?: EvaluationFlaw[];
  existingResponses?: {
    flawId: string;
    typeAnswer: string;
    typeCorrect: boolean;
    hintLevel?: number;
    coins?: number;
  }[];
  existingHints?: {
    turnId: string;
    hintLevel: number;
  }[];
  threshold?: number | null;
}

// --- Button colors (tablet-friendly) ---

const BUTTON_COLORS: Record<FlawType, { base: string; hover: string; icon: string }> = {
  reasoning:    { base: "border-red-200 bg-red-50 text-red-800",        hover: "hover:border-red-400 hover:bg-red-100 active:bg-red-200", icon: "🧠" },
  epistemic:    { base: "border-amber-200 bg-amber-50 text-amber-800",  hover: "hover:border-amber-400 hover:bg-amber-100 active:bg-amber-200", icon: "📚" },
  completeness: { base: "border-blue-200 bg-blue-50 text-blue-800",     hover: "hover:border-blue-400 hover:bg-blue-100 active:bg-blue-200", icon: "🧩" },
  coherence:    { base: "border-purple-200 bg-purple-50 text-purple-800", hover: "hover:border-purple-400 hover:bg-purple-100 active:bg-purple-200", icon: "🔗" },
};

const ALL_FLAW_TYPES: FlawType[] = ["reasoning", "epistemic", "completeness", "coherence"];

// --- Component ---

export function RecognizeStage({
  sessionId,
  groupId,
  turns,
  flawIndex,
  evaluationFlaws = [],
  existingResponses = [],
  existingHints = [],
  threshold,
}: RecognizeStageProps) {
  // Build turn → flawIds mapping (a turn can have multiple flaws)
  const turnFlawMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const flaw of flawIndex) {
      for (const loc of flaw.locations) {
        const existing = map.get(loc) || [];
        existing.push(flaw.flaw_id);
        map.set(loc, existing);
      }
    }
    return map;
  }, [flawIndex]);

  // Determine which flaws are answerable (have evidence locatable in a turn)
  const answerableFlawIds = useMemo(() => {
    const ids = new Set<string>();
    const turnMap = new Map(turns.map((t) => [t.id, t]));
    for (const flaw of flawIndex) {
      const evalFlaw = evaluationFlaws.find((ef) => ef.flaw_id === flaw.flaw_id);
      if (!evalFlaw) continue;
      for (const loc of flaw.locations) {
        const turn = turnMap.get(loc);
        if (turn && findEvidenceOffsets(evalFlaw.evidence, turn.content)) {
          ids.add(flaw.flaw_id);
          break;
        }
      }
    }
    return ids;
  }, [flawIndex, evaluationFlaws, turns]);

  // Turn sequence: only turns that have at least one answerable flaw
  const turnSequence = useMemo(() => {
    return turns.filter((t) => {
      const flawIds = turnFlawMap.get(t.id) || [];
      return flawIds.some((fid) => answerableFlawIds.has(fid));
    });
  }, [turns, turnFlawMap, answerableFlawIds]);

  // Total answerable flaws
  const totalFlaws = answerableFlawIds.size;

  // Build initial flaw states from existing responses + hints
  const initialFlawStates = useMemo(() => {
    const states = new Map<string, FlawState>();

    // Initialize only answerable flaws as unanswered
    for (const flaw of flawIndex) {
      if (!answerableFlawIds.has(flaw.flaw_id)) continue;
      const turnId = flaw.locations[0] || "";
      states.set(flaw.flaw_id, {
        flawId: flaw.flaw_id,
        turnId,
        answered: false,
        correct: false,
        hintsUsed: 0,
        selectedType: null,
        eliminatedChoices: [],
        coins: 0,
      });
    }

    // Apply existing hints
    for (const hint of existingHints) {
      const flawIds = turnFlawMap.get(hint.turnId) || [];
      for (const fid of flawIds) {
        const state = states.get(fid);
        if (state && hint.hintLevel > state.hintsUsed) {
          state.hintsUsed = hint.hintLevel;
        }
      }
    }

    // Apply existing responses
    for (const resp of existingResponses) {
      const state = states.get(resp.flawId);
      if (state) {
        state.answered = true;
        state.correct = resp.typeCorrect;
        state.selectedType = resp.typeAnswer as FlawType;
        state.hintsUsed = resp.hintLevel || state.hintsUsed;
        state.coins = resp.coins || 0;
      }
    }

    return states;
  }, [flawIndex, existingResponses, existingHints, turnFlawMap, answerableFlawIds]);

  const [flawStates, setFlawStates] = useState<Map<string, FlawState>>(initialFlawStates);

  // Find initial turn: first turn with an unanswered flaw, or first turn
  const initialIndex = useMemo(() => {
    const idx = turnSequence.findIndex((t) => {
      const flawIds = turnFlawMap.get(t.id) || [];
      return flawIds.some((fid) => !initialFlawStates.get(fid)?.answered);
    });
    return idx >= 0 ? idx : 0;
  }, [turnSequence, turnFlawMap, initialFlawStates]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [activeFlawId, setActiveFlawId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "correct" | "wrong"; text: string; flawId: string; coins: number } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [coinPop, setCoinPop] = useState<{ coins: number; key: number } | null>(null);

  const currentTurn = turnSequence[currentIndex];
  const currentFlawIds = currentTurn ? (turnFlawMap.get(currentTurn.id) || []) : [];
  const activeFlaw = activeFlawId ? flawIndex.find((f) => f.flaw_id === activeFlawId) : null;
  const activeState = activeFlawId ? flawStates.get(activeFlawId) : undefined;

  // Progress stats
  const answeredCount = Array.from(flawStates.values()).filter((s) => s.answered).length;
  const correctCount = Array.from(flawStates.values()).filter((s) => s.correct).length;
  const totalCoins = Array.from(flawStates.values()).reduce((sum, s) => sum + s.coins, 0);
  const totalHints = Array.from(flawStates.values()).reduce((sum, s) => sum + s.hintsUsed, 0);
  const allComplete = answeredCount === totalFlaws;

  // Compute flaw highlights for current turn
  const currentTurnHighlights = useMemo(() => {
    if (!currentTurn) return [];
    const flawIds = turnFlawMap.get(currentTurn.id) || [];

    return flawIds.map((fid) => {
      const flaw = flawIndex.find((f) => f.flaw_id === fid);
      if (!flaw) return null;
      const evalFlaw = evaluationFlaws.find((ef) => ef.flaw_id === fid);
      if (!evalFlaw) return null;
      const offsets = findEvidenceOffsets(evalFlaw.evidence, currentTurn.content);
      if (!offsets) return null;
      const state = flawStates.get(fid);
      return {
        flawId: fid,
        flawType: flaw.flaw_type as FlawType,
        start: offsets.start,
        end: offsets.end,
        isActive: fid === activeFlawId,
        answered: state?.answered ?? false,
        correct: state?.correct ?? false,
      };
    }).filter((h): h is NonNullable<typeof h> => h !== null);
  }, [currentTurn, turnFlawMap, flawIndex, evaluationFlaws, activeFlawId, flawStates]);

  // Per-turn status for dot indicators
  const turnStatuses = useMemo(() => {
    return turnSequence.map((turn) => {
      const flawIds = turnFlawMap.get(turn.id) || [];
      const states = flawIds.map((fid) => flawStates.get(fid));
      const answered = states.filter((s) => s?.answered).length;
      const correct = states.filter((s) => s?.correct).length;
      if (answered === 0) return "unanswered" as const;
      if (answered === flawIds.length && correct === flawIds.length) return "all_correct" as const;
      if (answered === flawIds.length) return "all_answered" as const;
      return "partial" as const;
    });
  }, [turnSequence, turnFlawMap, flawStates]);

  // Helper: clear active flaw when navigating to a new turn
  const clearActiveFlaw = useCallback(() => {
    setActiveFlawId(null);
    setFeedbackMessage(null);
  }, []);

  // --- Handlers ---

  const handleSelectType = useCallback(async (type: FlawType) => {
    if (!currentTurn || !activeFlaw || !activeFlawId || activeState?.answered) return;

    const isCorrect = activeFlaw.flaw_type === type;
    const earnedCoins = isCorrect
      ? (activeState?.hintsUsed === 0 ? COIN_VALUES.recognize_correct_independent : COIN_VALUES.recognize_correct)
      : COIN_VALUES.recognize_wrong;

    setFeedbackMessage({
      type: isCorrect ? "correct" : "wrong",
      text: isCorrect
        ? "Correct!"
        : `Not quite. The correct answer is ${FLAW_TYPES[activeFlaw.flaw_type as FlawType].label}.`,
      flawId: activeFlawId,
      coins: earnedCoins,
    });

    // Show coin pop animation
    if (earnedCoins > 0) {
      setCoinPop({ coins: earnedCoins, key: Date.now() });
      setTimeout(() => setCoinPop(null), 1500);
    }

    // Save response to API
    try {
      await fetch("/api/flaw-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          flawId: activeFlaw.flaw_id,
          typeAnswer: type,
          correctType: activeFlaw.flaw_type,
          hintLevel: activeState?.hintsUsed || 0,
          stage: "recognize",
        }),
      });
    } catch {
      // Silently fail
    }

    // Update flaw state
    setFlawStates((prev) => {
      const next = new Map(prev);
      next.set(activeFlawId, {
        ...prev.get(activeFlawId)!,
        answered: true,
        correct: isCorrect,
        selectedType: type,
        coins: earnedCoins,
      });
      return next;
    });
  }, [currentTurn, activeFlaw, activeFlawId, activeState, groupId]);

  const handleNavigate = useCallback((index: number) => {
    if (index < 0 || index >= turnSequence.length) return;
    setCurrentIndex(index);
    clearActiveFlaw();
  }, [turnSequence, clearActiveFlaw]);

  const handleRequestHint = useCallback(async () => {
    if (!currentTurn || !activeFlawId || hintLoading) return;

    setHintLoading(true);
    try {
      const res = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          groupId,
          turnId: currentTurn.id,
          stage: "recognize",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFlawStates((prev) => {
          const next = new Map(prev);
          const state = prev.get(activeFlawId)!;
          next.set(activeFlawId, {
            ...state,
            hintsUsed: data.hintLevel,
            eliminatedChoices: [...state.eliminatedChoices, data.eliminatedChoice],
          });
          return next;
        });
      }
    } catch {
      // Silently fail
    }
    setHintLoading(false);
  }, [currentTurn, activeFlawId, sessionId, groupId, hintLoading]);

  // --- Render ---

  if (turnSequence.length === 0) {
    return <div className="text-base text-gray-500 text-center py-12">No turns to evaluate.</div>;
  }

  // Completion screen
  if (allComplete) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-b from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-2xl font-bold text-green-800 mb-2">Stage Complete!</p>
          <p className="text-base text-green-700 mb-6">
            You identified all the flaws in this transcript.
          </p>

          {/* Coin total */}
          <div className="inline-flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-full px-6 py-3 mb-6">
            <span className="text-2xl">🪙</span>
            <span className="text-2xl font-bold text-yellow-800">{totalCoins}</span>
            <span className="text-sm text-yellow-700">coins earned</span>
          </div>

          <div className="flex justify-center gap-8 text-base text-green-700">
            <div className="text-center">
              <div className="text-2xl font-bold">{correctCount}</div>
              <div className="text-xs text-green-600">correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalFlaws - correctCount}</div>
              <div className="text-xs text-green-600">incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalHints}</div>
              <div className="text-xs text-green-600">hints</div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400 text-center mt-6">
          Waiting for your teacher to advance to the next stage.
        </p>
      </div>
    );
  }

  const hintsRemaining = activeState ? 2 - (activeState.hintsUsed || 0) : 2;
  const showingFeedbackForActive = feedbackMessage && feedbackMessage.flawId === activeFlawId;
  // Only count answerable flaws visible in this turn
  const answerableFlawsInTurn = currentFlawIds.filter((fid) => answerableFlawIds.has(fid));
  const flawsInCurrentTurn = answerableFlawsInTurn.length;
  const goalThreshold = threshold ?? DEFAULT_THRESHOLDS.recognize ?? Math.ceil(totalFlaws / 2);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Top bar: coin counter + progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Recognize</h2>
        </div>
        {/* Coin counter */}
        <div className="relative flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-lg font-bold text-yellow-800 tabular-nums">{totalCoins}</span>
          {/* Coin pop animation */}
          {coinPop && (
            <span
              key={coinPop.key}
              className="absolute -top-6 right-0 text-lg font-bold text-yellow-600 animate-bounce"
            >
              +{coinPop.coins}
            </span>
          )}
        </div>
      </div>

      {/* Goal progress bar */}
      <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            {correctCount >= goalThreshold ? "🎯 Goal reached!" : `🎯 Goal: ${correctCount} / ${goalThreshold} correct`}
          </span>
          <span className="text-xs text-gray-400">{answeredCount}/{totalFlaws} answered</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              correctCount >= goalThreshold ? "bg-green-500" : "bg-indigo-400"
            }`}
            style={{ width: `${Math.min(100, (correctCount / goalThreshold) * 100)}%` }}
          />
        </div>
      </div>

      {/* Turn navigation dots */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {turnSequence.map((turn, i) => {
          const status = turnStatuses[i];
          const isCurrent = i === currentIndex;
          const dotColor =
            status === "all_correct" ? "bg-green-400" :
            status === "all_answered" ? "bg-amber-400" :
            status === "partial" ? "bg-amber-300" :
            "bg-gray-200";
          return (
            <button
              key={turn.id}
              onClick={() => handleNavigate(i)}
              className={`w-5 h-5 md:w-4 md:h-4 rounded-full transition-all ${dotColor} ${
                isCurrent ? "ring-2 ring-indigo-400 ring-offset-2 scale-125" : "hover:scale-110 active:scale-95"
              }`}
              title={`Turn ${i + 1}: ${turn.speaker}`}
            />
          );
        })}
        <span className="text-xs text-gray-400 ml-2">
          {currentIndex + 1}/{turnSequence.length}
        </span>
      </div>

      {/* Current turn content */}
      {currentTurn && (
        <div key={currentTurn.id} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-8 mb-5 shadow-sm">
          {/* Speaker info */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base font-bold text-gray-900">{currentTurn.speaker}</span>
            {currentTurn.role && (
              <span className="text-sm text-gray-400">{currentTurn.role}</span>
            )}
            {currentTurn.section && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded-md">
                {currentTurn.section}
              </span>
            )}
            {flawsInCurrentTurn > 1 && (
              <span className="text-xs text-gray-400 ml-auto">
                {answerableFlawsInTurn.filter((fid) => flawStates.get(fid)?.answered).length}/{flawsInCurrentTurn} done
              </span>
            )}
          </div>

          {/* Turn content with flaw highlighting */}
          {currentTurnHighlights.length > 0 ? (
            <HighlightedTurnContent
              content={currentTurn.content}
              flawHighlights={currentTurnHighlights}
              onFlawClick={(flawId) => {
                setActiveFlawId(flawId);
                const state = flawStates.get(flawId);
                if (state?.answered) {
                  const flaw = flawIndex.find((f) => f.flaw_id === flawId);
                  const correctLabel = flaw ? FLAW_TYPES[flaw.flaw_type as FlawType]?.label : "";
                  setFeedbackMessage({
                    type: state.correct ? "correct" : "wrong",
                    text: state.correct
                      ? `You correctly identified this as ${correctLabel}.`
                      : `You answered ${FLAW_TYPES[state.selectedType!]?.label || state.selectedType}. The correct answer is ${correctLabel}.`,
                    flawId,
                    coins: state.coins,
                  });
                } else {
                  setFeedbackMessage(null);
                }
              }}
            />
          ) : (
            <p className="text-base md:text-lg text-gray-800 leading-relaxed md:leading-loose bg-yellow-50 rounded-lg px-3 py-2">{currentTurn.content}</p>
          )}

          {/* Instruction when no flaw is selected */}
          {!activeFlawId && !allComplete && currentTurnHighlights.some((h) => !h.answered) && (
            <p className="mt-4 text-sm text-indigo-500 text-center">
              Tap a highlighted sentence to identify the flaw
            </p>
          )}
        </div>
      )}

      {/* Flaw type buttons — only when a flaw is selected and unanswered */}
      {activeFlawId && activeState && !activeState.answered && !showingFeedbackForActive && (
        <div className="space-y-3 mb-5">
          <p className="text-sm font-medium text-gray-600">What type of problem is this?</p>
          {ALL_FLAW_TYPES.map((type) => {
            const info = FLAW_TYPES[type];
            const isEliminated = activeState.eliminatedChoices.includes(type);
            const colors = BUTTON_COLORS[type];

            return (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                disabled={isEliminated}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isEliminated
                    ? "border-gray-200 bg-gray-50 opacity-30 cursor-not-allowed line-through"
                    : `${colors.base} ${colors.hover} cursor-pointer`
                }`}
              >
                <span className="text-lg mr-2">{colors.icon}</span>
                <span className="text-base font-bold">{info.label}</span>
                <span className="text-sm ml-2 opacity-75">{info.description}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {showingFeedbackForActive && feedbackMessage && (
        <div
          className={`rounded-2xl p-5 mb-5 ${
            feedbackMessage.type === "correct"
              ? "bg-green-50 border-2 border-green-200 text-green-800"
              : "bg-red-50 border-2 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{feedbackMessage.type === "correct" ? "✅" : "❌"}</span>
            <div>
              <p className="text-base font-bold">
                {feedbackMessage.type === "correct" ? "Correct!" : "Not quite"}
              </p>
              <p className="text-sm leading-relaxed">{feedbackMessage.text}</p>
            </div>
            {feedbackMessage.coins > 0 && (
              <div className="ml-auto flex items-center gap-1 bg-yellow-100 rounded-full px-3 py-1">
                <span>🪙</span>
                <span className="font-bold text-yellow-800">+{feedbackMessage.coins}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom bar: navigation + hint */}
      <div className="flex items-center justify-between mt-5 pb-4">
        <button
          onClick={() => handleNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-xl text-base font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>

        <div className="flex items-center gap-3">
          {/* Hint button — only when a flaw is selected and unanswered */}
          {activeFlawId && activeState && !activeState.answered && !showingFeedbackForActive && (
            <HintButton
              hintsRemaining={hintsRemaining}
              unlockDelay={HINT_UNLOCK_DELAY.recognize}
              onRequestHint={handleRequestHint}
              loading={hintLoading}
              exhausted={hintsRemaining <= 0}
              resetKey={activeFlawId || "none"}
            />
          )}

          <button
            onClick={() => handleNavigate(currentIndex + 1)}
            disabled={currentIndex >= turnSequence.length - 1}
            className="px-5 py-3 rounded-xl text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
