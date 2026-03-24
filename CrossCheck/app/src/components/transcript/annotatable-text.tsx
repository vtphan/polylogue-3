"use client";

import { useCallback, useMemo, useRef } from "react";
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

/**
 * Find the span with a data-seg-start attribute that contains the given DOM node.
 * Stops walking at the container (the div with the ref). Returns the span element or null.
 */
function findSegmentSpan(node: Node, container: HTMLElement): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== container) {
    if (current instanceof HTMLElement && current.hasAttribute("data-seg-start")) {
      return current;
    }
    current = current.parentNode;
  }
  // If the node is a direct text child of the container (shouldn't happen with segments,
  // but handle defensively), find the segment span that is the node's parent
  return null;
}

/**
 * Compute the character offset within a span's text content where the given
 * DOM position (container, offset) falls.
 */
function offsetWithinSpan(span: HTMLElement, container: Node, offset: number): number {
  // If the container is the span itself, offset is a child index
  if (container === span) {
    let chars = 0;
    for (let i = 0; i < offset && i < span.childNodes.length; i++) {
      chars += span.childNodes[i].textContent?.length || 0;
    }
    return chars;
  }

  // Walk text nodes within the span until we find the container
  const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
  let chars = 0;
  while (walker.nextNode()) {
    if (walker.currentNode === container) {
      return chars + offset;
    }
    chars += walker.currentNode.textContent?.length || 0;
  }
  return chars;
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

    const container = containerRef.current;
    const range = selection.getRangeAt(0);

    // Ensure selection is within our container
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      selection.removeAllRanges();
      return;
    }

    // Find which segment spans the selection starts and ends in
    const startSpan = findSegmentSpan(range.startContainer, container);
    const endSpan = findSegmentSpan(range.endContainer, container);

    if (!startSpan || !endSpan) {
      selection.removeAllRanges();
      return;
    }

    // Get the segment's content offset from data attributes
    const startSegOffset = parseInt(startSpan.getAttribute("data-seg-start") || "0", 10);
    const endSegOffset = parseInt(endSpan.getAttribute("data-seg-start") || "0", 10);

    // Compute character position within each segment span
    const startWithin = offsetWithinSpan(startSpan, range.startContainer, range.startOffset);
    const endWithin = offsetWithinSpan(endSpan, range.endContainer, range.endOffset);

    // Absolute offsets into the content string
    let absStart = startSegOffset + startWithin;
    let absEnd = endSegOffset + endWithin;

    // Handle right-to-left selections
    if (absStart > absEnd) {
      [absStart, absEnd] = [absEnd, absStart];
    }

    // Clamp to content bounds
    absStart = Math.max(0, absStart);
    absEnd = Math.min(content.length, absEnd);

    if (absEnd > absStart) {
      const highlightedText = content.slice(absStart, absEnd).trim();
      if (highlightedText.length > 0) {
        // Adjust for leading whitespace in the selection
        const raw = content.slice(absStart, absEnd);
        const trimLeading = raw.length - raw.trimStart().length;
        const finalStart = absStart + trimLeading;
        const finalEnd = finalStart + highlightedText.length;

        // Reject if selection overlaps any existing annotation
        const itemAnnotations = annotations.filter((a) => a.location.item_id === itemId);
        const overlaps = itemAnnotations.some(
          (a) => finalStart < a.location.end_offset && finalEnd > a.location.start_offset
        );
        if (overlaps) return;

        onTextSelected({
          item_id: itemId,
          start_offset: finalStart,
          end_offset: finalEnd,
          highlighted_text: highlightedText,
        });
      }
    }

    // Don't clear selection here — keep the browser highlight visible
    // until the user clicks a flaw type button. The selection clears
    // naturally when the annotation renders and replaces the text spans.
  }, [content, itemId, onTextSelected]);

  const segments = useMemo(() => buildSegments(content, annotations, itemId), [content, annotations, itemId]);

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
            data-seg-start={seg.start}
            data-seg-end={seg.end}
            onClick={() => onAnnotationClick(seg.annotation!)}
            className={`underline decoration-2 ${UNDERLINE_COLORS[seg.annotation.flawType]} ${BG_COLORS[seg.annotation.flawType]} cursor-pointer rounded-sm px-0.5 -mx-0.5`}
            title={`${FLAW_TYPES[seg.annotation.flawType].label} flaw`}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i} data-seg-start={seg.start} data-seg-end={seg.end}>
            {seg.text}
          </span>
        )
      )}
    </div>
  );
}
