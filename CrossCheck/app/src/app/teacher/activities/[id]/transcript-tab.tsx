"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType, Agent, Annotation, PresentationTranscript, DiscussionTranscript, DiscussionTurn } from "@/lib/types";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";
import { AgentAvatar } from "@/components/transcript/agent-avatar";
import { AnnotatableText } from "@/components/transcript/annotatable-text";
import { buildFlawAnnotations } from "./flaw-annotations";
import type { EvaluationFlaw } from "./flaw-annotations";
import { FlawPopover } from "./flaw-popover";

const SECTION_LABELS: Record<string, string> = {
  introduction: "Introduction",
  approach: "Approach",
  findings: "Findings",
  solution: "Solution",
  conclusion: "Conclusion",
};

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  opening_up: { label: "Opening Up", color: "bg-green-100 text-green-700" },
  working_through: { label: "Working Through", color: "bg-yellow-100 text-yellow-700" },
  converging: { label: "Converging", color: "bg-blue-100 text-blue-700" },
};

interface TranscriptTabProps {
  activityType: "presentation" | "discussion";
  transcript: PresentationTranscript | DiscussionTranscript;
  agents: Agent[];
  flaws: EvaluationFlaw[];
  selectedFlawId: string | null;
  onSelectedFlawClear: () => void;
}

