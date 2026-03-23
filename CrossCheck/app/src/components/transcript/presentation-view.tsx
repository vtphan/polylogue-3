"use client";

import type { PresentationSection, Agent, Annotation, AnnotationLocation } from "@/lib/types";
import { AgentAvatar } from "./agent-avatar";
import { AnnotatableText } from "./annotatable-text";

const SECTION_LABELS: Record<string, string> = {
  introduction: "Introduction",
  approach: "Approach",
  findings: "Findings",
  solution: "Solution",
  conclusion: "Conclusion",
};

interface PresentationViewProps {
  sections: PresentationSection[];
  agents: Agent[];
  annotations: Annotation[];
  onTextSelected: (location: AnnotationLocation) => void;
  onAnnotationClick: (annotation: Annotation) => void;
}

export function PresentationView({
  sections,
  agents,
  annotations,
  onTextSelected,
  onAnnotationClick,
}: PresentationViewProps) {
  const agentMap = Object.fromEntries(agents.map((a) => [a.agent_id, a]));

  return (
    <div className="space-y-4">
      {sections.map((section) => {
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
            </div>
            <AnnotatableText
              itemId={section.section_id}
              content={section.content}
              annotations={annotations}
              onTextSelected={onTextSelected}
              onAnnotationClick={onAnnotationClick}
            />
          </div>
        );
      })}
    </div>
  );
}
