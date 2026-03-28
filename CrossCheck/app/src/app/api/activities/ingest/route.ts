import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listRegistryScenarios, ingestScenario, getIngestPaths } from "@/lib/ingest";

/**
 * GET /api/activities/ingest — List available and ingested scenarios.
 * Query: ?registryPath=/absolute/path/to/registry (optional, defaults to project registry/)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const registryPath = request.nextUrl.searchParams.get("registryPath") || undefined;
  const paths = getIngestPaths(registryPath);
  const registryScenarios = listRegistryScenarios(paths);

  // Get already-ingested scenario IDs
  const ingested = await prisma.activity.findMany({
    select: { scenarioId: true, topic: true, type: true, id: true },
  });
  const ingestedIds = new Set(ingested.map((a) => a.scenarioId));

  // Count sessions per activity
  const sessionCounts = await prisma.session.groupBy({
    by: ["activityId"],
    _count: true,
  });
  const sessionCountMap = new Map(sessionCounts.map((s) => [s.activityId, s._count]));

  const available = registryScenarios
    .filter((s) => !ingestedIds.has(s.scenarioId))
    .map((s) => ({
      scenarioId: s.scenarioId,
      topic: s.topic,
      type: s.type,
      agentCount: s.agentCount,
    }));

  const ingestedList = ingested.map((a) => ({
    id: a.id,
    scenarioId: a.scenarioId,
    topic: a.topic,
    type: a.type,
    sessionCount: sessionCountMap.get(a.id) || 0,
  }));

  return NextResponse.json({ available, ingested: ingestedList, registryPath: paths.registryDir });
}

/**
 * POST /api/activities/ingest — Ingest a scenario from registry.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "researcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { scenarioId, registryPath } = body as { scenarioId?: string; registryPath?: string };

  if (!scenarioId) {
    return NextResponse.json({ error: "scenarioId required" }, { status: 400 });
  }

  const paths = getIngestPaths(registryPath);

  try {
    const activity = await ingestScenario(prisma, scenarioId, paths);
    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
