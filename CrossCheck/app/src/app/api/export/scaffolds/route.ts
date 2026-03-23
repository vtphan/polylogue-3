import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");

  const where: Record<string, unknown> = {};
  if (sessionId) where.sessionId = sessionId;

  const scaffolds = await prisma.scaffold.findMany({
    where,
    include: {
      group: { select: { name: true } },
      session: { select: { activityId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[] = [];
  rows.push([
    "scaffold_id",
    "session_id",
    "group_name",
    "level",
    "type",
    "text",
    "annotations_at_send",
    "sections_touched_at_send",
    "time_in_session_min",
    "created_at",
    "acknowledged_at",
  ].join(","));

  for (const s of scaffolds) {
    const ctx = s.contextAtSend as {
      annotations_count?: number;
      sections_touched?: string[];
      time_in_session_minutes?: number;
    } | null;
    const text = (s.text || "").replace(/[,"\n\r]/g, " ").slice(0, 300);

    rows.push([
      s.id,
      s.sessionId,
      s.group.name,
      s.level,
      s.type,
      `"${text}"`,
      ctx?.annotations_count ?? "",
      ctx?.sections_touched?.length ?? "",
      ctx?.time_in_session_minutes ?? "",
      s.createdAt.toISOString(),
      s.acknowledgedAt?.toISOString() || "",
    ].join(","));
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="crosscheck-scaffolds-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
