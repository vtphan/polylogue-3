"use client";

import { useState, useCallback } from "react";
import type { Agent, PresentationTranscript, DiscussionTranscript } from "@/lib/types";
import type { Evaluation, AgentProfile } from "./flaw-annotations";
import { OverviewTab } from "./overview-tab";
import { TeamTab } from "./team-tab";
import { TranscriptTab } from "./transcript-tab";

interface ActivityData {
  id: string;
  topic: string;
  type: string;
  agents: Agent[];
  transcriptContent: PresentationTranscript | DiscussionTranscript;
  evaluation: Evaluation | null;
}

type Tab = "overview" | "team" | "transcript";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "team", label: "Meet the Team" },
  { key: "transcript", label: "Transcript" },
];

interface ActivityPreviewProps {
  activity: ActivityData;
  profiles: AgentProfile[] | null;
}

export function ActivityPreview({ activity, profiles }: ActivityPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedFlawId, setSelectedFlawId] = useState<string | null>(null);

  const handleFlawClick = useCallback((flawId: string) => {
    setSelectedFlawId(flawId);
    setActiveTab("transcript");
  }, []);

  const handleSelectedFlawClear = useCallback(() => {
    setSelectedFlawId(null);
  }, []);

  const { agents, evaluation, transcriptContent } = activity;
  const flawCount = evaluation?.summary?.total_flaws ?? 0;

  return (
    <div>
      {/* Header — always visible */}
      <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">
        {activity.topic}
      </h1>
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          activity.type === "presentation"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700"
        }`}>
          {activity.type}
        </span>
        <span className="text-xs text-gray-400">
          {agents.length} agents &middot; {flawCount} flaws
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          evaluation={evaluation}
          onFlawClick={handleFlawClick}
        />
      )}

      {activeTab === "team" && (
        <TeamTab
          profiles={profiles}
          agents={agents}
          transcript={transcriptContent}
          flaws={evaluation?.flaws || []}
          onFlawClick={handleFlawClick}
        />
      )}

      {activeTab === "transcript" && (
        <TranscriptTab
          activityType={activity.type as "presentation" | "discussion"}
          transcript={transcriptContent}
          agents={agents}
          flaws={evaluation?.flaws || []}
          selectedFlawId={selectedFlawId}
          onSelectedFlawClear={handleSelectedFlawClear}
        />
      )}
    </div>
  );
}
