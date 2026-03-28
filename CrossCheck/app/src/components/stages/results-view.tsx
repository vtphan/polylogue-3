"use client";

import { useState } from "react";
import type { FlawType } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";

// --- Types ---

interface RecognizeResult {
  studentId: string;
  studentName: string;
  turns: { turnId: string; correct: boolean; hintsUsed: number; productiveFailure: boolean }[];
  summary: { total: number; correct: number; independent: number; withSupport: number };
}

interface ExplainResult {
  turnId: string;
  speaker: string;
  content: string;
  correctType: string;
  groupTypeAnswer: string;
  explanations: { authorId: string; authorName: string; text: string }[];
  hintsUsed: number;
  hasDisagreement: boolean;
}

interface LocateResult {
  triggered: boolean;
  totalTargets: number;
  found: number;
  perFlaw: { flawId: string; flawType: string; hintsUsed: number }[];
}

interface ResultsViewProps {
  recognizeResults: RecognizeResult[];
  explainResults: ExplainResult[];
  locateResult: LocateResult;
  totalFlaws: number;
}

type Tab = "summary" | "recognize" | "explain" | "locate";

// --- Component ---

export function ResultsView({
  recognizeResults,
  explainResults,
  locateResult,
  totalFlaws,
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  // Compute summary stats
  const totalCaughtRecognize = recognizeResults.reduce((sum, r) => sum + r.summary.correct, 0);
  const avgRecognizeAccuracy = recognizeResults.length > 0
    ? recognizeResults.reduce((sum, r) => sum + (r.summary.correct / r.summary.total), 0) / recognizeResults.length
    : 0;

  const explainCorrections = explainResults.filter((r) => r.groupTypeAnswer === r.correctType).length;
  const locateFound = locateResult.triggered ? locateResult.found : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "summary", label: "Summary" },
    { id: "recognize", label: "Recognize" },
    { id: "explain", label: "Explain" },
    ...(locateResult.triggered ? [{ id: "locate" as Tab, label: "Locate" }] : []),
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Session Results</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{totalFlaws}</div>
            <div className="text-xs text-gray-500">Total flaws</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {Math.round(avgRecognizeAccuracy * 100)}%
            </div>
            <div className="text-xs text-blue-600">Recognize accuracy</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{explainCorrections}</div>
            <div className="text-xs text-amber-600">Corrected in Explain</div>
          </div>
          <div className={`rounded-lg p-3 text-center ${locateResult.triggered ? "bg-orange-50" : "bg-green-50"}`}>
            {locateResult.triggered ? (
              <>
                <div className="text-2xl font-bold text-orange-700">
                  {locateFound}/{locateResult.totalTargets}
                </div>
                <div className="text-xs text-orange-600">Found in Locate</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-700">✓</div>
                <div className="text-xs text-green-600">All caught — no Locate needed</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary tab */}
      {activeTab === "summary" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Journey Overview</h3>

          <div className="space-y-4">
            {/* Recognize phase */}
            <div className="border-l-4 border-blue-400 pl-4">
              <h4 className="text-sm font-medium text-blue-800">Stage 1: Recognize (Individual)</h4>
              <div className="mt-2 space-y-1">
                {recognizeResults.map((r) => (
                  <div key={r.studentId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{r.studentName}</span>
                    <span className="text-gray-500">
                      {r.summary.correct}/{r.summary.total} correct
                      {r.summary.withSupport > 0 && (
                        <span className="ml-1 text-indigo-500">({r.summary.withSupport} with support)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explain phase */}
            <div className="border-l-4 border-amber-400 pl-4">
              <h4 className="text-sm font-medium text-amber-800">Stage 2: Explain (Group)</h4>
              <p className="text-sm text-gray-600 mt-1">
                {explainResults.length} turns discussed ·
                {explainCorrections} flaw types correctly identified ·
                {explainResults.filter((r) => r.hasDisagreement).length} disagreements resolved
              </p>
            </div>

            {/* Locate phase */}
            <div className="border-l-4 border-orange-400 pl-4">
              <h4 className="text-sm font-medium text-orange-800">Stage 3: Locate (Group)</h4>
              {locateResult.triggered ? (
                <p className="text-sm text-gray-600 mt-1">
                  {locateResult.totalTargets} missed flaws → {locateFound} found
                  {locateResult.totalTargets - locateFound > 0 && (
                    <span className="text-red-500"> · {locateResult.totalTargets - locateFound} still unfound</span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-green-600 mt-1">
                  All flaws caught — Locate was not needed!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recognize tab */}
      {activeTab === "recognize" && (
        <div className="space-y-4">
          {recognizeResults.map((r) => (
            <div key={r.studentId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{r.studentName}</h4>
                <span className="text-sm text-gray-500">
                  {r.summary.correct}/{r.summary.total} ·
                  {r.summary.independent} independent
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.turns.map((t) => (
                  <span
                    key={t.turnId}
                    className={`text-xs px-2 py-1 rounded ${
                      t.productiveFailure
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : t.correct
                          ? t.hintsUsed === 0
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-green-50 text-green-600 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {t.correct ? "✓" : t.productiveFailure ? "💡" : "✗"}
                    {t.hintsUsed > 0 && <span className="ml-0.5 opacity-50">·{t.hintsUsed}h</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explain tab */}
      {activeTab === "explain" && (
        <div className="space-y-4">
          {explainResults.map((r) => {
            const typeInfo = FLAW_TYPES[r.correctType as FlawType];
            const isCorrect = r.groupTypeAnswer === r.correctType;

            return (
              <div key={r.turnId} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-800">{r.speaker}</span>
                  {typeInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bgColor} ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                  {r.hasDisagreement && (
                    <span className="text-xs text-amber-600">⚡ Disagreement</span>
                  )}
                  {r.hintsUsed > 0 && (
                    <span className="text-xs text-indigo-500">💡 ×{r.hintsUsed}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{r.content}</p>

                {r.explanations.length > 0 && (
                  <div className="space-y-1.5">
                    {r.explanations.map((e, i) => (
                      <div key={i} className="text-xs bg-gray-50 rounded p-2">
                        <span className="font-medium text-gray-600">{e.authorName}:</span>
                        <span className="text-gray-700 ml-1">{e.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Locate tab */}
      {activeTab === "locate" && locateResult.triggered && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Missed Flaws ({locateFound}/{locateResult.totalTargets} found)
          </h3>
          <div className="space-y-2">
            {locateResult.perFlaw.map((f) => {
              const typeInfo = FLAW_TYPES[f.flawType as FlawType];
              const wasFound = f.hintsUsed >= 0; // all locate targets appear here

              return (
                <div
                  key={f.flawId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    wasFound ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {typeInfo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bgColor} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {f.hintsUsed === 0
                      ? "Found independently"
                      : `Found with ${f.hintsUsed} hint${f.hintsUsed !== 1 ? "s" : ""}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
