"use client";

export function MethodologyTab() {
  return (
    <div className="space-y-8">
      <PracticeModes />
      <Scaffolding />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice Modes
// ---------------------------------------------------------------------------

function PracticeModes() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Practice Modes</h2>
      <p className="text-sm text-gray-600 mb-4">
        Each group gets a mode (what kind of thinking to practice) and a difficulty
        setting (the knob). Aim for productive struggle — challenged but not lost.
      </p>

      {/* Learn prerequisite — before the modes */}
      <div className="bg-gray-50 rounded border border-gray-200 px-4 py-2.5 mb-4 text-xs text-gray-600">
        <span className="font-medium text-gray-900">Before starting:</span>{" "}
        Students complete a short vocabulary primer — flaw type definitions with examples and a quiz — before their first session.
      </div>

      {/* Mode cards — horizontal on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {MODES.map((mode) => (
          <div key={mode.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col">
            <span className="text-sm font-semibold text-gray-900 mb-1">{mode.name}</span>
            <p className="text-xs text-gray-600 leading-relaxed flex-1">{mode.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const MODES = [
  {
    id: "recognize",
    name: "Recognize",
    description:
      "Flaws are pre-highlighted with false positives mixed in. Students choose the flaw type for each one. Practices comprehension — understanding what makes something a flaw. Difficulty: A/B choice (easier) or multiple choice.",
  },
  {
    id: "locate",
    name: "Locate",
    description:
      "Hint cards give the flaw type and general area. Students find the exact passage. Practices directed search — reading closely with a purpose. Difficulty: sentence-level hints (easier) or section-level.",
  },
  {
    id: "classify",
    name: "Classify",
    description:
      "No hints or highlights. Students search the full transcript and flag what they find. Practices independent analysis. Difficulty: flag only (easier), assisted categorization, or full categorization.",
  },
  {
    id: "explain",
    name: "Explain",
    description:
      "Same open search as Classify, plus students judge severity and justify each flaw in writing. Practices evaluation and reasoning. Difficulty: guided template (easier) or free text.",
  },
];

// ---------------------------------------------------------------------------
// Scaffolding
// ---------------------------------------------------------------------------

function Scaffolding() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Scaffolding</h2>
      <p className="text-sm text-gray-600 mb-3">
        During a session you can send hints to groups that are stuck.
        Start light, escalate only if needed.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-2 font-medium w-40">Type</th>
              <th className="px-4 py-2 font-medium">What it does</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {SCAFFOLD_TYPES.map((s) => (
              <tr key={s.type}>
                <td className="px-4 py-2 font-medium text-gray-900">{s.type}</td>
                <td className="px-4 py-2">{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-400 mt-2">
        Pre-written templates are available for each type when sending scaffolds during a session.
      </p>
    </section>
  );
}

const SCAFFOLD_TYPES = [
  { type: "Attention redirect", description: "Point students back toward sections they may have skimmed." },
  { type: "Comparison prompt", description: "Ask students to compare specific parts of the transcript." },
  { type: "Category nudge", description: "Suggest looking for a different type of flaw." },
  { type: "Question prompt", description: "Pose a question about evidence or reasoning quality." },
  { type: "Flaw type hint", description: "Name the flaw type and point toward a general area." },
  { type: "Metacognitive", description: "Encourage students to reflect on their own reasoning process." },
];
