import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { SessionActivityViewer } from "./session-activity-viewer";
import { FeedbackView } from "@/components/feedback/feedback-view";
import { computeMatches } from "@/lib/matching";
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
            include: {
              comments: {
                select: { id: true, text: true, isBonus: true },
              },
            },
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
  const agents = activity.agents as Agent[];
  const isReviewing = ["reviewing", "closed"].includes(classSession.status);

  // Filter annotations: in individual phase, show only own; in group/reviewing, show all
  const showAllAnnotations = ["group", "reviewing", "closed"].includes(classSession.status);

  const annotations: Annotation[] = group.annotations
    .filter((a) => showAllAnnotations || a.userId === session.user.id)
    .map((a) => ({
      id: a.id,
      location: a.location as AnnotationLocation,
      flawType: a.flawType as Annotation["flawType"],
      createdAt: a.createdAt.toISOString(),
      isGroupAnswer: a.isGroupAnswer,
      confirmedBy: (a.confirmedBy as string[]) || [],
      userId: a.userId,
      comments: (a as unknown as { comments?: { id: string; text: string; isBonus: boolean }[] }).comments || [],
    }));

  const pendingScaffolds = group.scaffolds.map((s) => ({
    id: s.id,
    text: s.text,
    level: s.level,
    type: s.type,
  }));

  const sessionConfig = classSession.config as { difficulty_mode?: string } | null;
  const difficultyMode = (sessionConfig?.difficulty_mode || "classify") as "spot" | "classify" | "full";

  // Compute feedback if in reviewing mode
  let matchResult = null;
  let evaluation = null;
  if (isReviewing) {
    const flawIndex = (activity.flawIndex || []) as {
      flaw_id: string;
      locations: string[];
      flaw_type: string;
      severity: string;
    }[];

    // Use group answers for matching if any exist, otherwise all annotations
    const hasGroupAnswers = annotations.some((a) => a.isGroupAnswer);
    const matchAnnotations = hasGroupAnswers
      ? annotations.filter((a) => a.isGroupAnswer)
      : annotations;

    matchResult = computeMatches(
      matchAnnotations.map((a) => ({
        id: a.id,
        location: { item_id: a.location.item_id },
        flawType: a.flawType,
      })),
      flawIndex,
      { spotMode: difficultyMode === "spot" }
    );

    evaluation = activity.evaluation as {
      flaws: {
        flaw_id: string;
        flaw_type: string;
        severity: string;
        description: string;
        evidence: string;
        explanation: string;
        location: { type: string; references: string[] };
      }[];
      summary: { total_flaws: number; key_patterns: string };
    };
  }

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
        {isReviewing && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
            Reviewing
          </span>
        )}
      </div>

      {isReviewing && matchResult && evaluation ? (
        <FeedbackView
          annotations={annotations}
          matchResult={matchResult}
          evaluation={evaluation}
          transcript={activity.transcriptContent as unknown}
          activityType={activity.type}
          agents={agents}
        />
      ) : (
        <SessionActivityViewer
          sessionId={id}
          groupId={group.id}
          activityId={activity.id}
          activityType={activity.type}
          transcript={activity.transcriptContent as unknown}
          agents={agents}
          initialAnnotations={annotations}
          pendingScaffolds={pendingScaffolds}
          readOnly={false}
          difficultyMode={difficultyMode}
          sessionPhase={classSession.status}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
