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

interface ResponseCardProps {
  flawId: string;
  correctType: FlawType;
  explanation: string;
  groupId: string;
  userId: string;
  onResponse?: (flawId: string, typeAnswer: FlawType, typeCorrect: boolean) => void;
  /** If true, renders as a standalone card (for unmatched/cross-section flaws). Otherwise renders minimal for popup use. */
  standalone?: boolean;
  /** If true, show flaw type definitions alongside each button (for Recognize mode scaffolding). */
  showDefinitions?: boolean;
}

export function ResponseCard({
  flawId,
  correctType,
  explanation,
  groupId,
  userId,
  onResponse,
  standalone,
  showDefinitions,
}: ResponseCardProps) {
  const [selectedType, setSelectedType] = useState<FlawType | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const flawTypes = Object.entries(FLAW_TYPES) as [FlawType, typeof FLAW_TYPES[FlawType]][];

  async function handleSelect(type: FlawType) {
    if (submitted) return;
    setSelectedType(type);
    setSubmitted(true);

    const isCorrect = type === correctType;

    // Save response to API (server computes typeCorrect)
    try {
      await fetch("/api/flaw-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          flawId,
          typeAnswer: type,
        }),
      });
    } catch {
      // Silently fail — response is saved locally in state
    }

    onResponse?.(flawId, type, isCorrect);
  }

  const wrapperClass = standalone
    ? "bg-white border border-gray-200 rounded-lg p-4 my-3 shadow-sm"
    : "";

  return (
    <div className={wrapperClass}>
      <p className="text-xs font-medium text-gray-500 mb-2">What type of problem is this?</p>
      {showDefinitions ? (
        /* Scaffolded layout: each flaw type as a labeled card with definition */
        <div className="space-y-1.5 mb-3">
          {flawTypes.map(([type, info]) => {
            let style: string;
            if (submitted) {
              if (type === correctType) {
                style = "border-green-500 bg-green-50 ring-2 ring-green-300";
              } else if (type === selectedType) {
                style = "border-red-400 bg-red-50";
              } else {
                style = "border-gray-200 bg-gray-50 opacity-50";
              }
            } else {
              const colors = BUTTON_COLORS[type];
              style = `${colors.base} ${colors.hover}`;
            }

            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={submitted}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${style}`}
              >
                <span className="font-bold">{info.label}</span>
                <span className="text-[11px] ml-1 opacity-75">{FLAW_DEFINITIONS[type]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Compact layout: color-coded pills */
        <div className="flex flex-wrap gap-2 mb-3">
          {flawTypes.map(([type, info]) => {
            let style: string;
            if (submitted) {
              if (type === correctType) {
                style = "border-green-500 bg-green-50 text-green-800 ring-2 ring-green-300";
              } else if (type === selectedType) {
                style = "border-red-400 bg-red-50 text-red-700";
              } else {
                style = "border-gray-200 text-gray-300";
              }
            } else {
              const colors = BUTTON_COLORS[type];
              style = `${colors.base} ${colors.hover}`;
            }

            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={submitted}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${style}`}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      )}

      {submitted && (
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
              : `This is a ${FLAW_TYPES[correctType].label} flaw.`}
          </p>
          <p className="text-xs leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
