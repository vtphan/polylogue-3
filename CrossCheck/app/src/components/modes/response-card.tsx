"use client";

import { useState } from "react";
import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

const BUTTON_COLORS: Record<FlawType, { base: string; hover: string }> = {
  reasoning:    { base: "border-red-200 bg-red-50 text-red-700",     hover: "hover:border-red-400 hover:bg-red-100" },
  epistemic:    { base: "border-amber-200 bg-amber-50 text-amber-700", hover: "hover:border-amber-400 hover:bg-amber-100" },
  completeness: { base: "border-blue-200 bg-blue-50 text-blue-700",   hover: "hover:border-blue-400 hover:bg-blue-100" },
  coherence:    { base: "border-purple-200 bg-purple-50 text-purple-700", hover: "hover:border-purple-400 hover:bg-purple-100" },
};

// Concise definitions for scaffolding in Recognize mode
const FLAW_DEFINITIONS: Record<FlawType, string> = {
  reasoning: "The logic doesn't hold up — bad arguments or jumping to conclusions.",
  epistemic: "Treating guesses as facts or being way too confident.",
  completeness: "Something important is missing — key people, tradeoffs, or counterpoints.",
  coherence: "Team members contradict each other or the conclusion doesn't match.",
};

/** Extended type that includes the "no_flaw" false positive option. */
export type ResponseType = FlawType | "no_flaw";

interface ResponseCardProps {
  flawId: string;
  correctType: ResponseType;
  explanation: string;
  groupId: string;
  userId: string;
  onResponse?: (flawId: string, typeAnswer: string, typeCorrect: boolean) => void;
  /** Called on every attempt (not just final). For parent state tracking. */
  onAttempt?: (flawId: string, typeAnswer: string, isCorrect: boolean, isResolved: boolean) => void;
  standalone?: boolean;
  showDefinitions?: boolean;
  maxAttempts?: number;
  /** Pre-existing attempts (persisted by parent across popup open/close). */
  initialAttempts?: number;
  /** Pre-existing eliminated types (persisted by parent). */
  initialEliminatedTypes?: string[];
  /** If true, card is already resolved (student used all attempts or got it right). */
  initialResolved?: boolean;
  /** A/B shows correct + 1 distractor; multiple_choice shows all 4. Both include "No flaw". */
  responseFormat?: "ab" | "multiple_choice";
}

