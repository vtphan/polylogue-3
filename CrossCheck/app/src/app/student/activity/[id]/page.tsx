import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ActivityViewer } from "./activity-viewer";
import type { Agent, PresentationTranscript, DiscussionTranscript, Annotation, AnnotationLocation } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/auth/login");
  }

  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
  });

  if (!activity) {
    notFound();
  }

  // Get existing annotations for this user and activity
  const existingAnnotations = await prisma.annotation.findMany({
    where: {
      userId: session.user.id,
      group: {
        name: `solo_${session.user.id}`,
        session: { activityId: id },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const annotations: Annotation[] = existingAnnotations.map((a) => ({
    id: a.id,
    location: a.location as AnnotationLocation,
    flawType: a.flawType as Annotation["flawType"],
    createdAt: a.createdAt.toISOString(),
  }));

  const transcript = activity.transcriptContent as unknown;
  const agents = activity.agents as Agent[];

  return (
    <div>
      <div className="mb-4">
        <a
          href="/student"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Back to activities
        </a>
      </div>

      <h1 className="text-xl font-bold text-gray-900 leading-snug">
        {activity.topic}
      </h1>
      <div className="flex items-center gap-2 mt-1.5 mb-6">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            activity.type === "presentation"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          {activity.type}
        </span>
        <span className="text-xs text-gray-400">
          {agents.map((a) => a.name).join(", ")}
        </span>
      </div>

      <ActivityViewer
        activityId={id}
        activityType={activity.type}
        transcript={transcript}
        agents={agents}
        initialAnnotations={annotations}
      />
    </div>
  );
}
