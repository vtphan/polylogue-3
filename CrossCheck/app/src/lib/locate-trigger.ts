/**
 * Locate stage trigger logic.
 *
 * After Explain completes, determines whether the Locate stage should activate
 * and which flaws are its targets.
 */

import type { FlawIndexEntry } from "./types";

interface RecognizeResponse {
  flawId: string;
  userId: string;
  typeCorrect: boolean;
}

interface ExplainGroupSelection {
  flawId: string;
  typeAnswer: string;
}

export interface LocateTarget {
  flawId: string;
  flawType: string;
  locations: string[];
  severity: string;
}

/**
 * Determine which flaws were missed and should become Locate targets.
 *
 * A flaw is "missed" if:
 * 1. No student selected the correct type in Recognize, AND
 * 2. The group did not select the correct type in Explain
 *
 * @param flawIndex - Reference flaw index
 * @param recognizeResponses - All students' Recognize responses
 * @param explainGroupSelections - Group's Step 1 selections in Explain (may be empty for flaws not shown in Explain)
 * @returns Array of LocateTargets. Empty array means Locate should be skipped.
 */
export function getLocateTargets(
  flawIndex: FlawIndexEntry[],
  recognizeResponses: RecognizeResponse[],
  explainGroupSelections: ExplainGroupSelection[]
): LocateTarget[] {
  const targets: LocateTarget[] = [];

  // Build maps for quick lookup
  const recognizeByFlaw = new Map<string, RecognizeResponse[]>();
  for (const resp of recognizeResponses) {
    const existing = recognizeByFlaw.get(resp.flawId) || [];
    existing.push(resp);
    recognizeByFlaw.set(resp.flawId, existing);
  }

  const explainByFlaw = new Map<string, ExplainGroupSelection>();
  for (const sel of explainGroupSelections) {
    explainByFlaw.set(sel.flawId, sel);
  }

  for (const flaw of flawIndex) {
    // Check 1: Did any student get it right in Recognize?
    const flawRecognizeResponses = recognizeByFlaw.get(flaw.flaw_id) || [];
    const anyCorrectInRecognize = flawRecognizeResponses.some((r) => r.typeCorrect);

    if (anyCorrectInRecognize) continue; // Caught in Recognize — not a Locate target

    // Check 2: Did the group get it right in Explain?
    const explainSelection = explainByFlaw.get(flaw.flaw_id);
    if (explainSelection && explainSelection.typeAnswer === flaw.flaw_type) {
      continue; // Corrected in Explain — not a Locate target
    }

    // Missed — this is a Locate target
    targets.push({
      flawId: flaw.flaw_id,
      flawType: flaw.flaw_type,
      locations: flaw.locations,
      severity: flaw.severity,
    });
  }

  return targets;
}

/**
 * Check if Locate stage should be triggered.
 */
export function shouldTriggerLocate(
  flawIndex: FlawIndexEntry[],
  recognizeResponses: RecognizeResponse[],
  explainGroupSelections: ExplainGroupSelection[]
): boolean {
  return getLocateTargets(flawIndex, recognizeResponses, explainGroupSelections).length > 0;
}
