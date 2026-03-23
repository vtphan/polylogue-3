import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Agent } from "@/lib/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  individual: { label: "Individual Phase", color: "bg-blue-100 text-blue-700" },
  group: { label: "Group Phase", color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "Reviewing", color: "bg-purple-100 text-purple-700" },
};

export default async function StudentHome() {
  const session = await auth();
  if (!session?.user) return null;

  // Find sessions where this student is assigned (not solo sessions)
  const assignedSessions = await prisma.session.findMany({
    where: {
      status: { not: "closed" },
      groups: {
        some: {
          members: { some: { userId: session.user.id } },
          name: { not: { startsWith: "solo_" } },
        },
      },
    },
    include: {
      activity: { select: { id: true, topic: true, type: true, agents: true } },
      groups: {
        where: {
          members: { some: { userId: session.user.id } },
          name: { not: { startsWith: "solo_" } },
        },
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also show all activities for direct access (Phase 1 mode)
  const activities = await prisma.activity.findMany({
    select: { id: true, scenarioId: true, type: true, topic: true, agents: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Assigned sessions */}
      {assignedSessions.length > 0 && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Sessions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Activities assigned by your teacher.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {assignedSessions.map((s) => {
              const agents = s.activity.agents as Agent[];
              const statusInfo = STATUS_LABELS[s.status];
              return (
                <Link
                  key={s.id}
                  href={`/student/session/${s.id}`}
                  className="block p-5 bg-white rounded-lg border border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {statusInfo && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {s.groups[0]?.name}
                    </span>
                  </div>
                  <h2 className="font-semibold text-gray-900 leading-snug">
                    {s.activity.topic}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agents.map((agent) => (
                      <span key={agent.agent_id} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {agent.name}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All activities (direct access) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {assignedSessions.length > 0 ? "All Activities" : "Activities"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Browse and practice on your own.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {activities.map((activity) => {
            const agents = activity.agents as Agent[];
            return (
              <Link
                key={activity.id}
                href={`/student/activity/${activity.id}`}
                className="block p-5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    activity.type === "presentation"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700"
                  }`}>
                    {activity.type}
                  </span>
                </div>
                <h2 className="font-semibold text-gray-900 leading-snug">
                  {activity.topic}
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agents.map((agent) => (
                    <span key={agent.agent_id} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {agent.name}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
