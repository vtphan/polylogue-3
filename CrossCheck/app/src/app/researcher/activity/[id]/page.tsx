import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PipelineView } from "./pipeline-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResearcherActivityPage({ params }: PageProps) {
  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
  });

  if (!activity) notFound();

  return (
    <div>
      <a href="/researcher" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to activities
      </a>
      <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">
        {activity.topic}
      </h1>
      <div className="flex items-center gap-2 mb-6">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          activity.type === "presentation"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700"
        }`}>
          {activity.type}
        </span>
        <span className="text-xs text-gray-400 font-mono">{activity.scenarioId}</span>
      </div>

      <PipelineView activity={JSON.parse(JSON.stringify(activity))} />
    </div>
  );
}
