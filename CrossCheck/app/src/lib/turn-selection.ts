/**
 * Explain stage turn selection.
 *
 * After Recognize completes, determines which turns the group should discuss
 * in Explain. Includes turns where any student was wrong — without revealing
 * which errors triggered inclusion.
 */

import type { FlawIndexEntry, TranscriptTurn } from "./types";

interface RecognizeResponse {
  flawId: string;
  userId: string;
  typeAnswer: string;
  typeCorrect: boolean;
}

export interface ExplainTurn extends TranscriptTurn {
  /** The correct flaw type for this turn (from flawIndex) */
  correctFlawType: string;
  /** The flaw_id from the flawIndex */
  flawId: string;
  /** Distribution of Recognize answers: { [flawType]: studentId[] } */
  recognizeDistribution: Record<string, string[]>;
  /** Whether there was disagreement in Recognize */
  hasDisagreement: boolean;
}

/**
 * Select which turns should appear in the Explain stage.
 *
 * Rules:
 * 1. Only flawed turns are candidates (non-flawed turns were handled by productive failure)
 * 2. A flawed turn is included if ANY student selected the wrong flaw type
 * 3. A flawed turn is skipped if ALL students selected the correct type
 * 4. Returns turns in transcript order
 *
 * @param allTurns - All turns in the transcript
 * @param flawIndex - Reference flaw index
 * @param recognizeResponses - All students' Recognize responses
 * @returns Array of ExplainTurns to present in Explain stage
 */
export function selectExplainTurns(
  allTurns: TranscriptTurn[],
  flawIndex: FlawIndexEntry[],
  recognizeResponses: RecognizeResponse[]
): ExplainTurn[] {
  const result: ExplainTurn[] = [];

  // Build a map: turnId → flawIndexEntry (for flawed turns)
  const turnToFlaw = new Map<string, FlawIndexEntry>();
  for (const flaw of flawIndex) {
    for (const loc of flaw.locations) {
      turnToFlaw.set(loc, flaw);
    }
  }

  // Build a map: flawId → responses
  const flawResponses = new Map<string, RecognizeResponse[]>();
  for (const resp of recognizeResponses) {
    const existing = flawResponses.get(resp.flawId) || [];
    existing.push(resp);
    flawResponses.set(resp.flawId, existing);
  }

  const addedFlaws = new Set<string>();

  for (const turn of allTurns) {
    const flaw = turnToFlaw.get(turn.id);
    if (!flaw) continue; // Skip non-flawed turns
    if (addedFlaws.has(flaw.flaw_id)) continue; // Skip duplicate locations for same flaw

    const responses = flawResponses.get(flaw.flaw_id) || [];

    // Check if any student was wrong
    const anyWrong = responses.length === 0 || responses.some((r) => !r.typeCorrect);

    if (!anyWrong) continue; // All students correct — skip

    // Build distribution: { flawType: [studentIds] }
    const distribution: Record<string, string[]> = {};
    for (const resp of responses) {
      const type = resp.typeAnswer;
      if (!distribution[type]) distribution[type] = [];
      distribution[type].push(resp.userId);
    }

    // Check for disagreement (more than one type selected)
    const selectedTypes = Object.keys(distribution);
    const hasDisagreement = selectedTypes.length > 1;

    addedFlaws.add(flaw.flaw_id);

    result.push({
      ...turn,
      correctFlawType: flaw.flaw_type,
      flawId: flaw.flaw_id,
      recognizeDistribution: distribution,
      hasDisagreement,
    });
  }

  return result;
}
