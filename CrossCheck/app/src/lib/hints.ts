/**
 * Hint progression logic for all three stages.
 *
 * Each stage has a different hint mechanic:
 * - Recognize: eliminate wrong flaw type choices (max 2)
 * - Explain: reveal flaw type → show guided template (max 2)
 * - Locate: confirm/deny section → highlight turn → reveal type (max 3)
 */

import type { FlawType, FlawIndexEntry } from "./types";

// --- Recognize hints ---

export interface RecognizeHintResult {
  hintLevel: number;
  eliminatedChoice: FlawType;
}

const ALL_FLAW_TYPES: FlawType[] = ["reasoning", "epistemic", "completeness", "coherence"];

/**
 * Compute the next Recognize hint: which wrong choice to eliminate.
 *
 * @param correctType - The correct flaw type (or null for non-flawed turns)
 * @param currentLevel - Current hint level (0 = no hints used yet)
 * @param previouslyEliminated - Flaw types already eliminated by previous hints
 * @returns The hint result, or null if max hints reached
 */
export function computeRecognizeHint(
  correctType: FlawType | null,
  currentLevel: number,
  previouslyEliminated: FlawType[]
): RecognizeHintResult | null {
  if (currentLevel >= 2) return null; // Max 2 hints

  // For non-flawed turns, all types are wrong — eliminate any not yet eliminated
  // For flawed turns, eliminate wrong types only
  const wrongTypes = ALL_FLAW_TYPES.filter(
    (t) => t !== correctType && !previouslyEliminated.includes(t)
  );

  if (wrongTypes.length === 0) return null;

  // Pick the first available wrong type to eliminate (deterministic)
  const eliminatedChoice = wrongTypes[0];

  return {
    hintLevel: currentLevel + 1,
    eliminatedChoice,
  };
}

// --- Explain hints ---

export interface ExplainHintResult {
  hintLevel: number;
  flawType?: FlawType;
  autoCompleteStep1?: boolean;
  template?: string;
}

/**
 * Compute the next Explain hint.
 *
 * Hint 1: Reveal the correct flaw type (auto-completes Step 1)
 * Hint 2: Show guided template
 */
export function computeExplainHint(
  correctType: FlawType,
  currentLevel: number
): ExplainHintResult | null {
  if (currentLevel >= 2) return null;

  if (currentLevel === 0) {
    return {
      hintLevel: 1,
      flawType: correctType,
      autoCompleteStep1: true,
    };
  }

  if (currentLevel === 1) {
    return {
      hintLevel: 2,
      template: `This is a ${correctType} flaw because ___`,
    };
  }

  return null;
}

// --- Locate hints ---

export interface LocateHintResult {
  hintLevel: number;
  sectionHasFlaw?: boolean;
  section?: string;
  turnId?: string;
  flawType?: string;
  isFreeCheck?: boolean; // Section denial — not counted as a hint
}

/**
 * Compute the next Locate hint based on the student's tapped section.
 *
 * Hint flow per flaw:
 * - Hint 1: Confirm or deny flaw in tapped section. Denial is FREE (not counted).
 * - Hint 2: Highlight the specific turn within confirmed section.
 * - Hint 3: Reveal the flaw type.
 *
 * @param targetSection - The section the student tapped (null for hints 2-3)
 * @param currentLevel - Current hint level for this flaw (0 = no hints yet)
 * @param flaw - The flaw being hinted about
 * @param sectionToTurnMap - Map of section names to turn IDs in that section
 */
export function computeLocateHint(
  targetSection: string | null,
  currentLevel: number,
  flaw: FlawIndexEntry,
  sectionToTurnMap: Map<string, string[]>
): LocateHintResult | null {
  if (currentLevel >= 3) return null;

  if (currentLevel === 0) {
    // Hint 1: Check if the tapped section contains this flaw
    if (!targetSection) return null;

    const turnsInSection = sectionToTurnMap.get(targetSection) || [];
    const sectionHasFlaw = flaw.locations.some((loc) => turnsInSection.includes(loc));

    if (!sectionHasFlaw) {
      // Section denial — FREE, don't advance hint level
      return {
        hintLevel: 0, // stays at 0
        sectionHasFlaw: false,
        section: targetSection,
        isFreeCheck: true,
      };
    }

    return {
      hintLevel: 1,
      sectionHasFlaw: true,
      section: targetSection,
    };
  }

  if (currentLevel === 1) {
    // Hint 2: Reveal the specific turn
    return {
      hintLevel: 2,
      turnId: flaw.locations[0], // primary location
    };
  }

  if (currentLevel === 2) {
    // Hint 3: Reveal the flaw type
    return {
      hintLevel: 3,
      flawType: flaw.flaw_type,
    };
  }

  return null;
}

/**
 * Find the best flaw to hint about in Locate mode.
 *
 * When a student taps a section and requests a hint, find an unresolved flaw
 * that's in or near that section.
 *
 * @param targetSection - The section the student tapped
 * @param unresolvedFlaws - Flaws not yet found by the group
 * @param hintLevels - Current hint level per flaw: Map<flawId, level>
 * @param sectionToTurnMap - Map of section names to turn IDs
 * @returns The flaw to hint about, or null if no match
 */
export function findLocateHintTarget(
  targetSection: string,
  unresolvedFlaws: FlawIndexEntry[],
  hintLevels: Map<string, number>,
  sectionToTurnMap: Map<string, string[]>
): FlawIndexEntry | null {
  const turnsInSection = sectionToTurnMap.get(targetSection) || [];

  // First, try to find an unresolved flaw IN the tapped section
  for (const flaw of unresolvedFlaws) {
    const inSection = flaw.locations.some((loc) => turnsInSection.includes(loc));
    if (inSection) {
      return flaw;
    }
  }

  // No flaw in this section — return null (will produce a free denial)
  return null;
}
