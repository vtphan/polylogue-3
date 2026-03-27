import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LearnMode } from "@/components/modes/learn-mode";

export default async function StandaloneLearnPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/auth/login");
  }

  // Find the student's most recent active session/group to save results there
  const activeGroup = await prisma.group.findFirst({
    where: {
      members: { some: { userId: session.user.id } },
      name: { not: { startsWith: "solo_" } },
      session: { status: "active" },
    },
    select: { id: true, sessionId: true },
    orderBy: { session: { createdAt: "desc" } },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Learn Flaw Types</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review the four flaw types and test your knowledge. You can revisit this page anytime.
        </p>
        {!activeGroup && (
          <p className="text-xs text-gray-400 mt-1">
            Your results will be saved when you join a session.
          </p>
        )}
      </div>
      <LearnMode
        groupId={activeGroup?.id ?? "standalone"}
        sessionId={activeGroup?.sessionId ?? "standalone"}
        flawIdPrefix="self-learn:"
      />
    </div>
  );
}
