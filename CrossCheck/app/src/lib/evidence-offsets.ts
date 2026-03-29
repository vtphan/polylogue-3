/**
 * Shared utility for mapping evaluation evidence strings to character offsets
 * within turn/section content. Used by both teacher views and student stages.
 */

/**
 * Find the start/end offsets of an evidence string within content.
 * Returns null if evidence cannot be located.
 */
export function findEvidenceOffsets(
  evidence: string,
  content: string
): { start: number; end: number } | null {
  if (!evidence || !content) return null;

  // Try exact match first
  const idx = content.indexOf(evidence);
  if (idx !== -1) {
    return { start: idx, end: idx + evidence.length };
  }

  // Fallback: normalize whitespace and retry.
  // Build a mapping from each normalized-string position back to the
  // original-string position so offsets translate accurately.
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
  const normEvidence = normalize(evidence);

  // Build normalized content + position map in one pass
  const normChars: string[] = [];
  const origPositions: number[] = []; // origPositions[normIdx] = content index
  let prevWasSpace = false;
  const trimStart = content.search(/\S/);
  if (trimStart === -1) return null;

  for (let i = trimStart; i < content.length; i++) {
    const isSpace = /\s/.test(content[i]);
    if (isSpace) {
      if (!prevWasSpace) {
        normChars.push(" ");
        origPositions.push(i);
      }
      prevWasSpace = true;
    } else {
      normChars.push(content[i]);
      origPositions.push(i);
      prevWasSpace = false;
    }
  }
  // Trim trailing space
  if (normChars.length > 0 && normChars[normChars.length - 1] === " ") {
    normChars.pop();
    origPositions.pop();
  }

  const normContent = normChars.join("");
  const normIdx = normContent.indexOf(normEvidence);
  if (normIdx === -1) return null;

  const origStart = origPositions[normIdx];
  // End: position after the last matched char in original
  const lastNormIdx = normIdx + normEvidence.length - 1;
  const lastOrigPos = origPositions[lastNormIdx];
  // Extend past any trailing whitespace that was collapsed
  const origEnd = lastOrigPos + 1;

  return { start: origStart, end: origEnd };
}
