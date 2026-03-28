"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { FlawType, TranscriptTurn, FlawIndexEntry } from "@/lib/types";
import { FLAW_TYPES, HINT_UNLOCK_DELAY, DEFAULT_THRESHOLDS } from "@/lib/types";
import { HintButton } from "@/components/shared/hint-button";
import { GoalBar } from "@/components/shared/goal-bar";

// --- Types ---

interface TurnState {
  answered: boolean;
  correct: boolean;
  hintsUsed: number;
  selectedType: FlawType | null;
  eliminatedChoices: FlawType[];
}

interface RecognizeStageProps {
  sessionId: string;
  groupId: string;
  userId: string;
  turns: TranscriptTurn[];
  flawIndex: FlawIndexEntry[];
  existingResponses?: {
    flawId: string;
    typeAnswer: string;
    typeCorrect: boolean;
    hintLevel?: number;
  }[];
  existingHints?: {
    turnId: string;
    hintLevel: number;
  }[];
  /** Pass threshold from session config (null = use default) */
  threshold?: number | null;
  /** Called when student completes all turns */
  onComplete?: (stats: { totalTurns: number; correct: number; hintsUsed: number }) => void;
}

// --- Button colors ---

const BUTTON_COLORS: Record<FlawType, { base: string; hover: string }> = {
  reasoning:    { base: "border-red-200 bg-red-50 text-red-700",        hover: "hover:border-red-400 hover:bg-red-100" },
  epistemic:    { base: "border-amber-200 bg-amber-50 text-amber-700",  hover: "hover:border-amber-400 hover:bg-amber-100" },
  completeness: { base: "border-blue-200 bg-blue-50 text-blue-700",     hover: "hover:border-blue-400 hover:bg-blue-100" },
  coherence:    { base: "border-purple-200 bg-purple-50 text-purple-700", hover: "hover:border-purple-400 hover:bg-purple-100" },
};

const ALL_FLAW_TYPES: FlawType[] = ["reasoning", "epistemic", "completeness", "coherence"];

// --- Component ---

