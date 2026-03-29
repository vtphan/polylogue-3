import type { FlawType, Annotation, PresentationSection, DiscussionTurn } from "@/lib/types";
import { findEvidenceOffsets } from "@/lib/evidence-offsets";

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
