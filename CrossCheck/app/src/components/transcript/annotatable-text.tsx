"use client";

import { useCallback, useRef } from "react";
import type { Annotation, FlawType, AnnotationLocation } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

interface AnnotatableTextProps {
  itemId: string; // section_id or turn_id
  content: string;
  annotations: Annotation[];
  onTextSelected: (location: AnnotationLocation) => void;
  onAnnotationClick: (annotation: Annotation) => void;
}

/** Map flaw type to underline color CSS */
const UNDERLINE_COLORS: Record<FlawType, string> = {
  reasoning: "decoration-red-400",
  epistemic: "decoration-amber-400",
  completeness: "decoration-blue-400",
  coherence: "decoration-purple-400",
};

const BG_COLORS: Record<FlawType, string> = {
  reasoning: "bg-red-50",
  epistemic: "bg-amber-50",
  completeness: "bg-blue-50",
  coherence: "bg-purple-50",
};

interface TextSegment {
  start: number;
  end: number;
  text: string;
  annotation?: Annotation;
}

function buildSegments(content: string, annotations: Annotation[], itemId: string): TextSegment[] {
  // Filter annotations for this item
  const itemAnnotations = annotations
    .filter((a) => a.location.item_id === itemId)
    .sort((a, b) => a.location.start_offset - b.location.start_offset);

  if (itemAnnotations.length === 0) {
    return [{ start: 0, end: content.length, text: content }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const ann of itemAnnotations) {
    const start = ann.location.start_offset;
    const end = ann.location.end_offset;

    // Text before this annotation
    if (cursor < start) {
      segments.push({
        start: cursor,
        end: start,
        text: content.slice(cursor, start),
      });
    }

    // Annotated text
    segments.push({
      start,
      end,
      text: content.slice(start, end),
      annotation: ann,
    });

    cursor = end;
  }

  // Remaining text
  if (cursor < content.length) {
    segments.push({
      start: cursor,
      end: content.length,
      text: content.slice(cursor),
    });
  }

  return segments;
}

export function AnnotatableText({
  itemId,
  content,
  annotations,
  onTextSelected,
  onAnnotationClick,
}: AnnotatableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) return;

    const range = selection.getRangeAt(0);

    // Find the text content relative to the container
    const container = containerRef.current;

    // Walk through text nodes to compute offsets
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let charCount = 0;
    let startOffset = -1;
    let endOffset = -1;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeLength = node.textContent?.length || 0;

      if (node === range.startContainer) {
        startOffset = charCount + range.startOffset;
      }
      if (node === range.endContainer) {
        endOffset = charCount + range.endOffset;
        break;
      }

      charCount += nodeLength;
    }

    if (startOffset >= 0 && endOffset > startOffset) {
      const highlightedText = content.slice(startOffset, endOffset).trim();
      if (highlightedText.length > 0) {
        // Adjust offsets to trimmed text
        const trimStart = content.indexOf(highlightedText, startOffset);
        onTextSelected({
          item_id: itemId,
          start_offset: trimStart,
          end_offset: trimStart + highlightedText.length,
          highlighted_text: highlightedText,
        });
      }
    }

    selection.removeAllRanges();
  }, [content, itemId, onTextSelected]);

  const segments = buildSegments(content, annotations, itemId);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="leading-relaxed text-gray-800 whitespace-pre-wrap cursor-text select-text"
    >
      {segments.map((seg, i) =>
        seg.annotation ? (
          <span
            key={i}
            onClick={() => onAnnotationClick(seg.annotation!)}
            className={`underline decoration-2 ${UNDERLINE_COLORS[seg.annotation.flawType]} ${BG_COLORS[seg.annotation.flawType]} cursor-pointer rounded-sm px-0.5 -mx-0.5`}
            title={`${FLAW_TYPES[seg.annotation.flawType].label} flaw`}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}
