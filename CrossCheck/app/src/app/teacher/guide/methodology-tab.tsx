"use client";

export function MethodologyTab() {
  return (
    <div className="space-y-8">
      <SessionFlow />
      <Scaffolding />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Flow (replaces Practice Modes)
// ---------------------------------------------------------------------------

function SessionFlow() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Flow</h2>
      <p className="text-sm text-gray-600 mb-4">
        Every session runs three stages automatically. You choose the transcript — the flow handles the rest.
      </p>

      {/* Learn prerequisite */}
      <div className="bg-gray-50 rounded border border-gray-200 px-4 py-2.5 mb-4 text-xs text-gray-600">
        <span className="font-medium text-gray-900">Before starting:</span>{" "}
        Students complete a short vocabulary primer — flaw type definitions with examples and a quiz — before their first session.
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {STAGES.map((stage) => (
          <div key={stage.id} className={`rounded-lg border px-4 py-3 flex flex-col ${stage.borderColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${stage.badgeColor}`}>
                {stage.number}
              </span>
              <span className="text-sm font-semibold text-gray-900">{stage.name}</span>
              <span className="text-[10px] text-gray-400">{stage.context}</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed flex-1">{stage.description}</p>
          </div>
        ))}
      </div>

      {/* Your role */}
      <div className="bg-indigo-50 rounded-lg border border-indigo-200 px-4 py-3 text-xs text-indigo-700">
        <span className="font-medium text-indigo-900">Your role:</span>{" "}
        Press &quot;Move to Explain&quot; when most students finish Recognize. Everything else is automatic — Explain transitions to Locate only if flaws were missed, and Locate transitions to Results when complete.
      </div>

      {/* Hints */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Strategic Support (&quot;Narrow it down&quot;)</h3>
        <p className="text-xs text-gray-600 mb-2">
          Students can request hints in every stage. Hints unlock after a brief try-first period to encourage engagement before requesting support.
        </p>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">How hints help</th>
                <th className="px-4 py-2 font-medium">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="px-4 py-2 font-medium">Recognize</td>
                <td className="px-4 py-2">Eliminates wrong answer choices</td>
                <td className="px-4 py-2">2 per turn</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Explain</td>
                <td className="px-4 py-2">Reveals flaw type → provides writing template</td>
                <td className="px-4 py-2">2 per turn</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium">Locate</td>
                <td className="px-4 py-2">Confirms section → highlights turn → reveals type</td>
                <td className="px-4 py-2">3 per flaw</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Hint usage is tracked per student and shown in the dashboard. Use it to gauge independence.
        </p>
      </div>
    </section>
  );
}

const STAGES = [
  {
    id: "recognize",
    number: "1",
    name: "Recognize",
    context: "Individual",
    description:
      "Each student reads the transcript turn by turn and identifies the flaw type from 4 choices. Non-flawed turns teach discrimination through productive failure. This is the warm-up — students build familiarity with the content.",
    borderColor: "border-blue-200 bg-blue-50/30",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    id: "explain",
    number: "2",
    name: "Explain",
    context: "Group",
    description:
      "Students sit together and discuss turns where they disagreed or got the type wrong. They select the flaw type as a group, then write explanations collaboratively. Multiple students can write simultaneously — each explanation is attributed.",
    borderColor: "border-amber-200 bg-amber-50/30",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    id: "locate",
    number: "3",
    name: "Locate",
    context: "Group · Conditional",
    description:
      "Only activates if the group missed flaws. Students search the full transcript together to find what they missed. The system shows how many flaws remain. Hints let them tap a section to check if a flaw is nearby.",
    borderColor: "border-orange-200 bg-orange-50/30",
    badgeColor: "bg-orange-100 text-orange-800",
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
