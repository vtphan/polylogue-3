import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { computeMatches } from "@/lib/matching";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  complete: "bg-gray-100 text-gray-500",
};

export default async function ResearcherSessionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    redirect("/auth/login");
  }

  const sessions = await prisma.session.findMany({
    include: {
      teacher: { select: { displayName: true } },
      activity: {
        select: { topic: true, type: true, scenarioId: true, flawIndex: true },
      },
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          members: { select: { userId: true } },
          annotations: {
            select: { id: true, flawType: true, location: true },
          },
          scaffolds: {
            select: { id: true, level: true, type: true, createdAt: true, acknowledgedAt: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500">
            All sessions across all teachers. Student IDs are anonymized.
          </p>
        </div>
        <a
          href="/api/export/sessions"
          className="text-sm text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded"
        >
          Export CSV
        </a>
      </div>

      <div className="space-y-4">
        {sessions.map((s) => {
          const flawIndex = (s.activity.flawIndex || []) as {
            flaw_id: string; locations: string[]; flaw_type: string; severity: string;
          }[];

          return (
            <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[s.status] || ""}`}>
                  {s.status}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  s.activity.type === "presentation"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-sky-100 text-sky-700"
                }`}>
                  {s.activity.type}
                </span>
                <span className="text-xs text-gray-400">
                  by {s.teacher.displayName}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {s.createdAt.toISOString().slice(0, 10)}
                </span>
              </div>

              <h2 className="font-semibold text-gray-900 mb-3">{s.activity.topic}</h2>

              {/* Groups */}
              <div className="space-y-3">
                {s.groups.map((group) => {
                  const anns = group.annotations.map((a) => ({
                    id: a.id,
                    location: a.location as { item_id: string },
                    flawType: a.flawType,
                  }));
                  const matches = computeMatches(anns, flawIndex);
                  const totalScaffolds = group.scaffolds.length;
                  const acknowledgedScaffolds = group.scaffolds.filter((s) => s.acknowledgedAt).length;

                  return (
                    <div key={group.id} className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{group.name}</span>
                        <span className="text-xs text-gray-400">
                          {group.members.length} members (anonymized)
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{group.annotations.length} annotations</span>
                        <span className="text-green-600">
                          {matches.summary.found} found
                        </span>
                        <span className="text-yellow-600">
                          {matches.summary.missed} missed
                        </span>
                        <span className="text-red-600">
                          {matches.summary.falsePositives} FP
                        </span>
                        <span>
                          {Math.round(matches.summary.detectionRate * 100)}% detection
                        </span>
                        <span>
                          {totalScaffolds} scaffolds ({acknowledgedScaffolds} ack)
                        </span>
                      </div>

                      {/* By type */}
                      <div className="flex gap-2 mt-2">
                        {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
                          const bt = matches.summary.byType[type];
                          if (!bt) return null;
                          return (
                            <span key={type} className={`text-xs px-1.5 py-0.5 rounded ${FLAW_TYPES[type].bgColor} ${FLAW_TYPES[type].color}`}>
                              {FLAW_TYPES[type].label}: {bt.found}/{bt.total}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
