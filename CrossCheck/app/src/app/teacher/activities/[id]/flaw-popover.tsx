"use client";

import { useEffect, useRef } from "react";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";
import type { EvaluationFlaw } from "./flaw-annotations";

interface FlawPopoverProps {
  flaw: EvaluationFlaw;
  anchorRect: DOMRect;
  onClose: () => void;
  onNavigate?: (ref: string) => void;
}

export function FlawPopover({ flaw, anchorRect, onClose, onNavigate }: FlawPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const info = FLAW_TYPES[flaw.flaw_type as FlawType];

  // Position the popover
  const style = computePosition(anchorRect);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Delay adding the click listener so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    document.addEventListener("keydown", handleKey);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      style={style}
      className="fixed z-50 w-80 bg-white rounded-lg border border-gray-200 shadow-lg"
    >
      {/* Arrow indicator */}
      <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />

      <div className="p-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pr-6">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${info?.bgColor || "bg-gray-100"} ${info?.color || ""}`}>
            {info?.label || flaw.flaw_type}
          </span>
          <span className="text-xs text-gray-400 capitalize">{flaw.severity}</span>
          <span className="text-xs text-gray-400">{flaw.source.replace("_", "-")}</span>
        </div>

        {/* Description */}
        <p className="text-sm font-medium text-gray-800 mb-2">{flaw.description}</p>

        {/* Evidence */}
        <p className="text-xs text-gray-500 italic mb-2">
          &ldquo;{flaw.evidence}&rdquo;
        </p>

        {/* Explanation */}
        <p className="text-xs text-gray-600 leading-relaxed">{flaw.explanation}</p>

        {/* Cross-section links */}
        {flaw.location.references.length > 1 && onNavigate && (
          <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
            <span className="text-xs text-gray-400">Also in:</span>
            {flaw.location.references.map((ref) => (
              <button
                key={ref}
                onClick={() => {
                  onClose();
                  onNavigate(ref);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {ref}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function computePosition(anchorRect: DOMRect): React.CSSProperties {
  const popoverWidth = 320;
  const popoverEstimatedHeight = 250;
  const margin = 8;

  let top = anchorRect.bottom + margin;
  let left = anchorRect.left;

  // Flip above if not enough space below
  if (top + popoverEstimatedHeight > window.innerHeight) {
    top = anchorRect.top - popoverEstimatedHeight - margin;
  }

  // Constrain to viewport horizontally
  if (left + popoverWidth > window.innerWidth - margin) {
    left = window.innerWidth - popoverWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }

  return { top, left };
}
