"use client";

import { useMemo } from "react";
import type { FlawType } from "@/lib/types"; // used in FlawHighlight interface

// --- Types ---

export interface FlawHighlight {
  flawId: string;
  flawType: FlawType;
  start: number;
  end: number;
  isActive: boolean;
  answered: boolean;
  correct: boolean;
}

interface HighlightedTurnContentProps {
  content: string;
  flawHighlights: FlawHighlight[];
  onFlawClick: (flawId: string) => void;
}

// --- Segment building ---

interface Segment {
  start: number;
  end: number;
  text: string;
  highlight?: FlawHighlight;
}

function buildHighlightSegments(content: string, highlights: FlawHighlight[]): Segment[] {
  if (highlights.length === 0) {
    return [{ start: 0, end: content.length, text: content }];
  }

  // Sort by start offset, then by end offset descending (longer first)
  const sorted = [...highlights].sort((a, b) => a.start - b.start || b.end - a.end);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    // Clamp to valid range
    const start = Math.max(hl.start, cursor);
    const end = Math.min(hl.end, content.length);
    if (start >= end) continue;

    // Plain text before this highlight
    if (cursor < start) {
      segments.push({
        start: cursor,
        end: start,
        text: content.slice(cursor, start),
      });
    }

    // Highlighted segment
    segments.push({
      start,
      end,
      text: content.slice(start, end),
      highlight: hl,
    });

    cursor = end;
  }

  // Remaining plain text
  if (cursor < content.length) {
    segments.push({
      start: cursor,
      end: content.length,
      text: content.slice(cursor),
    });
  }

  return segments;
}

// --- Component ---

export function HighlightedTurnContent({
  content,
  flawHighlights,
  onFlawClick,
}: HighlightedTurnContentProps) {
  const segments = useMemo(
    () => buildHighlightSegments(content, flawHighlights),
    [content, flawHighlights]
  );

  return (
    <p className="text-base md:text-lg text-gray-800 leading-relaxed md:leading-loose">
      {segments.map((seg, i) => {
        if (!seg.highlight) {
          return <span key={i}>{seg.text}</span>;
        }

        const hl = seg.highlight;

        // Answered — neutral background with correct/incorrect mark
        if (hl.answered) {
          const mark = hl.correct ? "✓" : "✗";
          const markColor = hl.correct ? "text-green-600" : "text-red-500";
          return (
            <span
              key={i}
              onClick={() => onFlawClick(hl.flawId)}
              className={`rounded-md px-1 py-0.5 cursor-pointer transition-all ${
                hl.isActive ? "bg-gray-200" : "bg-gray-100"
              }`}
            >
              {seg.text}
              <span className={`text-sm font-bold ml-1 ${markColor}`}>{mark}</span>
            </span>
          );
        }

        // Active (unanswered) — selected, bright marker
        if (hl.isActive) {
          return (
            <span
              key={i}
              onClick={() => onFlawClick(hl.flawId)}
              className="rounded-md px-1 py-0.5 cursor-pointer transition-all ring-2 ring-orange-400"
              style={{ backgroundColor: "#fef08a" }}
            >
              {seg.text}
            </span>
          );
        }

        // Inactive (unanswered, not selected) — light yellow marker
        return (
          <span
            key={i}
            onClick={() => onFlawClick(hl.flawId)}
            className="rounded-md px-1 py-0.5 cursor-pointer transition-all hover:ring-1 hover:ring-orange-300"
            style={{ backgroundColor: "#fef9c3" }}
          >
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}
