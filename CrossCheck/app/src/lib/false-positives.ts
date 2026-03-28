/**
 * Deterministic false positive generation for Recognize stage.
 *
 * Selects non-flawed turns to include in the turn sequence at a configured ratio.
 * Uses a seeded PRNG so client and server produce identical results for the same inputs.
 */

import type { FlawIndexEntry, TranscriptTurn } from "./types";

/** @deprecated Will be removed in Phase 3. Previously 0.25. */
const FALSE_POSITIVE_RATIO = 0.25;

/**
 * Simple seeded PRNG (mulberry32). Deterministic for the same seed.
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string to a 32-bit integer for use as PRNG seed.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}

/**
 * Get the IDs of all turns that contain flaws.
 */
function getFlawedTurnIds(flawIndex: FlawIndexEntry[]): Set<string> {
  const ids = new Set<string>();
  for (const flaw of flawIndex) {
    for (const loc of flaw.locations) {
      ids.add(loc);
    }
  }
  return ids;
}

/**
 * Select which non-flawed turns to include as false positives in Recognize.
 *
 * @param sessionId - Session ID (part of deterministic seed)
 * @param groupId - Group ID (part of deterministic seed)
 * @param allTurns - All turns in the transcript
 * @param flawIndex - Reference flaw index
 * @param ratio - Ratio of false positives to flawed turns (default: FALSE_POSITIVE_RATIO)
 * @returns Array of turn IDs that are false positives (non-flawed turns to include)
 */
export function selectFalsePositives(
  sessionId: string,
  groupId: string,
  allTurns: TranscriptTurn[],
  flawIndex: FlawIndexEntry[],
  ratio: number = FALSE_POSITIVE_RATIO
): string[] {
  const flawedIds = getFlawedTurnIds(flawIndex);
  const nonFlawedTurns = allTurns.filter((t) => !flawedIds.has(t.id));

  if (nonFlawedTurns.length === 0) return [];

  // How many false positives to include
  const flawedCount = allTurns.length - nonFlawedTurns.length;
  const targetCount = Math.max(1, Math.round(flawedCount * ratio));
  const count = Math.min(targetCount, nonFlawedTurns.length);

  // Deterministic shuffle using seeded PRNG
  const seed = hashString(`${sessionId}:${groupId}`);
  const rng = mulberry32(seed);

  // Fisher-Yates shuffle (partial — only need first `count` elements)
  const indices = nonFlawedTurns.map((_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, count).map((i) => nonFlawedTurns[i].id);
}

/**
 * Check if a turn is a false positive (non-flawed).
 */
export function isFalsePositive(
  turnId: string,
  flawIndex: FlawIndexEntry[]
): boolean {
  const flawedIds = getFlawedTurnIds(flawIndex);
  return !flawedIds.has(turnId);
}
