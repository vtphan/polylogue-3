"use client";

import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

const READING_STRATEGIES: Record<FlawType, string> = {
  reasoning: "Watch for jumps from evidence to conclusion. Ask: does the proof match the claim?",
  epistemic: "Notice when someone sounds very sure. Ask: how do they actually know this?",
  completeness: "After reading, ask: who's missing? What could go wrong?",
  coherence: "Compare what different speakers say. Do they contradict each other?",
};

interface HintCardProps {
  flawType: FlawType | "no_flaw";
  locationLabel: string;
  currentIndex: number;
  totalCount: number;
}

export function HintCard({ flawType, locationLabel, currentIndex, totalCount }: HintCardProps) {
  const isNoFlaw = flawType === "no_flaw";
  const info = isNoFlaw ? null : FLAW_TYPES[flawType];

  return (
    <div className={`border rounded-lg p-4 mb-4 ${isNoFlaw ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {info ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.bgColor} ${info.color}`}>
              {info.label}
            </span>
          ) : (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              Examine
            </span>
          )}
        </div>
        <span className={`text-xs ${isNoFlaw ? "text-gray-400" : "text-blue-500"}`}>
          Hint {currentIndex + 1} of {totalCount}
        </span>
      </div>
      <p className={`text-sm font-medium mb-1 ${isNoFlaw ? "text-gray-800" : "text-blue-900"}`}>
        {isNoFlaw ? "Examine this section carefully" : `Find the ${info!.label.toLowerCase()} flaw`}
      </p>
      <p className={`text-xs mb-2 ${isNoFlaw ? "text-gray-600" : "text-blue-700"}`}>
        Look in <span className="font-medium">{locationLabel}</span>.
      </p>
      {!isNoFlaw && (
        <p className="text-xs text-blue-600 italic">
          {READING_STRATEGIES[flawType]}
        </p>
      )}
    </div>
  );
}

export { READING_STRATEGIES };
