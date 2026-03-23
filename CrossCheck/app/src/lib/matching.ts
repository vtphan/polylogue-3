/**
 * Annotation matching engine.
 *
 * Compares student annotations against the reference flaw index to produce
 * match results: green (correct), yellow (missed), red (false positive), blue (partial).
 */

import type { FlawType } from "./types";

interface AnnotationInput {
  id: string;
  location: { item_id: string };
  flawType: string;
}

interface FlawIndexEntry {
  flaw_id: string;
  locations: string[]; // section_ids or turn_ids
  flaw_type: string;
  severity: string;
}

export type MatchCategory = "green" | "yellow" | "red" | "blue";

export interface AnnotationMatch {
  annotationId: string;
  category: MatchCategory; // green, red, or blue
  matchedFlawId?: string; // which reference flaw it matched (green/blue)
}

export interface FlawMatch {
  flawId: string;
  category: "green" | "yellow"; // found or missed
  matchedAnnotationId?: string;
}

export interface MatchResult {
  annotationMatches: AnnotationMatch[];
  flawMatches: FlawMatch[];
  summary: {
    totalFlaws: number;
    found: number;
    missed: number;
    falsePositives: number;
    partial: number;
    detectionRate: number; // found / totalFlaws
    precision: number; // found / (found + falsePositives)
    byType: Record<string, { found: number; total: number }>;
  };
}

export function computeMatches(
  annotations: AnnotationInput[],
  flawIndex: FlawIndexEntry[]
): MatchResult {
  const annotationMatches: AnnotationMatch[] = [];
  const flawMatches: FlawMatch[] = [];
  const matchedFlawIds = new Set<string>();
  const matchedAnnotationIds = new Set<string>();

  // Pass 1: Find green matches (correct location + correct type)
  for (const ann of annotations) {
    for (const flaw of flawIndex) {
      if (
        flaw.locations.includes(ann.location.item_id) &&
        flaw.flaw_type === ann.flawType &&
        !matchedFlawIds.has(flaw.flaw_id)
      ) {
        annotationMatches.push({
          annotationId: ann.id,
          category: "green",
          matchedFlawId: flaw.flaw_id,
        });
        matchedFlawIds.add(flaw.flaw_id);
        matchedAnnotationIds.add(ann.id);
        break; // one annotation matches at most one flaw
      }
    }
  }

  // Pass 2: Find blue matches (correct location, wrong type) for unmatched annotations
  for (const ann of annotations) {
    if (matchedAnnotationIds.has(ann.id)) continue;

    let foundBlue = false;
    for (const flaw of flawIndex) {
      if (
        flaw.locations.includes(ann.location.item_id) &&
        flaw.flaw_type !== ann.flawType &&
        !matchedFlawIds.has(flaw.flaw_id)
      ) {
        annotationMatches.push({
          annotationId: ann.id,
          category: "blue",
          matchedFlawId: flaw.flaw_id,
        });
        matchedAnnotationIds.add(ann.id);
        foundBlue = true;
        break;
      }
    }

    // Pass 3: Red (false positive) — no location match at all
    if (!foundBlue) {
      annotationMatches.push({
        annotationId: ann.id,
        category: "red",
      });
      matchedAnnotationIds.add(ann.id);
    }
  }

  // Build flaw matches: green (found) or yellow (missed)
  for (const flaw of flawIndex) {
    if (matchedFlawIds.has(flaw.flaw_id)) {
      const matchingAnn = annotationMatches.find(
        (m) => m.matchedFlawId === flaw.flaw_id && m.category === "green"
      );
      flawMatches.push({
        flawId: flaw.flaw_id,
        category: "green",
        matchedAnnotationId: matchingAnn?.annotationId,
      });
    } else {
      flawMatches.push({
        flawId: flaw.flaw_id,
        category: "yellow",
      });
    }
  }

  // Summary
  const found = flawMatches.filter((f) => f.category === "green").length;
  const missed = flawMatches.filter((f) => f.category === "yellow").length;
  const falsePositives = annotationMatches.filter((a) => a.category === "red").length;
  const partial = annotationMatches.filter((a) => a.category === "blue").length;
  const totalFlaws = flawIndex.length;

  // By flaw type
  const byType: Record<string, { found: number; total: number }> = {};
  for (const flaw of flawIndex) {
    if (!byType[flaw.flaw_type]) {
      byType[flaw.flaw_type] = { found: 0, total: 0 };
    }
    byType[flaw.flaw_type].total++;
    if (matchedFlawIds.has(flaw.flaw_id)) {
      byType[flaw.flaw_type].found++;
    }
  }

  return {
    annotationMatches,
    flawMatches,
    summary: {
      totalFlaws,
      found,
      missed,
      falsePositives,
      partial,
      detectionRate: totalFlaws > 0 ? found / totalFlaws : 0,
      precision: found + falsePositives > 0 ? found / (found + falsePositives) : 0,
      byType,
    },
  };
}
