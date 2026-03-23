"use client";

import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface FlawToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onSelect: (flawType: FlawType) => void;
  onDismiss: () => void;
}

const FLAW_BUTTON_COLORS: Record<FlawType, string> = {
  reasoning: "bg-red-500 hover:bg-red-600",
  epistemic: "bg-amber-500 hover:bg-amber-600",
  completeness: "bg-blue-500 hover:bg-blue-600",
  coherence: "bg-purple-500 hover:bg-purple-600",
};

export function FlawToolbar({ visible, position, onSelect, onDismiss }: FlawToolbarProps) {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop to dismiss */}
      <div className="fixed inset-0 z-40" onClick={onDismiss} />

      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex gap-1.5"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translateX(-50%) translateY(-100%)",
          marginTop: "-8px",
        }}
      >
        {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`${FLAW_BUTTON_COLORS[type]} text-white text-xs font-medium px-3 py-1.5 rounded transition-colors`}
            title={FLAW_TYPES[type].description}
          >
            {FLAW_TYPES[type].label}
          </button>
        ))}
      </div>
    </>
  );
}
