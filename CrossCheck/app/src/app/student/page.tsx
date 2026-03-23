import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Agent } from "@/lib/types";

export default async function StudentHome() {
  const activities = await prisma.activity.findMany({
    select: {
      id: true,
      scenarioId: true,
      type: true,
      topic: true,
      agents: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
      <p className="mt-1 text-sm text-gray-500">
        Read what the AI team presented or discussed, then find the flaws in their thinking.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {activities.map((activity) => {
          const agents = activity.agents as Agent[];
          return (
            <Link
              key={activity.id}
              href={`/student/activity/${activity.id}`}
              className="block p-5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    activity.type === "presentation"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {activity.type}
                </span>
              </div>
              <h2 className="font-semibold text-gray-900 leading-snug">
                {activity.topic}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agents.map((agent) => (
                  <span
                    key={agent.agent_id}
                    className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                  >
                    {agent.name}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
