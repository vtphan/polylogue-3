import type { FlawType, Annotation, PresentationSection, DiscussionTurn } from "@/lib/types";

// --- Type definitions for evaluation data ---

export interface EvaluationFlaw {
  flaw_id: string;
  flaw_type: string;
  source: string;
  severity: string;
  description: string;
  evidence: string;
  explanation: string;
  location: { type: string; references: string[] };
}

export interface Evaluation {
  flaws: EvaluationFlaw[];
  summary: {
    total_flaws: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    by_source: Record<string, number>;
    key_patterns: string;
  };
}

export interface AgentProfile {
  name: string;
  agent_id: string;
  description: string;
  disposition: {
    confidence: string;
    engagement_style: string;
    expressiveness: string;
    reactive_tendency: string;
  };
  expected_flaws: {
    flaw: string;
    flaw_type: string;
    mechanism: string;
  }[];
}

// --- Evidence-to-offset matching ---

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
  let origEnd = lastOrigPos + 1;
  while (origEnd < content.length && /\s/.test(content[origEnd]) && origEnd <= lastOrigPos + 1) {
    break; // don't extend past the char boundary
  }

  return { start: origStart, end: origEnd };
}

// --- Build Annotation[] from evaluation flaws ---

interface TranscriptItem {
  id: string;
  content: string;
  speaker: string;
}

function getTranscriptItems(
  transcript: { sections?: PresentationSection[]; turns?: DiscussionTurn[] }
): TranscriptItem[] {
  if (transcript.sections) {
    return transcript.sections.map((s) => ({
      id: s.section_id,
      content: s.content,
      speaker: s.speaker,
    }));
  }
  if (transcript.turns) {
    return transcript.turns.map((t) => ({
      id: t.turn_id,
      content: t.content,
      speaker: t.speaker,
    }));
  }
  return [];
}

/**
 * Convert evaluation flaws into Annotation objects that the existing
 * AnnotatableText/PresentationView/DiscussionView pipeline can render.
 */
export function buildFlawAnnotations(
  flaws: EvaluationFlaw[],
  transcript: { sections?: PresentationSection[]; turns?: DiscussionTurn[] }
): Annotation[] {
  const items = getTranscriptItems(transcript);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const annotations: Annotation[] = [];

  for (const flaw of flaws) {
    for (const ref of flaw.location.references) {
      const item = itemMap.get(ref);
      if (!item) continue;

      const offsets = findEvidenceOffsets(flaw.evidence, item.content);
      if (!offsets) continue;

      annotations.push({
        id: flaw.location.references.length > 1
          ? `${flaw.flaw_id}:${ref}`
          : flaw.flaw_id,
        location: {
          item_id: ref,
          start_offset: offsets.start,
          end_offset: offsets.end,
          highlighted_text: item.content.slice(offsets.start, offsets.end),
        },
        flawType: flaw.flaw_type as FlawType,
        createdAt: "",
      });
    }
  }

  return annotations;
}

// --- Resolve flaw → speaker ---

/**
 * Build a map from flaw_id to the agent_id of the speaker who produced it.
 * For cross-section flaws, uses the first referenced item's speaker.
 */
export function buildFlawSpeakerMap(
  flaws: EvaluationFlaw[],
  transcript: { sections?: PresentationSection[]; turns?: DiscussionTurn[] }
): Map<string, string> {
  const items = getTranscriptItems(transcript);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const map = new Map<string, string>();

  for (const flaw of flaws) {
    const firstRef = flaw.location.references[0];
    const item = itemMap.get(firstRef);
    if (item) {
      map.set(flaw.flaw_id, item.speaker);
    }
  }

  return map;
}
