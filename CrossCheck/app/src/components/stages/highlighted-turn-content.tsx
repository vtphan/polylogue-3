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
    <p className="text-sm text-gray-800 leading-relaxed">
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
              className={`rounded px-0.5 cursor-pointer transition-all bg-gray-100 ${
                hl.isActive ? "bg-gray-200" : ""
              }`}
            >
              {seg.text}
              <span className={`text-xs font-bold ml-0.5 ${markColor}`}>{mark}</span>
            </span>
          );
        }

        // Active (unanswered) — selected highlight (neutral)
        if (hl.isActive) {
          return (
            <span
              key={i}
              onClick={() => onFlawClick(hl.flawId)}
              className="rounded px-0.5 cursor-pointer transition-all bg-indigo-100"
            >
              {seg.text}
            </span>
          );
        }

        // Inactive (unanswered, not selected)
        return (
          <span
            key={i}
            onClick={() => onFlawClick(hl.flawId)}
            className="rounded px-0.5 cursor-pointer transition-all bg-amber-100 hover:bg-amber-200"
          >
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}
