import { prisma } from "@/lib/db";
import { CreateSessionForm } from "./create-session-form";

export default async function NewSessionPage() {
  const activities = await prisma.activity.findMany({
    select: { id: true, scenarioId: true, type: true, topic: true, agents: true },
    orderBy: { createdAt: "desc" },
  });

  const students = await prisma.user.findMany({
    where: { role: "student" },
    select: { id: true, displayName: true, username: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <div>
      <a href="/teacher" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to sessions
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
        Create Session
      </h1>
      <CreateSessionForm activities={activities} students={students} />
    </div>
  );
}