export function TranscriptTab({
  activityType,
  transcript,
  agents,
  flaws,
  selectedFlawId,
  onSelectedFlawClear,
}: TranscriptTabProps) {
  const [view, setView] = useState<"teacher" | "student">("teacher");
  const [activePopover, setActivePopover] = useState<{
    flaw: EvaluationFlaw;
    anchorRect: DOMRect;
  } | null>(null);

  const annotations = useMemo(
    () => (view === "teacher" ? buildFlawAnnotations(flaws, transcript) : []),
    [flaws, transcript, view]
  );

  // Map from annotation id back to the full flaw
  const flawMap = useMemo(() => {
    const map = new Map<string, EvaluationFlaw>();
    for (const flaw of flaws) {
      map.set(flaw.flaw_id, flaw);
      for (const ref of flaw.location.references) {
        if (flaw.location.references.length > 1) {
          map.set(`${flaw.flaw_id}:${ref}`, flaw);
        }
      }
    }
    return map;
  }, [flaws]);

  // Group flaws by item_id for badge rendering
  const flawsByItem = useMemo(() => {
    const map = new Map<string, EvaluationFlaw[]>();
    for (const flaw of flaws) {
      for (const ref of flaw.location.references) {
        const list = map.get(ref) || [];
        list.push(flaw);
        map.set(ref, list);
      }
    }
    return map;
  }, [flaws]);

  const agentMap = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.agent_id, a])),
    [agents]
  );

  // Find the anchor rect for an annotation by querying the DOM for the highlighted span
  const findAnchorRect = useCallback((annotation: Annotation): DOMRect | null => {
    // Find the section/turn container, then look for the span with matching data-seg-start
    const container = document.getElementById(annotation.location.item_id);
    if (!container) return null;

    const span = container.querySelector(
      `span[data-seg-start="${annotation.location.start_offset}"]`
    );
    if (!span) return null;

    return span.getBoundingClientRect();
  }, []);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    const flaw = flawMap.get(annotation.id);
    if (!flaw) return;

    // If clicking the same flaw, close the popover
    if (activePopover?.flaw.flaw_id === flaw.flaw_id) {
      setActivePopover(null);
      return;
    }

    const rect = findAnchorRect(annotation);
    if (!rect) return;

    setActivePopover({ flaw, anchorRect: rect });
  }, [flawMap, activePopover, findAnchorRect]);

  const handlePopoverClose = useCallback(() => {
    setActivePopover(null);
  }, []);

  const handleCrossSectionNavigate = useCallback((ref: string) => {
    const el = document.getElementById(ref);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Handle selectedFlawId from parent (inter-tab navigation)
  useEffect(() => {
    if (!selectedFlawId) return;
    const flaw = flawMap.get(selectedFlawId);
    if (!flaw) return;

    setView("teacher");

    // Wait for render, then find the annotation span and open popover
    requestAnimationFrame(() => {
      const firstRef = flaw.location.references[0];
      const el = document.getElementById(firstRef);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Find the annotation for this flaw to get its rect
      const annotation = annotations.find(
        (a) => a.id === flaw.flaw_id || a.id.startsWith(`${flaw.flaw_id}:`)
      );
      if (annotation) {
        const rect = findAnchorRect(annotation);
        if (rect) {
          setActivePopover({ flaw, anchorRect: rect });
        }
      }

      onSelectedFlawClear();
    });
  }, [selectedFlawId, flawMap, annotations, findAnchorRect, onSelectedFlawClear]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => { setView("teacher"); setActivePopover(null); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === "teacher" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Teacher View
          </button>
          <button
            onClick={() => { setView("student"); setActivePopover(null); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === "student" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Student View
          </button>
        </div>
      </div>

      {/* Transcript */}
      {view === "student" ? (
        activityType === "presentation" ? (
          <PresentationView
            sections={(transcript as PresentationTranscript).sections}
            agents={agents}
            annotations={[]}
            onTextSelected={() => {}}
            onAnnotationClick={() => {}}
          />
        ) : (
          <DiscussionView
            turns={(transcript as DiscussionTranscript).turns}
            agents={agents}
            annotations={[]}
            onTextSelected={() => {}}
            onAnnotationClick={() => {}}
          />
        )
      ) : (
        activityType === "presentation" ? (
          <div className="space-y-4">
            {(transcript as PresentationTranscript).sections.map((section) => {
              const agent = agentMap[section.speaker];
              return (
                <div
                  key={section.section_id}
                  id={section.section_id}
                  className="bg-white rounded-lg border border-gray-200 p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {agent && <AgentAvatar agentId={agent.agent_id} name={agent.name} />}
                    <div>
                      <div className="font-medium text-gray-900">
                        {agent?.name || section.speaker}
                      </div>
                      <div className="text-xs text-gray-500">
                        {section.role} &middot;{" "}
                        <span className="font-medium">
                          {SECTION_LABELS[section.section] || section.section}
                        </span>
                      </div>
                    </div>
                    <FlawBadges itemId={section.section_id} flawsByItem={flawsByItem} />
                  </div>
                  <AnnotatableText
                    itemId={section.section_id}
                    content={section.content}
                    annotations={annotations}
                    onTextSelected={() => {}}
                    onAnnotationClick={handleAnnotationClick}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <DiscussionTeacherView
            turns={(transcript as DiscussionTranscript).turns}
            agentMap={agentMap}
            annotations={annotations}
            flawsByItem={flawsByItem}
            onAnnotationClick={handleAnnotationClick}
          />
        )
      )}

      {/* Flaw popover */}
      {activePopover && (
        <FlawPopover
          flaw={activePopover.flaw}
          anchorRect={activePopover.anchorRect}
          onClose={handlePopoverClose}
          onNavigate={handleCrossSectionNavigate}
        />
      )}
    </div>
  );
}

function DiscussionTeacherView({
  turns,
  agentMap,
  annotations,
  flawsByItem,
  onAnnotationClick,
}: {
  turns: DiscussionTurn[];
  agentMap: Record<string, Agent>;
  annotations: Annotation[];
  flawsByItem: Map<string, EvaluationFlaw[]>;
  onAnnotationClick: (annotation: Annotation) => void;
}) {
  let currentStage = "";

  return (
    <div className="space-y-3">
      {turns.map((turn) => {
        const agent = agentMap[turn.speaker];
        const stageInfo = STAGE_LABELS[turn.stage] || { label: turn.stage, color: "bg-gray-100 text-gray-700" };
        const showStageDivider = turn.stage !== currentStage;
        currentStage = turn.stage;

        return (
          <div key={turn.turn_id}>
            {showStageDivider && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stageInfo.color}`}>
                  {stageInfo.label}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            <div
              id={turn.turn_id}
              className="flex gap-3 bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="pt-0.5">
                {agent && <AgentAvatar agentId={agent.agent_id} name={agent.name} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-medium text-gray-900 text-sm">
                    {agent?.name || turn.speaker}
                  </span>
                  {turn.role && (
                    <span className="text-xs text-gray-400">{turn.role}</span>
                  )}
                  <FlawBadges itemId={turn.turn_id} flawsByItem={flawsByItem} />
                </div>
                <AnnotatableText
                  itemId={turn.turn_id}
                  content={turn.content}
                  annotations={annotations}
                  onTextSelected={() => {}}
                  onAnnotationClick={onAnnotationClick}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlawBadges({ itemId, flawsByItem }: { itemId: string; flawsByItem: Map<string, EvaluationFlaw[]> }) {
  const itemFlaws = flawsByItem.get(itemId);
  if (!itemFlaws || itemFlaws.length === 0) return null;

  const types = [...new Set(itemFlaws.map((f) => f.flaw_type))];

  return (
    <div className="flex gap-1 ml-auto">
      {types.map((type) => {
        const info = FLAW_TYPES[type as FlawType];
        return (
          <span
            key={type}
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${info?.bgColor || "bg-gray-100"} ${info?.color || ""}`}
          >
            {info?.abbrev || type}
          </span>
        );
      })}
    </div>
  );
}
