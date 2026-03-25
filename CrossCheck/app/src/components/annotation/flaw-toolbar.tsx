"use client";

import type { FlawType, Annotation, DifficultyMode } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface FlawBottomBarProps {
  hasSelection: boolean;
  annotations: Annotation[];
  onSelect: (flawType: FlawType) => void;
  onUndo: () => void;
  readOnly?: boolean;
  difficultyMode?: DifficultyMode;
}

const FLAW_BUTTON_COLORS: Record<FlawType, string> = {
  reasoning: "bg-red-500 hover:bg-red-600 ring-red-300",
  epistemic: "bg-amber-500 hover:bg-amber-600 ring-amber-300",
  completeness: "bg-blue-500 hover:bg-blue-600 ring-blue-300",
  coherence: "bg-purple-500 hover:bg-purple-600 ring-purple-300",
};

const FLAW_INACTIVE_COLORS: Record<FlawType, string> = {
  reasoning: "bg-red-200 text-red-400",
  epistemic: "bg-amber-200 text-amber-400",
  completeness: "bg-blue-200 text-blue-400",
  coherence: "bg-purple-200 text-purple-400",
};

export function FlawBottomBar({
  hasSelection,
  annotations,
  onSelect,
  onUndo,
  readOnly,
  difficultyMode = "classify",
}: FlawBottomBarProps) {
  if (readOnly) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
        {(difficultyMode === "spot" || difficultyMode === "locate") ? (
          /* Spot/Locate mode: single "Flag" button — uses "reasoning" as placeholder type */
          <button
            onClick={() => onSelect("reasoning")}
            disabled={!hasSelection}
            className={`text-sm font-medium px-6 py-2 rounded-lg transition-all ${
              hasSelection
                ? "bg-gray-800 text-white shadow-sm hover:bg-gray-900"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Flag This
          </button>
        ) : (
          /* Classify and Full modes: 4 flaw type buttons */
          (Object.keys(FLAW_TYPES) as FlawType[]).map((type) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              disabled={!hasSelection}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                hasSelection
                  ? `${FLAW_BUTTON_COLORS[type]} text-white shadow-sm hover:ring-2`
                  : `${FLAW_INACTIVE_COLORS[type]} cursor-not-allowed`
              }`}
              title={FLAW_TYPES[type].description}
            >
              {FLAW_TYPES[type].label}
            </button>
          ))
        )}

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={onUndo}
          disabled={annotations.length === 0}
          className={`text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
            annotations.length > 0
              ? "border-gray-300 text-gray-700 hover:bg-gray-50"
              : "border-gray-200 text-gray-300 cursor-not-allowed"
          }`}
          title="Remove last annotation"
        >
          Undo
        </button>

        <span className="text-xs text-gray-400 ml-1">
          {annotations.length}
        </span>
      </div>
    </div>
  );
}
