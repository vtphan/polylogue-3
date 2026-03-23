import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { computeMatches } from "@/lib/matching";
import { FLAW_TYPES } from "@/lib/types";
import type { FlawType } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassViewPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/auth/login");
  }

  const { id } = await params;

  const classSession = await prisma.session.findUnique({
    where: { id },
    include: {
      activity: true,
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          annotations: {
            select: { id: true, flawType: true, location: true },
          },
        },
      },
    },
  });

  if (!classSession || classSession.teacherId !== session.user.id) {
    notFound();
  }

  const flawIndex = (classSession.activity.flawIndex || []) as {
    flaw_id: string;
    locations: string[];
    flaw_type: string;
    severity: string;
  }[];

  const evaluation = classSession.activity.evaluation as {
    flaws: {
      flaw_id: string;
      flaw_type: string;
      severity: string;
      description: string;
    }[];
  };

  // Compute matches for each group
  const groupResults = classSession.groups.map((group) => {
    const anns = group.annotations.map((a) => ({
      id: a.id,
      location: a.location as { item_id: string },
      flawType: a.flawType,
    }));
    const matches = computeMatches(anns, flawIndex);
    return { name: group.name, matches };
  });

  // Which flaws were found by how many groups
  const flawDiscovery = evaluation.flaws.map((flaw) => {
    const groupsFound = groupResults.filter((g) =>
      g.matches.flawMatches.some(
        (m) => m.flawId === flaw.flaw_id && m.category === "green"
      )
    );
    return {
      ...flaw,
      foundBy: groupsFound.length,
      totalGroups: groupResults.length,
      groupNames: groupsFound.map((g) => g.name),
    };
  });

  // Sort: most-missed first
  flawDiscovery.sort((a, b) => a.foundBy - b.foundBy);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Class Results</h1>
          <a
            href={`/teacher/sessions/${id}`}
            className="text-sm text-gray-400 hover:text-white"
          >
            Back to dashboard
          </a>
        </div>
        <p className="text-lg text-gray-400 mb-8">
          {classSession.activity.topic}
        </p>

        {/* Group comparison */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {groupResults.map((g) => (
            <div key={g.name} className="bg-gray-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold mb-3">{g.name}</h3>
              <div className="text-4xl font-bold text-green-400 mb-1">
                {Math.round(g.matches.summary.detectionRate * 100)}%
              </div>
              <div className="text-sm text-gray-400">
                {g.matches.summary.found} of {g.matches.summary.totalFlaws} flaws found
              </div>
              <div className="flex gap-2 mt-3">
                {(Object.keys(FLAW_TYPES) as FlawType[]).map((type) => {
                  const bt = g.matches.summary.byType[type];
                  if (!bt) return null;
                  return (
                    <span
                      key={type}
                      className="text-xs bg-gray-700 px-2 py-1 rounded"
                    >
                      {FLAW_TYPES[type].label}: {bt.found}/{bt.total}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Flaw-by-flaw breakdown */}
        <h2 className="text-xl font-bold mb-4">Flaw Breakdown</h2>
        <div className="space-y-3">
          {flawDiscovery.map((flaw) => {
            const ratio = flaw.totalGroups > 0 ? flaw.foundBy / flaw.totalGroups : 0;
            const barColor =
              ratio === 0
                ? "bg-red-500"
                : ratio < 0.5
                  ? "bg-yellow-500"
                  : "bg-green-500";
            const flawInfo = FLAW_TYPES[flaw.flaw_type as FlawType];

            return (
              <div key={flaw.flaw_id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${flawInfo?.bgColor} ${flawInfo?.color}`}>
                      {flawInfo?.label}
                    </span>
                    <span className="text-sm text-gray-300 capitalize">
                      {flaw.severity}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-gray-400">
                    {flaw.foundBy}/{flaw.totalGroups} groups
                  </span>
                </div>
                <p className="text-sm text-gray-200 mb-2">{flaw.description}</p>
                {/* Bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                {flaw.foundBy > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Found by: {flaw.groupNames.join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
