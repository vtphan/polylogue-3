/**
 * Transcript utilities.
 *
 * Extracts a unified turn list from both presentation and discussion transcripts.
 * Used by all three stages to work with turns as the unit of analysis.
 */

import type {
  Transcript,
  PresentationTranscript,
  DiscussionTranscript,
  TranscriptTurn,
  Agent,
} from "./types";

/**
 * Extract a flat list of turns from any transcript type.
 *
 * - Presentations: each section becomes a turn
 * - Discussions: each dialogue turn maps directly
 */
export function extractTurns(transcript: Transcript): TranscriptTurn[] {
  const agentMap = new Map<string, Agent>();
  for (const agent of transcript.agents) {
    agentMap.set(agent.agent_id, agent);
  }

  if (transcript.activity === "presentation") {
    return extractPresentationTurns(transcript, agentMap);
  } else {
    return extractDiscussionTurns(transcript, agentMap);
  }
}

function extractPresentationTurns(
  transcript: PresentationTranscript,
  agentMap: Map<string, Agent>
): TranscriptTurn[] {
  return transcript.sections.map((section) => {
    const agent = agentMap.get(section.speaker);
    return {
      id: section.section_id,
      speaker: agent?.name || section.speaker,
      role: section.role || agent?.role || "",
      content: section.content,
      section: section.section,
    };
  });
}

function extractDiscussionTurns(
  transcript: DiscussionTranscript,
  agentMap: Map<string, Agent>
): TranscriptTurn[] {
  return transcript.turns.map((turn) => {
    const agent = agentMap.get(turn.speaker);
    return {
      id: turn.turn_id,
      speaker: agent?.name || turn.speaker,
      role: turn.role || agent?.role || "",
      content: turn.content,
      stage: turn.stage,
    };
  });
}

/**
 * Build a map of section names to turn IDs.
 *
 * For presentations: maps section type (e.g., "findings") to section_ids.
 * For discussions: maps stage (e.g., "opening_up") to turn_ids.
 *
 * Used by Locate hints for student-targeted section confirmation.
 */
export function buildSectionToTurnMap(transcript: Transcript): Map<string, string[]> {
  const map = new Map<string, string[]>();

  if (transcript.activity === "presentation") {
    for (const section of transcript.sections) {
      const key = section.section; // "introduction", "approach", etc.
      const existing = map.get(key) || [];
      existing.push(section.section_id);
      map.set(key, existing);
    }
  } else {
    for (const turn of transcript.turns) {
      const key = turn.stage; // "opening_up", "working_through", "converging"
      const existing = map.get(key) || [];
      existing.push(turn.turn_id);
      map.set(key, existing);
    }
  }

  return map;
}
