"use client";

import { SCAFFOLD_TEMPLATES } from "@/lib/scaffold-templates";

export function MethodologyTab() {
  return (
    <div className="space-y-8">
      {/* Practice Modes */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Practice Modes</h2>
        <p className="text-sm text-gray-600 mb-4">
          CrossCheck uses four practice modes arranged on an <strong>independence gradient</strong>.
          As students progress from Recognize to Explain, the system withdraws support
          and students take on more responsibility for identifying and analyzing flaws.
        </p>

        {/* Gradient visual */}
        <div className="flex items-center gap-1 mb-4 text-xs">
          <span className="text-gray-500">More support</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-blue-400 to-gray-200" />
          <span className="text-gray-500">More independence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Mode</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">What students do</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">System provides</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">You control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 font-medium">Recognize</td>
                <td className="px-4 py-3 text-gray-600">Read pre-highlighted flaws and identify the type</td>
                <td className="px-4 py-3 text-gray-600">Flaw locations shown; student classifies</td>
                <td className="px-4 py-3 text-gray-600">Response format: A/B choice or multiple choice</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Locate</td>
                <td className="px-4 py-3 text-gray-600">Search for flaws with directional hints</td>
                <td className="px-4 py-3 text-gray-600">Hint highlights at sentence or section level</td>
                <td className="px-4 py-3 text-gray-600">Hint scope: sentence or section</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Classify</td>
                <td className="px-4 py-3 text-gray-600">Find and categorize flaws independently</td>
                <td className="px-4 py-3 text-gray-600">Nothing shown — open search</td>
                <td className="px-4 py-3 text-gray-600">Categorization: detect only, assisted, or full</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Explain</td>
                <td className="px-4 py-3 text-gray-600">Full analysis with written justification</td>
                <td className="px-4 py-3 text-gray-600">Nothing shown — student writes reasoning</td>
                <td className="px-4 py-3 text-gray-600">Explanation format: guided or free text</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          <strong>Learn</strong> mode is a standalone vocabulary primer available to students outside of sessions.
          It teaches flaw type definitions through examples and a short quiz.
        </p>
      </section>

      {/* Session Phases */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Phases</h2>
        <p className="text-sm text-gray-600 mb-4">
          Each session progresses through five phases. You control when to advance.
        </p>

        <div className="space-y-3">
          {PHASES.map((phase, i) => (
            <div key={phase.name} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${phase.color}`}>
                  {i + 1}
                </div>
                {i < PHASES.length - 1 && <div className="w-px h-4 bg-gray-300" />}
              </div>
              <div className="pt-1">
                <div className="font-medium text-gray-900 text-sm">{phase.name}</div>
                <p className="text-xs text-gray-600">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scaffolding */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Scaffolding</h2>
        <p className="text-sm text-gray-600 mb-4">
          During a session, you can send hints to individual groups. Scaffolds are organized
          into 6 levels of increasing specificity. Start with lighter nudges and escalate
          only if a group is stuck.
        </p>

        <div className="space-y-4">
          {SCAFFOLD_LEVELS.map((level) => {
            const templates = SCAFFOLD_TEMPLATES.filter((t) => t.level === level.level);
            return (
              <div key={level.level} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    Level {level.level}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{level.label}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{level.description}</p>
                <div className="space-y-1">
                  {templates.map((t) => (
                    <div key={t.label} className="text-xs text-gray-700 bg-gray-50 rounded px-3 py-1.5">
                      <span className="font-medium">{t.label}:</span> {t.text}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const PHASES = [
  {
    name: "Setup",
    description: "Configure groups, assign students, choose practice modes. Students cannot see the activity yet.",
    color: "bg-gray-200 text-gray-700",
  },
  {
    name: "Individual",
    description: "Students work independently. Each student sees only their own annotations. You can send scaffolds to groups.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Group",
    description: "Students see all group members' annotations and work toward consensus. Annotations need 2 confirmations to become group answers.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    name: "Reviewing",
    description: "The reference evaluation is revealed. Students see which flaws they found, missed, and incorrectly identified. You can view Class Results for a cross-group comparison.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Closed",
    description: "Session is archived. Data is preserved for later review.",
    color: "bg-gray-100 text-gray-500",
  },
];

const SCAFFOLD_LEVELS = [
  { level: 1, label: "Attention Redirect", description: "Gently point students back toward sections they may have skimmed." },
  { level: 2, label: "Comparison Prompt", description: "Ask students to compare specific parts of the transcript." },
  { level: 3, label: "Category Nudge", description: "Hint that students should look for a different type of flaw." },
  { level: 4, label: "Question Prompt", description: "Pose a specific question about evidence or reasoning quality." },
  { level: 5, label: "Flaw Type Hint", description: "Name the flaw type and point toward a general area." },
  { level: 6, label: "Metacognitive", description: "Encourage students to reflect on their own reasoning process." },
];
