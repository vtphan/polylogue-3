"use client";

import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";
import type { Evaluation, EvaluationFlaw } from "./flaw-annotations";

interface OverviewTabProps {
  evaluation: Evaluation | null;
  onFlawClick: (flawId: string) => void;
}

export function OverviewTab({ evaluation, onFlawClick }: OverviewTabProps) {
  if (!evaluation?.flaws || !evaluation?.summary) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-sm text-gray-500">Evaluation pending — check back shortly.</p>
      </div>
    );
  }

  const { flaws, summary } = evaluation;
  const maxCount = Math.max(...Object.values(summary.by_type), 1);

  return (
    <div className="space-y-6">
      {/* Flaw Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          Flaw Distribution &middot; {summary.total_flaws} total
        </h3>

        <div className="space-y-3 mb-4">
          {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
            const count = summary.by_type?.[type] || 0;
            const info = FLAW_TYPES[type];
            const pct = (count / maxCount) * 100;
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-28 shrink-0">{info.label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${info.bgColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-gray-500">
          {summary.by_severity?.major || 0} major &middot;{" "}
          {summary.by_severity?.moderate || 0} moderate &middot;{" "}
          {summary.by_severity?.minor || 0} minor
        </p>
      </div>

      {/* Key Patterns */}
      {summary.key_patterns && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Key Patterns</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {summary.key_patterns}
          </p>
        </div>
      )}

      {/* Flaw List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">All Flaws</h3>
        <div className="space-y-2">
          {flaws.map((flaw) => (
            <FlawCard key={flaw.flaw_id} flaw={flaw} onClick={() => onFlawClick(flaw.flaw_id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FlawCard({ flaw, onClick }: { flaw: EvaluationFlaw; onClick: () => void }) {
  const info = FLAW_TYPES[flaw.flaw_type as FlawType];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${info?.bgColor || "bg-gray-100"} ${info?.color || ""}`}>
          {info?.abbrev || flaw.flaw_type}
        </span>
        <span className="text-xs text-gray-400 capitalize">{flaw.severity}</span>
        <span className="text-xs text-gray-400">{flaw.source.replace("_", "-")}</span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-2">{flaw.description}</p>
    </button>
  );
}
