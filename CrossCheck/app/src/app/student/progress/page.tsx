import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { computeMatches } from "@/lib/matching";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";

export default async function StudentProgressPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/auth/login");
  }

  // Find all sessions this student participated in (non-solo, reviewing or closed)
  const sessions = await prisma.session.findMany({
    where: {
      status: { in: ["reviewing", "closed"] },
      groups: {
        some: {
          members: { some: { userId: session.user.id } },
          name: { not: { startsWith: "solo_" } },
        },
      },
    },
    include: {
      activity: {
        select: { topic: true, type: true, flawIndex: true },
      },
      groups: {
        where: {
          members: { some: { userId: session.user.id } },
          name: { not: { startsWith: "solo_" } },
        },
        include: {
          annotations: {
            select: { id: true, flawType: true, location: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Compute match results per session
  const sessionResults = sessions.map((s) => {
    const flawIndex = (s.activity.flawIndex || []) as {
      flaw_id: string; locations: string[]; flaw_type: string; severity: string;
    }[];
    const group = s.groups[0];
    const anns = group?.annotations.map((a) => ({
      id: a.id,
      location: a.location as { item_id: string },
      flawType: a.flawType,
    })) || [];
    const matches = computeMatches(anns, flawIndex);

    return {
      id: s.id,
      topic: s.activity.topic,
      type: s.activity.type,
      date: s.createdAt.toISOString().slice(0, 10),
      matches,
    };
  });

  // Compute aggregates
  const totalSessions = sessionResults.length;
  const avgDetectionRate = totalSessions > 0
    ? sessionResults.reduce((sum, r) => sum + r.matches.summary.detectionRate, 0) / totalSessions
    : 0;

  // By flaw type across all sessions
  const typeAggregates: Record<string, { found: number; total: number }> = {};
  for (const r of sessionResults) {
    for (const [type, { found, total }] of Object.entries(r.matches.summary.byType)) {
      if (!typeAggregates[type]) typeAggregates[type] = { found: 0, total: 0 };
      typeAggregates[type].found += found;
      typeAggregates[type].total += total;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Progress</h1>
      <p className="text-sm text-gray-500 mb-6">
        How you&apos;ve done across completed sessions.
      </p>

      {totalSessions === 0 ? (
        <p className="text-gray-500">No completed sessions yet. Your results will appear here after your teacher releases the evaluation.</p>
      ) : (
        <>
          {/* Overall stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{totalSessions}</div>
              <div className="text-xs text-gray-500">Sessions completed</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(avgDetectionRate * 100)}%
              </div>
              <div className="text-xs text-gray-500">Average detection rate</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center col-span-2 sm:col-span-1">
              <div className="text-3xl font-bold text-green-600">
                {sessionResults.reduce((sum, r) => sum + r.matches.summary.found, 0)}
              </div>
              <div className="text-xs text-gray-500">Total flaws found</div>
            </div>
          </div>

          {/* By flaw type */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 mb-8">
            <h2 className="font-semibold text-gray-900 mb-3">By Flaw Type</h2>
            <div className="space-y-3">
              {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
                const agg = typeAggregates[type];
                if (!agg || agg.total === 0) return null;
                const rate = agg.found / agg.total;
                const info = FLAW_TYPES[type];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${info.bgColor} ${info.color}`}>
                        {info.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {agg.found} / {agg.total} ({Math.round(rate * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${rate * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session history */}
          <h2 className="font-semibold text-gray-900 mb-3">Session History</h2>
          <div className="space-y-3">
            {sessionResults.map((r) => (
              <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      r.type === "presentation"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-sky-100 text-sky-700"
                    }`}>
                      {r.type}
                    </span>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(r.matches.summary.detectionRate * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2 line-clamp-1">{r.topic}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="text-green-600">{r.matches.summary.found} found</span>
                  <span className="text-yellow-600">{r.matches.summary.missed} missed</span>
                  <span className="text-red-600">{r.matches.summary.falsePositives} FP</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
