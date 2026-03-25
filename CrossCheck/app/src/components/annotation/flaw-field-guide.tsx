"use client";

import { useState } from "react";
import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

const READING_STRATEGIES: Record<FlawType, string> = {
  reasoning: "Watch for jumps from evidence to conclusion. Ask: does the proof match the claim?",
  epistemic: "Notice when someone sounds very sure. Ask: how do they actually know this?",
  completeness: "After reading, ask: who's missing? What could go wrong?",
  coherence: "Compare what different speakers say. Do they contradict each other?",
};

const QUICK_EXAMPLES: Record<FlawType, string> = {
  reasoning: "\"Everyone recycles, so it must be the best solution.\" — Jumps from a small example to a big conclusion.",
  epistemic: "\"Scientists proved chocolate makes you smarter.\" — Overstates what the evidence actually shows.",
  completeness: "\"Plant 100 trees — problem solved!\" — Ignores costs, timeline, and whether it's enough.",
  coherence: "Speaker A says solar, Speaker B says wind, and nobody addresses the conflict.",
};

interface FlawFieldGuideProps {
  /** If true, only show definitions (no reading strategies or examples). Used in Spot mode where type info may be extraneous. */
  compact?: boolean;
}

function GuideContent({ compact }: FlawFieldGuideProps) {
  const [expandedType, setExpandedType] = useState<FlawType | null>(null);

  return (
    <div className="space-y-2">
      {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
        const info = FLAW_TYPES[type];
        const isExpanded = expandedType === type;

        return (
          <div key={type} className="rounded-lg border border-gray-100">
            <button
              onClick={() => setExpandedType(isExpanded ? null : type)}
              className="w-full text-left p-2.5 flex items-start gap-2"
            >
              <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${info.bgColor} ${info.color}`}>
                {info.label}
              </span>
              <span className="text-xs text-gray-600 leading-snug flex-1">
                {info.description}
              </span>
              {!compact && (
                <span className="shrink-0 text-xs text-gray-400 mt-0.5">
                  {isExpanded ? "\u25B2" : "\u25BC"}
                </span>
              )}
            </button>

            {!compact && isExpanded && (
              <div className="px-2.5 pb-2.5 space-y-2">
                <div className="bg-blue-50 rounded p-2">
                  <p className="text-xs font-medium text-blue-700 mb-0.5">What to look for</p>
                  <p className="text-xs text-blue-600">{READING_STRATEGIES[type]}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">Example</p>
                  <p className="text-xs text-gray-600 italic">{QUICK_EXAMPLES[type]}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Desktop sidebar version: collapsible panel */
export function FlawFieldGuide({ compact }: FlawFieldGuideProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-1"
      >
        <h3 className="font-semibold text-gray-900 text-xs">Flaw Type Guide</h3>
        <span className="text-xs text-gray-400">{collapsed ? "\u25BC" : "\u25B2"}</span>
      </button>
      {!collapsed && <GuideContent compact={compact} />}
    </div>
  );
}

/** Mobile floating button + slide-up drawer */
export function FlawFieldGuideDrawer({ compact }: FlawFieldGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button — positioned above the bottom bar */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 right-4 z-30 bg-white border border-gray-300 shadow-lg rounded-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 lg:hidden"
      >
        Guide
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-semibold text-gray-900 text-sm">Flaw Type Guide</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <GuideContent compact={compact} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
