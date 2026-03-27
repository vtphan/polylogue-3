import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Agent } from "@/lib/types";

interface EvalSummary {
  total_flaws?: number;
  by_type?: Record<string, number>;
  by_severity?: Record<string, number>;
}

export default async function TeacherActivitiesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/auth/login");
  }

  const activities = await prisma.activity.findMany({
    select: { id: true, type: true, topic: true, agents: true, evaluation: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activities</h1>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">No activities available yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const agents = (activity.agents as unknown as Agent[]) || [];
            const evaluation = activity.evaluation as { summary?: EvalSummary } | null;
            const summary = evaluation?.summary;
            const total = summary?.total_flaws ?? 0;
            const major = summary?.by_severity?.major ?? 0;
            const moderate = summary?.by_severity?.moderate ?? 0;
            const minor = summary?.by_severity?.minor ?? 0;

            return (
              <Link
                key={activity.id}
                href={`/teacher/activities/${activity.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    activity.type === "presentation"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700"
                  }`}>
                    {activity.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {agents.length} agents
                  </span>
                </div>

                <h2 className="font-medium text-gray-900 mb-3 line-clamp-2">
                  {activity.topic}
                </h2>

                {total > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">{total} flaws</span>
                    <span>&middot;</span>
                    {major > 0 && <span className="text-red-600">{major} major</span>}
                    {moderate > 0 && <span className="text-amber-600">{moderate} moderate</span>}
                    {minor > 0 && <span className="text-gray-500">{minor} minor</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
