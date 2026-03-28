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
  if (sessionId) {
    where.group = { sessionId, name: { not: { startsWith: "solo_" } } };
  } else {
    where.group = { name: { not: { startsWith: "solo_" } } };
  }

  // Only export annotations from consenting users (IRB/COPPA requirement)
  where.user = { researchConsent: true };

  const annotations = await prisma.annotation.findMany({
    where,
    include: {
      group: {
        select: {
          name: true,
          session: { select: { id: true, activityId: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows: string[] = [];
  rows.push([
    "annotation_id",
    "session_id",
    "group_name",
    "student_id",  // anonymized
    "item_id",
    "start_offset",
    "end_offset",
    "highlighted_text",
    "flaw_type",
    "hint_level",
    "created_at",
  ].join(","));

  for (const a of annotations) {
    const loc = a.location as { item_id: string; start_offset: number; end_offset: number; highlighted_text: string };
    // Anonymize: hash the user ID to a short string
    const anonId = `s_${a.userId.slice(0, 8)}`;
    const text = (loc.highlighted_text || "").replace(/[,"\n\r]/g, " ").slice(0, 200);

    rows.push([
      a.id,
      a.group.session.id,
      a.group.name,
      anonId,
      loc.item_id,
      loc.start_offset,
      loc.end_offset,
      `"${text}"`,
      a.flawType,
      a.hintLevel,
      a.createdAt.toISOString(),
    ].join(","));
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="crosscheck-annotations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
