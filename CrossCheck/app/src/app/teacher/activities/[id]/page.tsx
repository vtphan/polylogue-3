import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ActivityPreview } from "./activity-preview";
import type { Agent } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherActivityPreviewPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/auth/login");
  }

  const { id } = await params;

  const activity = await prisma.activity.findUnique({
    where: { id },
  });

  if (!activity) notFound();

  return (
    <div>
      <a href="/teacher/sessions/new" className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Back to create session
      </a>
      <ActivityPreview activity={JSON.parse(JSON.stringify(activity))} />
    </div>
  );
}
