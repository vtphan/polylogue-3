import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeMatches } from "@/lib/matching";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await prisma.session.findMany({
    include: {
      activity: { select: { scenarioId: true, type: true, topic: true, flawIndex: true } },
      groups: {
        where: { name: { not: { startsWith: "solo_" } } },
        include: {
          members: {
            where: { user: { researchConsent: true } },
            select: { userId: true },
          },
          annotations: {
            where: { user: { researchConsent: true } },
            select: { id: true, flawType: true, location: true, userId: true, createdAt: true },
          },
          scaffolds: {
            select: { id: true, level: true, type: true, text: true, createdAt: true, acknowledgedAt: true, contextAtSend: true },
          },
          flawResponses: {
            select: { coins: true },
          },
          explanations: {
            select: { coins: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV rows
  const rows: string[] = [];
  rows.push([
    "session_id",
    "session_status",
    "scenario_id",
    "activity_type",
    "group_name",
    "group_members",
    "total_annotations",
    "flaws_found",
    "flaws_missed",
    "false_positives",
    "partial_matches",
    "detection_rate",
    "precision",
    "total_scaffolds",
    "scaffolds_acknowledged",
    "coins",
    "created_at",
  ].join(","));

  for (const s of sessions) {
    const flawIndex = (s.activity.flawIndex || []) as {
      flaw_id: string; locations: string[]; flaw_type: string; severity: string;
    }[];

    for (const group of s.groups) {
      const anns = group.annotations.map((a) => ({
        id: a.id,
        location: a.location as { item_id: string },
        flawType: a.flawType,
      }));
      const matches = computeMatches(anns, flawIndex);
      const ackCount = group.scaffolds.filter((sc) => sc.acknowledgedAt).length;
      const totalCoins = group.flawResponses.reduce((sum, r) => sum + r.coins, 0)
        + group.explanations.reduce((sum, e) => sum + e.coins, 0);

      rows.push([
        s.id,
        s.status,
        s.activity.scenarioId,
        s.activity.type,
        group.name,
        group.members.length,
        group.annotations.length,
        matches.summary.found,
        matches.summary.missed,
        matches.summary.falsePositives,
        matches.summary.partial,
        matches.summary.detectionRate.toFixed(3),
        matches.summary.precision.toFixed(3),
        group.scaffolds.length,
        ackCount,
        totalCoins,
        s.createdAt.toISOString(),
      ].join(","));
    }
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="crosscheck-sessions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
