/**
 * Turn selection for Explain (teach back) and Collaborate (team building) stages.
 *
 * After Recognize completes, splits flawed turns into two mutually exclusive sets:
 * - Explain turns: unanimously correct (all students got the right type)
 * - Collaborate turns: any student was wrong (needs group discussion)
 */

import type { FlawIndexEntry, TranscriptTurn } from "./types";

interface RecognizeResponse {
  flawId: string;
  userId: string;
  typeAnswer: string;
  typeCorrect: boolean;
}

/** Explain (teach back) — students already know the answer, just need to articulate why. */
export interface ExplainTurn extends TranscriptTurn {
  /** The correct flaw type for this turn (from flawIndex) */
  correctFlawType: string;
  /** The flaw_id from the flawIndex */
  flawId: string;
}

/** Collaborate (team building) — some students were wrong, group discusses. */
export interface CollaborateTurn extends TranscriptTurn {
  /** The correct flaw type for this turn (from flawIndex) */
  correctFlawType: string;
  /** The flaw_id from the flawIndex */
  flawId: string;
  /** Distribution of Recognize answers: { [flawType]: studentId[] } */
  recognizeDistribution: Record<string, string[]>;
  /** Whether there was disagreement in Recognize */
  hasDisagreement: boolean;
}

// --- Shared helpers ---

function buildTurnToFlawMap(flawIndex: FlawIndexEntry[]): Map<string, FlawIndexEntry> {
  const map = new Map<string, FlawIndexEntry>();
  for (const flaw of flawIndex) {
    for (const loc of flaw.locations) {
      map.set(loc, flaw);
    }
  }
  return map;
}

function buildFlawResponsesMap(recognizeResponses: RecognizeResponse[]): Map<string, RecognizeResponse[]> {
  const map = new Map<string, RecognizeResponse[]>();
  for (const resp of recognizeResponses) {
    const existing = map.get(resp.flawId) || [];
    existing.push(resp);
    map.set(resp.flawId, existing);
  }
  return map;
}

function buildDistribution(responses: RecognizeResponse[]): Record<string, string[]> {
  const distribution: Record<string, string[]> = {};
  for (const resp of responses) {
    if (!distribution[resp.typeAnswer]) distribution[resp.typeAnswer] = [];
    distribution[resp.typeAnswer].push(resp.userId);
  }
  return distribution;
}

/**
 * Select turns where ALL students were correct — the "teach back" set.
 * Students know the answer; Explain asks them to articulate why.
 */
export function selectExplainTurns(
  allTurns: TranscriptTurn[],
  flawIndex: FlawIndexEntry[],
  recognizeResponses: RecognizeResponse[]
): ExplainTurn[] {
  const turnToFlaw = buildTurnToFlawMap(flawIndex);
  const flawResponses = buildFlawResponsesMap(recognizeResponses);
  const addedFlaws = new Set<string>();
  const result: ExplainTurn[] = [];

  for (const turn of allTurns) {
    const flaw = turnToFlaw.get(turn.id);
    if (!flaw) continue;
    if (addedFlaws.has(flaw.flaw_id)) continue;

    const responses = flawResponses.get(flaw.flaw_id) || [];

    // Include only if there are responses and ALL are correct
    const allCorrect = responses.length > 0 && responses.every((r) => r.typeCorrect);
    if (!allCorrect) continue;

    addedFlaws.add(flaw.flaw_id);

    result.push({
      ...turn,
      correctFlawType: flaw.flaw_type,
      flawId: flaw.flaw_id,
    });
  }

  return result;
}

/**
 * Select turns where ANY student was wrong — the "team building" set.
 * Group discusses and selects the correct type together.
 */
export function selectCollaborateTurns(
  allTurns: TranscriptTurn[],
  flawIndex: FlawIndexEntry[],
  recognizeResponses: RecognizeResponse[]
): CollaborateTurn[] {
  const turnToFlaw = buildTurnToFlawMap(flawIndex);
  const flawResponses = buildFlawResponsesMap(recognizeResponses);
  const addedFlaws = new Set<string>();
  const result: CollaborateTurn[] = [];

  for (const turn of allTurns) {
    const flaw = turnToFlaw.get(turn.id);
    if (!flaw) continue;
    if (addedFlaws.has(flaw.flaw_id)) continue;

    const responses = flawResponses.get(flaw.flaw_id) || [];

    // Include if no responses or any student was wrong
    const anyWrong = responses.length === 0 || responses.some((r) => !r.typeCorrect);
    if (!anyWrong) continue;

    const distribution = buildDistribution(responses);
    const hasDisagreement = Object.keys(distribution).length > 1;

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