export function RecognizeStage({
  sessionId,
  groupId,
  userId,
  turns,
  flawIndex,
  existingResponses = [],
  existingHints = [],
  threshold,
  onComplete,
}: RecognizeStageProps) {
  // Build the turn sequence: only flawed turns, in transcript order
  const turnSequence = useMemo(() => {
    const flawedTurnIds = new Set<string>();
    for (const flaw of flawIndex) {
      for (const loc of flaw.locations) flawedTurnIds.add(loc);
    }
    return turns.filter((t) => flawedTurnIds.has(t.id));
  }, [turns, flawIndex]);

  // Build initial state from existing responses + hints
  const initialTurnStates = useMemo(() => {
    const states = new Map<string, TurnState>();

    // Initialize all turns as unanswered
    for (const turn of turnSequence) {
      states.set(turn.id, {
        answered: false,
        correct: false,
        hintsUsed: 0,
        selectedType: null,
        eliminatedChoices: [],
      });
    }

    // Apply existing hints
    const hintsByTurn = new Map<string, number>();
    for (const hint of existingHints) {
      const current = hintsByTurn.get(hint.turnId) || 0;
      hintsByTurn.set(hint.turnId, Math.max(current, hint.hintLevel));
    }

    // Apply existing responses (find the flaw for each turn to map flawId → turnId)
    const flawToTurn = new Map<string, string>();
    for (const flaw of flawIndex) {
      for (const loc of flaw.locations) {
        flawToTurn.set(flaw.flaw_id, loc);
      }
    }

    for (const resp of existingResponses) {
      const turnId = flawToTurn.get(resp.flawId) || resp.flawId;
      const state = states.get(turnId);
      if (state) {
        state.answered = true;
        state.correct = resp.typeCorrect;
        state.selectedType = resp.typeAnswer as FlawType;
        state.hintsUsed = resp.hintLevel || hintsByTurn.get(turnId) || 0;
      }
    }

    return states;
  }, [turnSequence, existingResponses, existingHints, flawIndex]);

  const [turnStates, setTurnStates] = useState<Map<string, TurnState>>(initialTurnStates);

  // Find the first unanswered turn, or the last turn if all answered
  const firstUnanswered = turnSequence.findIndex((t) => !turnStates.get(t.id)?.answered);
  const [currentIndex, setCurrentIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : turnSequence.length - 1);

  const [showingFeedback, setShowingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "correct" | "wrong"; text: string } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const currentTurn = turnSequence[currentIndex];
  const currentState = currentTurn ? turnStates.get(currentTurn.id) : undefined;

  // Find the correct flaw type for the current turn
  const currentFlaw = useMemo(() => {
    if (!currentTurn) return null;
    return flawIndex.find((f) => f.locations.includes(currentTurn.id)) || null;
  }, [currentTurn, flawIndex]);

  // Progress stats
  const answeredCount = Array.from(turnStates.values()).filter((s) => s.answered).length;
  const correctCount = Array.from(turnStates.values()).filter((s) => s.correct).length;
  const totalHints = Array.from(turnStates.values()).reduce((sum, s) => sum + s.hintsUsed, 0);
  const allComplete = answeredCount === turnSequence.length;

  // --- Handlers ---

  const handleSelectType = useCallback(async (type: FlawType) => {
    if (!currentTurn || !currentFlaw || currentState?.answered || showingFeedback) return;

    const isCorrect = currentFlaw.flaw_type === type;

    setShowingFeedback(true);

    if (isCorrect) {
      setFeedbackMessage({ type: "correct", text: "Correct!" });
    } else {
      setFeedbackMessage({ type: "wrong", text: `Not quite. The correct answer is ${FLAW_TYPES[currentFlaw.flaw_type as FlawType].label}.` });
    }

    // Save response to API
    try {
      await fetch("/api/flaw-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          flawId: currentFlaw.flaw_id,
          typeAnswer: type,
          correctType: currentFlaw.flaw_type,
          hintLevel: currentState?.hintsUsed || 0,
          stage: "recognize",
        }),
      });
    } catch {
      // Silently fail
    }

    // Update turn state
    setTurnStates((prev) => {
      const next = new Map(prev);
      next.set(currentTurn.id, {
        ...prev.get(currentTurn.id)!,
        answered: true,
        correct: isCorrect,
        selectedType: type,
      });
      return next;
    });
  }, [currentTurn, currentState, currentFlaw, showingFeedback, groupId]);

  const handleNext = useCallback(() => {
    setShowingFeedback(false);
    setFeedbackMessage(null);

    const nextIndex = currentIndex + 1;
    if (nextIndex < turnSequence.length) {
      setCurrentIndex(nextIndex);
    } else {
      // All turns complete — check if onComplete should fire
      const totalCorrect = Array.from(turnStates.values()).filter((s) => s.correct).length;
      const totalHintsUsed = Array.from(turnStates.values()).reduce((sum, s) => sum + s.hintsUsed, 0);
      onComplete?.({
        totalTurns: turnSequence.length,
        correct: totalCorrect + (currentState?.correct ? 0 : 0), // already counted
        hintsUsed: totalHintsUsed,
      });
    }
  }, [currentIndex, turnSequence, turnStates, currentState, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setShowingFeedback(false);
      setFeedbackMessage(null);
      setCurrentIndex(currentIndex - 1);
    }
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
          stage: "recognize",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update turn state with eliminated choice
        setTurnStates((prev) => {
          const next = new Map(prev);
          const state = prev.get(currentTurn.id)!;
          next.set(currentTurn.id, {
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
  }, [currentTurn, sessionId, groupId, hintLoading]);

  // --- Render ---

  if (turnSequence.length === 0) {
    return <div className="text-sm text-gray-500">No turns to evaluate.</div>;
  }

  // Signal parent when all turns are complete
  useEffect(() => {
    if (allComplete && !showingFeedback) {
      onComplete?.({
        totalTurns: turnSequence.length,
        correct: correctCount,
        hintsUsed: totalHints,
      });
    }
  }, [allComplete, showingFeedback, turnSequence.length, correctCount, totalHints, onComplete]);

  if (allComplete && !showingFeedback) {
    return null; // Parent will show waiting screen
  }

  const hintsRemaining = currentState ? 2 - (currentState.hintsUsed || 0) : 2;
  const availableTypes = ALL_FLAW_TYPES.filter(
    (t) => !currentState?.eliminatedChoices.includes(t)
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Recognize</h2>
        <p className="text-sm text-gray-500 mt-1">
          Read each turn and identify the type of critical thinking flaw.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Turn {currentIndex + 1} of {turnSequence.length}</span>
          <span>{answeredCount} completed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / turnSequence.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Goal bar */}
      <div className="mb-6">
        <GoalBar
          current={correctCount}
          threshold={threshold ?? DEFAULT_THRESHOLDS.recognize ?? Math.ceil(turnSequence.length / 2)}
          label="Goal: correct answers"
        />
      </div>

      {/* Current turn content */}
      {currentTurn && (
        <div key={currentTurn.id} className="bg-white border border-gray-200 rounded-xl p-6 mb-4 animate-turn-enter">
          {/* Speaker info */}
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

          {/* Turn content */}
          <p className="text-sm text-gray-800 leading-relaxed">{currentTurn.content}</p>
        </div>
      )}

      {/* Flaw type buttons */}
      {!currentState?.answered && !showingFeedback && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">What type of problem is this?</p>
          {ALL_FLAW_TYPES.map((type) => {
            const info = FLAW_TYPES[type];
            const isEliminated = currentState?.eliminatedChoices.includes(type);
            const colors = BUTTON_COLORS[type];

            return (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                disabled={isEliminated}
                className={`w-full text-left text-sm p-3 rounded-lg border transition-all ${
                  isEliminated
                    ? "border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed line-through"
                    : `${colors.base} ${colors.hover} cursor-pointer`
                }`}
              >
                <span className="font-semibold">{info.label}</span>
                <span className="text-xs ml-2 opacity-75">{info.description}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Feedback */}
      {showingFeedback && feedbackMessage && (
        <div
          className={`rounded-xl p-4 mb-4 ${
            feedbackMessage.type === "correct"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="text-sm font-medium mb-1">
            {feedbackMessage.type === "correct" ? "✓ Correct!" : "✗ Not quite"}
          </p>
          <p className="text-sm leading-relaxed">{feedbackMessage.text}</p>
        </div>
      )}

      {/* Bottom bar: hint button + navigation */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Hint button — only show when turn is not answered */}
          {!currentState?.answered && !showingFeedback && (
            <HintButton
              hintsRemaining={hintsRemaining}
              unlockDelay={HINT_UNLOCK_DELAY.recognize}
              onRequestHint={handleRequestHint}
              loading={hintLoading}
              exhausted={hintsRemaining <= 0}
              resetKey={currentTurn?.id}
            />
          )}

          {/* Next / Complete button */}
          {showingFeedback && (
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              {currentIndex < turnSequence.length - 1 ? "Next →" : "Done"}
            </button>
          )}
        </div>
      </div>

      {/* Score summary */}
      {answeredCount > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span>{correctCount} correct</span>
          <span>{totalHints} hints used</span>
        </div>
      )}
    </div>
  );
}
