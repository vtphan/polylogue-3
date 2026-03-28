"use client";

import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface RecognizeDistributionProps {
  /** Distribution: { [flawType]: studentDisplayName[] } */
  distribution: Record<string, string[]>;
  /** Whether there's disagreement (more than one type selected) */
  hasDisagreement: boolean;
}

export function RecognizeDistribution({ distribution, hasDisagreement }: RecognizeDistributionProps) {
  const entries = Object.entries(distribution);

  if (entries.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic">No Recognize data available</div>
    );
  }

  return (
    <div className={`rounded-lg p-3 text-sm ${hasDisagreement ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}>
      <p className="text-xs font-medium text-gray-500 mb-2">
        {hasDisagreement ? "Your group disagreed on this turn:" : "Your group's Recognize results:"}
      </p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([type, names]) => {
          const flawInfo = FLAW_TYPES[type as FlawType];
          if (!flawInfo) return null;

          return (
            <div
              key={type}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${flawInfo.bgColor} ${flawInfo.color}`}
            >
              <span className="font-bold">{flawInfo.abbrev}</span>
              <span>{flawInfo.label}</span>
              <span className="opacity-60">({names.length})</span>
            </div>
          );
        })}
      </div>
      {hasDisagreement && (
        <p className="text-xs text-amber-700 mt-2 italic">
          Discuss before selecting — what do you each see in this passage?
        </p>
      )}
    </div>
  );
}
