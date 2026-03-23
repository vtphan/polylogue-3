"use client";

import { useState } from "react";
import type { FlawType, Annotation, Agent, PresentationTranscript, DiscussionTranscript } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";
import type { MatchResult, AnnotationMatch } from "@/lib/matching";
import { PresentationView } from "@/components/transcript/presentation-view";
import { DiscussionView } from "@/components/transcript/discussion-view";

interface Flaw {
  flaw_id: string;
  flaw_type: string;
  severity: string;
  description: string;
  evidence: string;
  explanation: string;
  location: {
    type: string;
    references: string[];
  };
}

interface Evaluation {
  flaws: Flaw[];
  summary: {
    total_flaws: number;
    key_patterns: string;
  };
}

interface FeedbackViewProps {
  annotations: Annotation[];
  matchResult: MatchResult;
  evaluation: Evaluation;
  transcript?: unknown;
  activityType?: "presentation" | "discussion";
  agents?: Agent[];
}

const MATCH_COLORS = {
  green: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", label: "Correct" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", label: "Missed" },
  red: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", label: "False positive" },
  blue: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", label: "Wrong type" },
};

type FeedbackTab = "results" | "transcript";

export function FeedbackView({ annotations, matchResult, evaluation, transcript, activityType, agents }: FeedbackViewProps) {
  const [activeTab, setActiveTab] = useState<FeedbackTab>("results");
  const { summary, annotationMatches, flawMatches } = matchResult;

  // Build lookup maps
  const annMatchMap = new Map<string, AnnotationMatch>();
  for (const m of annotationMatches) {
    annMatchMap.set(m.annotationId, m);
  }

  const flawMap = new Map<string, Flaw>();
  for (const f of evaluation.flaws) {
    flawMap.set(f.flaw_id, f);
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Summary stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-bold text-gray-900 mb-4">Your Results</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{summary.found}</div>
            <div className="text-xs text-green-600">Found</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">{summary.missed}</div>
            <div className="text-xs text-yellow-600">Missed</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{summary.falsePositives}</div>
            <div className="text-xs text-red-600">False positives</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{summary.partial}</div>
            <div className="text-xs text-blue-600">Wrong type</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>
            Detection rate:{" "}
            <strong className="text-gray-900">
              {Math.round(summary.detectionRate * 100)}%
            </strong>{" "}
            ({summary.found} of {summary.totalFlaws})
          </span>
          <span>
            Precision:{" "}
            <strong className="text-gray-900">
              {Math.round(summary.precision * 100)}%
            </strong>
          </span>
        </div>

        {/* By flaw type */}
        <div className="mt-4 flex gap-3">
          {Object.entries(summary.byType).map(([type, { found, total }]) => {
            const info = FLAW_TYPES[type as FlawType];
            return (
              <div key={type} className={`text-xs px-2.5 py-1.5 rounded ${info?.bgColor || "bg-gray-100"} ${info?.color || "text-gray-600"}`}>
                {info?.label || type}: {found}/{total}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab switcher */}
      {transcript && activityType && agents && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Annotations & Flaws
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "transcript"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Transcript
          </button>
        </div>
      )}

      {/* Transcript tab */}
      {activeTab === "transcript" && transcript && activityType && agents && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Your annotations are shown on the transcript. Green = correct, red = false positive, blue = wrong type.
          </p>
          {activityType === "presentation" ? (
            <PresentationView
              sections={(transcript as PresentationTranscript).sections}
              agents={agents}
              annotations={annotations}
              onTextSelected={() => {}}
              onAnnotationClick={() => {}}
            />
          ) : (
            <DiscussionView
              turns={(transcript as DiscussionTranscript).turns}
              agents={agents}
              annotations={annotations}
              onTextSelected={() => {}}
              onAnnotationClick={() => {}}
            />
          )}
        </div>
      )}

      {/* Results tab (default) */}
      {activeTab === "results" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Your annotations with match indicators */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Your Annotations</h3>
            {annotations.length === 0 ? (
              <p className="text-sm text-gray-400">No annotations were made.</p>
            ) : (
              <div className="space-y-2">
                {annotations.map((ann) => {
                  const match = annMatchMap.get(ann.id);
                  const matchColor = match ? MATCH_COLORS[match.category] : MATCH_COLORS.red;
                  const flawInfo = FLAW_TYPES[ann.flawType];
                  const matchedFlaw = match?.matchedFlawId ? flawMap.get(match.matchedFlawId) : null;

                  return (
                    <div
                      key={ann.id}
                      className={`p-3 rounded-lg border ${matchColor.bg} ${matchColor.border}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${flawInfo?.bgColor} ${flawInfo?.color}`}>
                            {flawInfo?.label}
                          </span>
                          <span className={`text-xs font-medium ${matchColor.text}`}>
                            {matchColor.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{ann.location.item_id}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        &ldquo;{ann.location.highlighted_text}&rdquo;
                      </p>
                      {match?.category === "blue" && matchedFlaw && (
                        <p className="text-xs text-blue-600 mt-1">
                          This is actually a <strong>{FLAW_TYPES[matchedFlaw.flaw_type as FlawType]?.label || matchedFlaw.flaw_type}</strong> flaw.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Reference flaws */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Reference Evaluation</h3>
            <div className="space-y-2">
              {evaluation.flaws.map((flaw) => {
                const flawMatch = flawMatches.find((m) => m.flawId === flaw.flaw_id);
                const isFound = flawMatch?.category === "green";
                const matchColor = isFound ? MATCH_COLORS.green : MATCH_COLORS.yellow;
                const flawInfo = FLAW_TYPES[flaw.flaw_type as FlawType];

                return (
                  <div
                    key={flaw.flaw_id}
                    className={`p-3 rounded-lg border ${matchColor.bg} ${matchColor.border}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${flawInfo?.bgColor} ${flawInfo?.color}`}>
                        {flawInfo?.label}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{flaw.severity}</span>
                      <span className={`text-xs font-medium ${matchColor.text}`}>
                        {isFound ? "Found" : "Missed"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {flaw.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-1.5">
                      &ldquo;{flaw.evidence}&rdquo;
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {flaw.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
