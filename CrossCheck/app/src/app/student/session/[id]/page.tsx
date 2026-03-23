import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { SessionActivityViewer } from "./session-activity-viewer";
import type { Agent, Annotation, AnnotationLocation } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentSessionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Find the session and the student's group
  const classSession = await prisma.session.findUnique({
    where: { id },
    include: {
      activity: true,
      groups: {
        where: {
          members: { some: { userId: session.user.id } },
          name: { not: { startsWith: "solo_" } },
        },
        include: {
          members: {
            include: { user: { select: { id: true, displayName: true } } },
          },
          annotations: {
            orderBy: { createdAt: "asc" },
          },
          scaffolds: {
            where: { acknowledgedAt: null },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!classSession || classSession.groups.length === 0) {
    notFound();
  }

  const group = classSession.groups[0];
  const activity = classSession.activity;

  // Filter annotations: in individual phase, show only own; in group phase, show all
  const showAllAnnotations = ["group", "reviewing", "closed"].includes(classSession.status);

  const annotations: Annotation[] = group.annotations
    .filter((a) => showAllAnnotations || a.userId === session.user.id)
    .map((a) => ({
      id: a.id,
      location: a.location as AnnotationLocation,
      flawType: a.flawType as Annotation["flawType"],
      createdAt: a.createdAt.toISOString(),
    }));

  const pendingScaffolds = group.scaffolds.map((s) => ({
    id: s.id,
    text: s.text,
    level: s.level,
    type: s.type,
  }));

  const agents = activity.agents as Agent[];
  const isReadOnly = ["reviewing", "closed"].includes(classSession.status);

  return (
    <div>
      <div className="mb-4">
        <a href="/student" className="text-sm text-blue-600 hover:text-blue-800">
          &larr; Back to activities
        </a>
      </div>

      {/* Session info */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
          {group.name}
        </span>
        <span className="text-xs text-gray-400">
          {group.members.map((m) => m.user.displayName).join(", ")}
        </span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 leading-snug">
        {activity.topic}
      </h1>
      <div className="flex items-center gap-2 mt-1.5 mb-6">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          activity.type === "presentation"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700"
        }`}>
          {activity.type}
        </span>
      </div>

      <SessionActivityViewer
        sessionId={id}
        groupId={group.id}
        activityId={activity.id}
        activityType={activity.type}
        transcript={activity.transcriptContent as unknown}
        agents={agents}
        initialAnnotations={annotations}
        pendingScaffolds={pendingScaffolds}
        readOnly={isReadOnly}
      />
    </div>
  );
}
