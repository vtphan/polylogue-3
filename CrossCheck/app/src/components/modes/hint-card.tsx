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
  flawType: FlawType;
  locationLabel: string;
  currentIndex: number;
  totalCount: number;
}

export function HintCard({ flawType, locationLabel, currentIndex, totalCount }: HintCardProps) {
  const info = FLAW_TYPES[flawType];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.bgColor} ${info.color}`}>
            {info.label}
          </span>
        </div>
        <span className="text-xs text-blue-500">
          Hint {currentIndex + 1} of {totalCount}
        </span>
      </div>
      <p className="text-sm font-medium text-blue-900 mb-1">
        Find the {info.label.toLowerCase()} flaw
      </p>
      <p className="text-xs text-blue-700 mb-2">
        Look in <span className="font-medium">{locationLabel}</span>.
      </p>
      <p className="text-xs text-blue-600 italic">
        {READING_STRATEGIES[flawType]}
      </p>
    </div>
  );
}

export { READING_STRATEGIES };
