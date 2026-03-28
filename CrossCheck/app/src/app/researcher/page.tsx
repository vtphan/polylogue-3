import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Agent } from "@/lib/types";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";
import { IngestPanel } from "./ingest-panel";
import { DeleteActivityButton } from "./delete-activity-button";

export default async function ResearcherHome() {
  const activities = await prisma.activity.findMany({
    select: {
      id: true,
      scenarioId: true,
      type: true,
      topic: true,
      agents: true,
      flawIndex: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Count sessions per activity
  const sessionCounts = await prisma.session.groupBy({
    by: ["activityId"],
    _count: true,
  });
  const sessionCountMap = new Map(sessionCounts.map((s) => [s.activityId, s._count]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Activities</h1>
      <p className="text-sm text-gray-500 mb-6">
        All generated activities with full metadata access.
      </p>

      {/* Ingest panel — shows available registry scenarios */}
      <IngestPanel />

      <div className="space-y-4">
        {activities.length === 0 && (
          <p className="text-sm text-gray-400">No activities ingested yet. Use the panel above to ingest from the registry.</p>
        )}

        {activities.map((activity) => {
          const agents = activity.agents as unknown as Agent[];
          const flawIndex = (activity.flawIndex || []) as unknown as { flaw_type: string; severity: string }[];
          const metadata = activity.metadata as { scenario?: { notes?: string }; profiles?: unknown[] } | null;
          const sessions = sessionCountMap.get(activity.id) || 0;

          // Flaw distribution
          const flawsByType: Record<string, number> = {};
          const flawsBySeverity: Record<string, number> = {};
          for (const f of flawIndex) {
            flawsByType[f.flaw_type] = (flawsByType[f.flaw_type] || 0) + 1;
            flawsBySeverity[f.severity] = (flawsBySeverity[f.severity] || 0) + 1;
          }

          return (
            <div key={activity.id} className="relative">
              <Link
                href={`/researcher/activity/${activity.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      activity.type === "presentation"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sky-100 text-sky-700"
                    }`}>
                      {activity.type}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {activity.scenarioId}
                    </span>
                  </div>
                  <DeleteActivityButton activityId={activity.id} sessionCount={sessions} />
                </div>

                <h2 className="font-semibold text-gray-900 mb-2">{activity.topic}</h2>

                {/* Agents */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {agents.map((a) => (
                    <span key={a.agent_id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {a.name} — {a.role}
                    </span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{flawIndex.length} flaws</span>
                  <span>{agents.length} agents</span>
                  <span>{sessions} sessions</span>
                  {metadata?.profiles && (
                    <span>{(metadata.profiles as unknown[]).length} profiles</span>
                  )}
                </div>

                {/* Flaw distribution */}
                <div className="flex items-center gap-2 mt-2">
                  {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
                    const count = flawsByType[type] || 0;
                    if (count === 0) return null;
                    return (
                      <span key={type} className={`text-xs px-1.5 py-0.5 rounded ${FLAW_TYPES[type].bgColor} ${FLAW_TYPES[type].color}`}>
                        {FLAW_TYPES[type].label}: {count}
                      </span>
                    );
                  })}
                  <span className="text-xs text-gray-400 ml-1">
                    {flawsBySeverity["major"] || 0} major, {flawsBySeverity["moderate"] || 0} moderate, {flawsBySeverity["minor"] || 0} minor
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
