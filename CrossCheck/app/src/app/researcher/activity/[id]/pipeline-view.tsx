"use client";

import { useState } from "react";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";

interface ActivityData {
  id: string;
  scenarioId: string;
  type: string;
  topic: string;
  agents: { agent_id: string; name: string; role: string }[];
  transcript: Record<string, unknown>;
  transcriptContent: Record<string, unknown>;
  evaluation: {
    flaws: {
      flaw_id: string;
      flaw_type: string;
      source: string;
      severity: string;
      description: string;
      evidence: string;
      explanation: string;
      location: { type: string; references: string[] };
    }[];
    summary: Record<string, unknown>;
  };
  metadata: {
    scenario: Record<string, unknown>;
    profiles: {
      name: string;
      agent_id: string;
      knowledge_profile: Record<string, unknown[]>;
      disposition: Record<string, unknown>;
      expected_flaws: { flaw: string; flaw_type: string; mechanism: string }[];
    }[];
  } | null;
}

type Tab = "scenario" | "profiles" | "transcript" | "evaluation";

const TABS: { key: Tab; label: string }[] = [
  { key: "scenario", label: "Scenario" },
  { key: "profiles", label: "Profiles" },
  { key: "transcript", label: "Transcript" },
  { key: "evaluation", label: "Evaluation" },
];

export function PipelineView({ activity }: { activity: ActivityData }) {
  const [activeTab, setActiveTab] = useState<Tab>("scenario");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "scenario" && <ScenarioTab metadata={activity.metadata} />}
      {activeTab === "profiles" && <ProfilesTab metadata={activity.metadata} />}
      {activeTab === "transcript" && <TranscriptTab transcript={activity.transcript} type={activity.type} />}
      {activeTab === "evaluation" && <EvaluationTab evaluation={activity.evaluation} />}
    </div>
  );
}

function ScenarioTab({ metadata }: { metadata: ActivityData["metadata"] }) {
  if (!metadata?.scenario) {
    return <p className="text-gray-500">No scenario metadata available.</p>;
  }

  const scenario = metadata.scenario as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <DataSection title="Driving Question" data={scenario.topic} />
      <DataSection title="Context" data={scenario.context} />
      <DataSection title="Notes" data={scenario.notes} />
      <DataSection title="Agent Sketches" data={scenario.agents} />
    </div>
  );
}

function ProfilesTab({ metadata }: { metadata: ActivityData["metadata"] }) {
  if (!metadata?.profiles || metadata.profiles.length === 0) {
    return <p className="text-gray-500">No profiles available.</p>;
  }

  return (
    <div className="space-y-6">
      {metadata.profiles.map((profile) => (
        <div key={profile.agent_id} className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">{profile.name}</h3>
          <p className="text-xs text-gray-400 mb-4 font-mono">{profile.agent_id}</p>

          {/* Disposition */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Disposition</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.disposition || {}).map(([key, value]) => (
                <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>

          {/* Knowledge Profile */}
          {profile.knowledge_profile && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Knowledge Profile</h4>
              {Object.entries(profile.knowledge_profile).map(([category, areas]) => (
                <div key={category} className="mb-3">
                  <h5 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    {category.replace(/_/g, " ")}
                  </h5>
                  {Array.isArray(areas) && areas.map((area: { area?: string; detail?: string }, i: number) => (
                    <div key={i} className="text-sm text-gray-700 ml-3 mb-1">
                      <span className="font-medium">{area.area}</span>
                      {area.detail && (
                        <p className="text-xs text-gray-500 ml-2">{area.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Expected Flaws */}
          {profile.expected_flaws && profile.expected_flaws.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Flaws</h4>
              {profile.expected_flaws.map((ef, i) => {
                const flawInfo = FLAW_TYPES[ef.flaw_type as FlawType];
                return (
                  <div key={i} className="text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${flawInfo?.bgColor || "bg-gray-100"} ${flawInfo?.color || ""}`}>
                        {flawInfo?.label || ef.flaw_type}
                      </span>
                      <span className="text-gray-800">{ef.flaw}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-2 mt-0.5">{ef.mechanism}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TranscriptTab({ transcript, type }: { transcript: Record<string, unknown>; type: string }) {
  const items = type === "presentation"
    ? (transcript.sections as Record<string, unknown>[]) || []
    : (transcript.turns as Record<string, unknown>[]) || [];

  const itemLabel = type === "presentation" ? "Section" : "Turn";

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-2">
        Full transcript with metadata (knowledge areas, rationale). {items.length} {itemLabel.toLowerCase()}s.
      </p>
      {items.map((item, i) => {
        const id = (item.section_id || item.turn_id || `item_${i}`) as string;
        const speaker = item.speaker as string;
        const content = item.content as string;
        const metadata = item.metadata as Record<string, unknown> | undefined;
        const stage = item.stage as string | undefined;
        const section = item.section as string | undefined;

        return (
          <div key={id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-400">{id}</span>
              <span className="text-xs font-medium text-gray-700">{speaker}</span>
              {section && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{section}</span>}
              {stage && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">{stage}</span>}
            </div>

            <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{content}</p>

            {/* Metadata */}
            {metadata && (
              <div className="border-t border-gray-100 pt-2 mt-2">
                {metadata.knowledge_areas_engaged && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500">Knowledge areas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(metadata.knowledge_areas_engaged as { area: string; category: string }[]).map((ka, j) => {
                        const catColors: Record<string, string> = {
                          strong: "bg-green-100 text-green-700",
                          shallow: "bg-yellow-100 text-yellow-700",
                          misconception: "bg-red-100 text-red-700",
                          blind_spot: "bg-gray-200 text-gray-600",
                        };
                        return (
                          <span key={j} className={`text-xs px-1.5 py-0.5 rounded ${catColors[ka.category] || "bg-gray-100"}`}>
                            {ka.category}: {ka.area}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {metadata.reactive_tendency_activated !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    metadata.reactive_tendency_activated
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    reactive tendency: {metadata.reactive_tendency_activated ? "activated" : "not activated"}
                  </span>
                )}
                {metadata.rationale && (
                  <p className="text-xs text-gray-400 mt-2 italic">{metadata.rationale as string}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EvaluationTab({ evaluation }: { evaluation: ActivityData["evaluation"] }) {
  if (!evaluation?.flaws) {
    return <p className="text-gray-500">No evaluation data.</p>;
  }

  const summary = evaluation.summary as Record<string, unknown>;

  return (
    <div>
      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {summary.key_patterns as string}
        </p>
      </div>

      {/* Flaws */}
      <div className="space-y-3">
        {evaluation.flaws.map((flaw) => {
          const flawInfo = FLAW_TYPES[flaw.flaw_type as FlawType];
          return (
            <div key={flaw.flaw_id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-gray-400">{flaw.flaw_id}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${flawInfo?.bgColor || "bg-gray-100"} ${flawInfo?.color || ""}`}>
                  {flawInfo?.label || flaw.flaw_type}
                </span>
                <span className="text-xs text-gray-400 capitalize">{flaw.severity}</span>
                <span className="text-xs text-gray-400">{flaw.source}</span>
                <span className="text-xs text-gray-400">
                  {flaw.location.type}: {flaw.location.references.join(", ")}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">{flaw.description}</p>
              <p className="text-xs text-gray-500 mb-2">&ldquo;{flaw.evidence}&rdquo;</p>
              <p className="text-xs text-gray-600 leading-relaxed">{flaw.explanation}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataSection({ title, data }: { title: string; data: unknown }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      {typeof data === "string" ? (
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{data}</p>
      ) : (
        <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 p-3 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
