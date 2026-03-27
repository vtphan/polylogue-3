import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  complete: { label: "Complete", color: "bg-gray-100 text-gray-500" },
};

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/auth/login");
  }

  const { classId } = await params;

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: session.user.id },
    include: {
      students: {
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { user: { displayName: "asc" } },
      },
      sessions: {
        include: {
          activity: { select: { topic: true, type: true } },
          groups: {
            where: { name: { not: { startsWith: "solo_" } } },
            include: { _count: { select: { members: true, annotations: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) notFound();

  return (
    <div>
      <a href="/teacher" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to classes
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">{cls.name}</h1>

      {/* Roster */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            Students ({cls.students.length})
          </h2>
          <Link
            href={`/teacher/classes/${classId}/students/add`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Add students
          </Link>
        </div>
        {cls.students.length === 0 ? (
          <p className="text-sm text-gray-400">
            No students yet.{" "}
            <Link href={`/teacher/classes/${classId}/students/add`} className="text-blue-600 hover:text-blue-800">
              Add some
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cls.students.map((cs) => (
              <span
                key={cs.userId}
                className="text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-full px-3 py-1"
              >
                {cs.user.displayName}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            Sessions ({cls.sessions.length})
          </h2>
          <Link
            href={`/teacher/classes/${classId}/sessions/new`}
            className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          >
            New Session
          </Link>
        </div>
        {cls.sessions.length === 0 ? (
          <p className="text-sm text-gray-400">No sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {cls.sessions.map((s) => {
              const statusInfo = STATUS_BADGES[s.status] || STATUS_BADGES.active;
              const totalStudents = s.groups.reduce((sum, g) => sum + g._count.members, 0);
              const totalAnnotations = s.groups.reduce((sum, g) => sum + g._count.annotations, 0);

              return (
                <Link
                  key={s.id}
                  href={`/teacher/sessions/${s.id}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
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
                  <h3 className="font-medium text-gray-900">{s.activity.topic}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>{s.groups.length} groups</span>
                    <span>{totalStudents} students</span>
                    <span>{totalAnnotations} annotations</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
