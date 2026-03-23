"use client";

import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";

interface Flaw {
  flaw_id: string;
  flaw_type: string;
  source: string;
  severity: string;
  description: string;
  evidence: string;
  explanation: string;
  location: {
    type: string;
    references: string[];
  };
}

interface Evaluation {
  flaws: Flaw[];
  summary: {
    total_flaws: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    by_source: Record<string, number>;
    key_patterns: string;
  };
}

interface EvaluationPanelProps {
  evaluation: Evaluation;
  compact?: boolean; // smaller text for embedding in dashboard
}

export function EvaluationPanel({ evaluation, compact = false }: EvaluationPanelProps) {
  if (!evaluation?.flaws) {
    return <p className="text-gray-500 text-sm">No evaluation data available.</p>;
  }

  const { flaws, summary } = evaluation;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`bg-white rounded-lg border border-gray-200 ${compact ? "p-3" : "p-5"}`}>
        <h3 className={`font-semibold text-gray-900 ${compact ? "text-sm mb-2" : "mb-3"}`}>
          Reference Evaluation — {summary.total_flaws} flaws
        </h3>

        {/* Type + severity distribution */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
            const count = summary.by_type?.[type] || 0;
            if (count === 0) return null;
            return (
              <span key={type} className={`text-xs px-2 py-0.5 rounded ${FLAW_TYPES[type].bgColor} ${FLAW_TYPES[type].color}`}>
                {FLAW_TYPES[type].label}: {count}
              </span>
            );
          })}
          <span className="text-xs text-gray-400 ml-1">
            {summary.by_severity?.major || 0} major, {summary.by_severity?.moderate || 0} moderate, {summary.by_severity?.minor || 0} minor
          </span>
        </div>

        {/* Key patterns */}
        {summary.key_patterns && (
          <p className={`text-gray-600 whitespace-pre-wrap ${compact ? "text-xs" : "text-sm"}`}>
            {summary.key_patterns}
          </p>
        )}
      </div>

      {/* Flaw list */}
      <div className="space-y-3">
        {flaws.map((flaw) => {
          const flawInfo = FLAW_TYPES[flaw.flaw_type as FlawType];
          return (
            <div key={flaw.flaw_id} className={`bg-white rounded-lg border border-gray-200 ${compact ? "p-3" : "p-4"}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${flawInfo?.bgColor || "bg-gray-100"} ${flawInfo?.color || ""}`}>
                  {flawInfo?.label || flaw.flaw_type}
                </span>
                <span className="text-xs text-gray-400 capitalize">{flaw.severity}</span>
                <span className="text-xs text-gray-400">{flaw.source}</span>
                <span className="text-xs text-gray-400 font-mono">
                  {flaw.location.references.join(", ")}
                </span>
              </div>
              <p className={`font-medium text-gray-800 mb-1 ${compact ? "text-xs" : "text-sm"}`}>
                {flaw.description}
              </p>
              <p className={`text-gray-500 mb-1.5 ${compact ? "text-xs" : "text-xs"}`}>
                &ldquo;{flaw.evidence}&rdquo;
              </p>
              <p className={`text-gray-600 leading-relaxed ${compact ? "text-xs" : "text-xs"}`}>
                {flaw.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
