"use client";

import { useMemo } from "react";
import type { DiscussionTurn, Agent, Annotation, AnnotationLocation } from "@/lib/types";
import { AgentAvatar } from "./agent-avatar";
import { AnnotatableText } from "./annotatable-text";

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  opening_up: { label: "Opening Up", color: "bg-green-100 text-green-700" },
  working_through: { label: "Working Through", color: "bg-yellow-100 text-yellow-700" },
  converging: { label: "Converging", color: "bg-blue-100 text-blue-700" },
};

interface DiscussionViewProps {
  turns: DiscussionTurn[];
  agents: Agent[];
  annotations: Annotation[];
  onTextSelected: (location: AnnotationLocation) => void;
  onAnnotationClick: (annotation: Annotation) => void;
  emphasizedItems?: string[];
}

export function DiscussionView({
  turns,
  agents,
  annotations,
  onTextSelected,
  onAnnotationClick,
  emphasizedItems,
}: DiscussionViewProps) {
  const agentMap = useMemo(() => Object.fromEntries(agents.map((a) => [a.agent_id, a])), [agents]);

  // Group turns by stage for stage dividers
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
              className={`flex gap-3 bg-white rounded-lg border border-gray-200 p-4 transition-opacity ${emphasizedItems && !emphasizedItems.includes(turn.turn_id) ? "opacity-40" : ""}`}
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
                </div>
                <AnnotatableText
                  itemId={turn.turn_id}
                  content={turn.content}
                  annotations={annotations}
                  onTextSelected={onTextSelected}
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
