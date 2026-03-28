/**
 * Locate stage trigger logic.
 *
 * After Collaborate completes, determines whether the Locate stage should activate
 * and which flaws are its targets.
 */

import type { FlawIndexEntry } from "./types";

interface RecognizeResponse {
  flawId: string;
  userId: string;
  typeCorrect: boolean;
}

interface CollaborateGroupSelection {
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
 * 2. The group did not select the correct type in Collaborate
 *
 * Explain (teach back) doesn't affect Locate targeting — it has no type selection step.
 *
 * @param flawIndex - Reference flaw index
 * @param recognizeResponses - All students' Recognize responses
 * @param collaborateGroupSelections - Group's type selections in Collaborate
 * @returns Array of LocateTargets. Empty array means Locate should be skipped.
 */
export function getLocateTargets(
  flawIndex: FlawIndexEntry[],
  recognizeResponses: RecognizeResponse[],
  collaborateGroupSelections: CollaborateGroupSelection[]
): LocateTarget[] {
  const targets: LocateTarget[] = [];

  // Build maps for quick lookup
  const recognizeByFlaw = new Map<string, RecognizeResponse[]>();
  for (const resp of recognizeResponses) {
    const existing = recognizeByFlaw.get(resp.flawId) || [];
    existing.push(resp);
    recognizeByFlaw.set(resp.flawId, existing);
  }

  const collaborateByFlaw = new Map<string, CollaborateGroupSelection>();
  for (const sel of collaborateGroupSelections) {
    collaborateByFlaw.set(sel.flawId, sel);
  }

  for (const flaw of flawIndex) {
    // Check 1: Did any student get it right in Recognize?
    const flawRecognizeResponses = recognizeByFlaw.get(flaw.flaw_id) || [];
    const anyCorrectInRecognize = flawRecognizeResponses.some((r) => r.typeCorrect);

    if (anyCorrectInRecognize) continue; // Caught in Recognize — not a Locate target

    // Check 2: Did the group get it right in Collaborate?
    const collaborateSelection = collaborateByFlaw.get(flaw.flaw_id);
    if (collaborateSelection && collaborateSelection.typeAnswer === flaw.flaw_type) {
      continue; // Corrected in Collaborate — not a Locate target
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
  collaborateGroupSelections: CollaborateGroupSelection[]
): boolean {
  return getLocateTargets(flawIndex, recognizeResponses, collaborateGroupSelections).length > 0;
}
