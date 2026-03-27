import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { CreateSessionForm } from "@/app/teacher/sessions/new/create-session-form";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function NewClassSessionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/auth/login");
  }

  const { classId } = await params;

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    include: {
      students: {
        include: { user: { select: { id: true, displayName: true, username: true } } },
        orderBy: { user: { displayName: "asc" } },
      },
    },
  });

  if (!cls) notFound();

  const activities = await prisma.activity.findMany({
    select: { id: true, scenarioId: true, type: true, topic: true, agents: true },
    orderBy: { createdAt: "desc" },
  });

  const students = cls.students.map((cs) => cs.user);

  return (
    <div>
      <a
        href={`/teacher/classes/${classId}`}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to {cls.name}
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
        New Session — {cls.name}
      </h1>
      <CreateSessionForm activities={activities} students={students} classId={classId} />
    </div>
  );
}
