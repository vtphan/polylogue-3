import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/export/hints — Export hint usage data as CSV (researcher only).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");

  const where: Record<string, unknown> = {};
  if (sessionId) where.sessionId = sessionId;

  // Only export from consenting users
  where.student = { researchConsent: true };

  const hints = await prisma.hintUsage.findMany({
    where,
    include: {
      group: { select: { name: true } },
      session: { select: { activityId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[] = [];
  rows.push([
    "hint_id",
    "session_id",
    "group_name",
    "student_id",
    "turn_id",
    "flaw_id",
    "hint_level",
    "stage",
    "target_section",
    "created_at",
  ].join(","));

  for (const h of hints) {
    const anonId = `s_${h.studentId.slice(0, 8)}`;
    rows.push([
      h.id,
      h.sessionId,
      h.group.name,
      anonId,
      h.turnId,
      h.flawId || "",
      h.hintLevel,
      h.stage,
      h.targetSection || "",
      h.createdAt.toISOString(),
    ].join(","));
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="crosscheck-hints-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
