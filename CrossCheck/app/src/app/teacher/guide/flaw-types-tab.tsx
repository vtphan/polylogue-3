"use client";

import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";
import { LEARN_EXAMPLES } from "@/lib/learn-mode-content";

const FLAW_ORDER: FlawType[] = ["reasoning", "epistemic", "completeness", "coherence"];

export function FlawTypesTab() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        CrossCheck uses four categories of critical thinking flaws. Students learn to
        identify these in AI-generated presentations and discussions. Understanding them
        yourself is key to effective scaffolding.
      </p>

      {/* Flaw type cards */}
      <div className="space-y-6">
        {FLAW_ORDER.map((type) => {
          const info = FLAW_TYPES[type];
          const examples = LEARN_EXAMPLES.filter((e) => e.flawType === type);

          return (
            <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className={`px-5 py-3 ${info.bgColor}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${info.color}`}>{info.abbrev}</span>
                  <span className={`font-semibold ${info.color}`}>{info.label}</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Definition */}
                <p className="text-sm text-gray-700">{info.description}</p>

                {/* Examples */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Examples
                  </h4>
                  <div className="space-y-3">
                    {examples.map((example, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800 italic mb-1.5">
                          &ldquo;{example.passage}&rdquo;
                        </p>
                        <p className="text-xs text-gray-600">{example.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* How flaws manifest */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">How Flaws Appear in Transcripts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Flaw Type</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">In Presentations</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">In Discussions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 font-medium text-red-700">Reasoning</td>
                <td className="px-4 py-3 text-gray-600">A speaker draws a conclusion that doesn't follow from their evidence</td>
                <td className="px-4 py-3 text-gray-600">A participant's argument has a logical gap that others don't challenge</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-amber-700">Epistemic</td>
                <td className="px-4 py-3 text-gray-600">A speaker presents a preliminary finding as established fact</td>
                <td className="px-4 py-3 text-gray-600">Someone expresses certainty that isn't warranted by the evidence they cite</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-blue-700">Completeness</td>
                <td className="px-4 py-3 text-gray-600">An important stakeholder, tradeoff, or counterargument is never mentioned</td>
                <td className="px-4 py-3 text-gray-600">The group converges on a position without considering obvious alternatives</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-purple-700">Coherence</td>
                <td className="px-4 py-3 text-gray-600">Two sections contradict each other (e.g., introduction claims X, conclusion claims Y)</td>
                <td className="px-4 py-3 text-gray-600">Two participants contradict each other without the group noticing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
