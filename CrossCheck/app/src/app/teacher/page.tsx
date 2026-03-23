import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Agent } from "@/lib/types";

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  setup: { label: "Setup", color: "bg-gray-100 text-gray-600" },
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  individual: { label: "Individual", color: "bg-blue-100 text-blue-700" },
  group: { label: "Group", color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "Reviewing", color: "bg-purple-100 text-purple-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500" },
};

export default async function TeacherHome() {
  const session = await auth();
  if (!session?.user) return null;

  const sessions = await prisma.session.findMany({
    where: { teacherId: session.user.id },
    include: {
      activity: { select: { topic: true, type: true, agents: true } },
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          _count: { select: { annotations: true, members: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <Link
          href="/teacher/sessions/new"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500">No sessions yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const statusInfo = STATUS_BADGES[s.status] || STATUS_BADGES.setup;
            const agents = s.activity.agents as Agent[];
            const totalAnnotations = s.groups.reduce(
              (sum, g) => sum + g._count.annotations,
              0
            );
            const totalStudents = s.groups.reduce(
              (sum, g) => sum + g._count.members,
              0
            );

            return (
              <Link
                key={s.id}
                href={`/teacher/sessions/${s.id}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    s.activity.type === "presentation"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700"
                  }`}>
                    {s.activity.type}
                  </span>
                </div>
                <h2 className="font-semibold text-gray-900">{s.activity.topic}</h2>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{s.groups.length} groups</span>
                  <span>{totalStudents} students</span>
                  <span>{totalAnnotations} annotations</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
