/**
 * Coin computation — pure functions that determine coin awards per action.
 */

import { COIN_VALUES } from "./types";

/** Recognize: coins for selecting a flaw type. */
export function computeRecognizeCoins(correct: boolean, hintCount: number): number {
  if (!correct) return COIN_VALUES.recognize_wrong;
  return hintCount === 0
    ? COIN_VALUES.recognize_correct_independent
    : COIN_VALUES.recognize_correct;
}

/** Explain (teach back): coins for writing an explanation or completing the stage. */
export function computeExplainCoins(action: "submission" | "stage_complete"): number {
  return action === "submission"
    ? COIN_VALUES.explain_submission
    : COIN_VALUES.explain_stage_complete;
}

/** Collaborate: coins for group type selection or explanation submission. */
export function computeCollaborateCoins(
  action: "correct_selection" | "submission",
  hintCount: number
): number {
  if (action === "submission") return COIN_VALUES.collaborate_submission;
  return hintCount === 0
    ? COIN_VALUES.collaborate_correct_independent
    : COIN_VALUES.collaborate_correct;
}

/** Locate: coins for finding a flaw, scaled by hint usage. */
export function computeLocateCoins(hintCount: number): number {
  if (hintCount === 0) return COIN_VALUES.locate_independent;
  if (hintCount === 1) return COIN_VALUES.locate_one_hint;
  return COIN_VALUES.locate_multiple_hints;
}