export function ResponseCard({
  flawId,
  correctType,
  explanation,
  groupId,
  userId,
  onResponse,
  onAttempt,
  standalone,
  showDefinitions,
  maxAttempts,
  initialAttempts = 0,
  initialEliminatedTypes = [],
  initialResolved = false,
  responseFormat = "multiple_choice",
}: ResponseCardProps) {
  const [selectedType, setSelectedType] = useState<ResponseType | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [resolved, setResolved] = useState(initialResolved);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [eliminatedTypes, setEliminatedTypes] = useState<Set<string>>(new Set(initialEliminatedTypes));

  const allFlawTypes = Object.entries(FLAW_TYPES) as [FlawType, typeof FLAW_TYPES[FlawType]][];

  // In A/B mode, show correct type + 1 deterministic distractor (seeded by flawId)
  const flawTypes = (() => {
    if (responseFormat !== "ab" || correctType === "no_flaw") return allFlawTypes;
    // Deterministic pick of 1 distractor
    let seed = 0;
    for (const ch of flawId) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
    seed = Math.abs(seed);
    const others = allFlawTypes.filter(([t]) => t !== correctType);
    const distractor = others[seed % others.length];
    const pair = [allFlawTypes.find(([t]) => t === correctType)!, distractor];
    // Deterministic order (seed-based)
    return seed % 2 === 0 ? pair : pair.reverse();
  })();

  const effectiveMaxAttempts = maxAttempts ?? 2;

  async function handleSelect(type: ResponseType) {
    if (resolved || showingFeedback) return;
    setSelectedType(type);
    setShowingFeedback(true);

    const isCorrect = type === correctType;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Save response to API
    try {
      await fetch("/api/flaw-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          flawId,
          typeAnswer: type,
          correctType,
        }),
      });
    } catch {
      // Silently fail
    }

    if (isCorrect || newAttempts >= effectiveMaxAttempts) {
      setResolved(true);
      onAttempt?.(flawId, type, isCorrect, true);
      onResponse?.(flawId, type, isCorrect);
    } else {
      // Wrong answer but still has attempts — after showing feedback briefly, allow retry
      setEliminatedTypes((prev) => new Set(prev).add(type));
      onAttempt?.(flawId, type, isCorrect, false);
      setTimeout(() => {
        setSelectedType(null);
        setShowingFeedback(false);
      }, 1500);
    }

  }

  function getButtonStyle(type: ResponseType): string {
    const isEliminated = eliminatedTypes.has(type);

    if (resolved) {
      if (type === correctType) return "border-green-500 bg-green-50 ring-2 ring-green-300";
      if (type === selectedType) return "border-red-400 bg-red-50";
      return "border-gray-200 bg-gray-50 opacity-40";
    }

    if (showingFeedback && type === selectedType) return "border-red-400 bg-red-50";
    if (isEliminated) return "border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed";

    if (type === "no_flaw") {
      return "border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100";
    }

    const colors = BUTTON_COLORS[type];
    return `${colors.base} ${colors.hover}`;
  }

  const isDisabled = (type: ResponseType) => resolved || showingFeedback || eliminatedTypes.has(type);
  const attemptsRemaining = effectiveMaxAttempts - attempts;

  const wrapperClass = standalone
    ? "bg-white border border-gray-200 rounded-lg p-4 my-3 shadow-sm"
    : "";

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">What type of problem is this?</p>
        {!resolved && attempts > 0 && (
          <span className="text-[10px] text-gray-400">
            {attemptsRemaining} {attemptsRemaining === 1 ? "try" : "tries"} left
          </span>
        )}
      </div>

      {showDefinitions ? (
        <div className="space-y-1.5 mb-3">
          {flawTypes.map(([type, info]) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              disabled={isDisabled(type)}
              className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${getButtonStyle(type)}`}
            >
              <span className="font-bold">{info.label}</span>
              <span className="text-[11px] ml-1 opacity-75">{FLAW_DEFINITIONS[type]}</span>
            </button>
          ))}
          <button
            onClick={() => handleSelect("no_flaw")}
            disabled={isDisabled("no_flaw")}
            className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${getButtonStyle("no_flaw")}`}
          >
            <span className="font-bold">No flaw here</span>
            <span className="text-[11px] ml-1 opacity-75">This passage doesn&apos;t contain a problem.</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {flawTypes.map(([type, info]) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              disabled={isDisabled(type)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${getButtonStyle(type)}`}
            >
              {info.label}
            </button>
          ))}
          <button
            onClick={() => handleSelect("no_flaw")}
            disabled={isDisabled("no_flaw")}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${getButtonStyle("no_flaw")}`}
          >
            No flaw here
          </button>
        </div>
      )}

      {/* Feedback: show on wrong attempt (briefly) or when resolved */}
      {showingFeedback && !resolved && selectedType !== correctType && (
        <div className="rounded-lg p-3 bg-amber-50 text-amber-800">
          <p className="font-medium text-xs">Not quite — try again.</p>
        </div>
      )}

      {resolved && (
        <div
          className={`rounded-lg p-3 ${
            selectedType === correctType
              ? "bg-green-50 text-green-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <p className="font-medium text-xs mb-1">
            {selectedType === correctType
              ? "Correct!"
              : correctType === "no_flaw"
                ? "This passage doesn't contain a flaw."
                : `The answer is ${FLAW_TYPES[correctType as FlawType].label}.`}
          </p>
          <p className="text-xs leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
