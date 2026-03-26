import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { SessionDashboard } from "./session-dashboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: PageProps) {
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
          members: {
            include: { user: { select: { id: true, displayName: true } } },
          },
          annotations: {
            select: {
              id: true,
              flawType: true,
              location: true,
              userId: true,
              createdAt: true,
              hinted: true,
              isGroupAnswer: true,
              comments: {
                select: { id: true, text: true, isBonus: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          scaffolds: {
            select: {
              id: true,
              level: true,
              type: true,
              text: true,
              createdAt: true,
              acknowledgedAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          flawResponses: {
            select: {
              id: true,
              userId: true,
              flawId: true,
              typeAnswer: true,
              typeCorrect: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!classSession || classSession.teacherId !== session.user.id) {
    notFound();
  }

  return (
    <div>
      <a href="/teacher" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to sessions
      </a>
      <SessionDashboard session={JSON.parse(JSON.stringify(classSession))} />
    </div>
  );
}
