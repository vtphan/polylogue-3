"use client";

import { useState } from "react";
import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface ResponseCardProps {
  flawId: string;
  correctType: FlawType;
  explanation: string;
  groupId: string;
  userId: string;
  onResponse?: (flawId: string, typeAnswer: FlawType, typeCorrect: boolean) => void;
}

export function ResponseCard({
  flawId,
  correctType,
  explanation,
  groupId,
  userId,
  onResponse,
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 my-3 shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-2">What type of problem is this?</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {flawTypes.map(([type, info]) => {
          let style = "border-gray-200 text-gray-700 hover:border-gray-400";
          if (submitted) {
            if (type === correctType) {
              style = "border-green-500 bg-green-50 text-green-800 ring-1 ring-green-300";
            } else if (type === selectedType) {
              style = "border-red-400 bg-red-50 text-red-700";
            } else {
              style = "border-gray-200 text-gray-400";
            }
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

      {submitted && (
        <div
          className={`text-sm rounded-lg p-3 ${
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
