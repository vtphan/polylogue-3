"use client";

import { EvaluationPanel } from "@/components/evaluation/evaluation-panel";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";
import type { Agent, PresentationTranscript, DiscussionTranscript } from "@/lib/types";

interface ActivityData {
  id: string;
  topic: string;
  type: string;
  agents: Agent[];
  transcriptContent: unknown;
  evaluation: unknown;
}

export function ActivityPreview({ activity }: { activity: ActivityData }) {
  const agents = activity.agents;
  const transcript = activity.transcriptContent;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">
        {activity.topic}
      </h1>
      <div className="flex items-center gap-2 mb-6">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          activity.type === "presentation"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700"
        }`}>
          {activity.type}
        </span>
        <span className="text-xs text-gray-400">
          {agents.map((a) => a.name).join(", ")}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Transcript (what students will see) */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Transcript (Student View)</h2>
          {activity.type === "presentation" ? (
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
          )}
        </div>

        {/* Right: Evaluation (answer key) */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Reference Evaluation</h2>
          <EvaluationPanel evaluation={activity.evaluation as never} />
        </div>
      </div>
    </div>
  );
}
