/**
 * Shared ingest logic for importing Polylogue 3 registry scenarios into the Activity table.
 *
 * Used by both scripts/ingest-registry.ts (CLI) and /api/activities/ingest (API).
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { PrismaClient } from "../generated/prisma/client";

export interface FlawIndexEntry {
  flaw_id: string;
  locations: string[];
  flaw_type: string;
  severity: string;
}

export interface IngestPaths {
  registryDir: string;
  scenariosDir: string;
  profilesDir: string;
}

export interface ScenarioInfo {
  scenarioId: string;
  topic: string;
  type: "presentation" | "discussion";
  agentCount: number;
}

function readYaml(filePath: string): unknown {
  const content = fs.readFileSync(filePath, "utf-8");
  return yaml.load(content);
}

function readYamlIfExists(filePath: string): unknown | null {
  if (fs.existsSync(filePath)) {
    return readYaml(filePath);
  }
  return null;
}

function stripMetadata(transcript: Record<string, unknown>, activityType: string): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(transcript));
  const items = activityType === "presentation" ? clone.sections : clone.turns;
  if (Array.isArray(items)) {
    for (const item of items) {
      delete item.metadata;
    }
  }
  return clone;
}

function buildLocationMap(transcript: Record<string, unknown>, activityType: string): Map<string, string> {
  const map = new Map<string, string>();
  const items = (activityType === "presentation" ? transcript.sections : transcript.turns) as Array<Record<string, string>> | undefined;
  if (!items) return map;

  for (const item of items) {
    const id = activityType === "presentation" ? item.section_id : item.turn_id;
    const name = activityType === "presentation" ? item.section : item.stage;
    if (id && name && name !== id) {
      map.set(name, id);
    }
  }
  return map;
}

function buildFlawIndex(evaluation: Record<string, unknown>, locationMap: Map<string, string>): FlawIndexEntry[] {
  const flaws = (evaluation.flaws as Array<Record<string, unknown>>) || [];
  return flaws.map((flaw) => {
    const location = flaw.location as Record<string, unknown>;
    const rawRefs = (location?.references as string[]) || [];
    const normalizedRefs = rawRefs.map((ref) => locationMap.get(ref) || ref);
    return {
      flaw_id: flaw.flaw_id as string,
      locations: normalizedRefs,
      flaw_type: flaw.flaw_type as string,
      severity: flaw.severity as string,
    };
  });
}

function readProfiles(profilesDir: string, scenarioId: string): unknown[] {
  const profileDir = path.join(profilesDir, scenarioId);
  if (!fs.existsSync(profileDir)) return [];
  const files = fs.readdirSync(profileDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  return files.map((f) => readYaml(path.join(profileDir, f)));
}

/**
 * List all scenarios in the registry directory with basic info.
 */
export function listRegistryScenarios(paths: IngestPaths): ScenarioInfo[] {
  if (!fs.existsSync(paths.registryDir)) return [];

  const dirs = fs.readdirSync(paths.registryDir)
    .filter((f) => fs.statSync(path.join(paths.registryDir, f)).isDirectory());

  const results: ScenarioInfo[] = [];
  for (const dir of dirs) {
    const configPath = path.join(paths.registryDir, dir, "config.yaml");
    if (!fs.existsSync(configPath)) continue;

    const config = readYaml(configPath) as Record<string, unknown>;
    const activityType = config.activity as string;
    const transcriptFile = activityType === "presentation" ? "presentation.yaml" : "discussion.yaml";
    const transcriptPath = path.join(paths.registryDir, dir, transcriptFile);

    let topic = config.topic as string || dir;
    let agentCount = 0;

    if (fs.existsSync(transcriptPath)) {
      const transcript = readYaml(transcriptPath) as Record<string, unknown>;
      topic = (transcript.topic as string) || topic;
      agentCount = Array.isArray(transcript.agents) ? transcript.agents.length : 0;
    }

    results.push({
      scenarioId: dir,
      topic,
      type: activityType as "presentation" | "discussion",
      agentCount,
    });
  }

  return results;
}

/**
 * Ingest a single scenario from the registry into the database.
 */
export async function ingestScenario(
  prisma: PrismaClient,
  scenarioId: string,
  paths: IngestPaths
): Promise<{ id: string; scenarioId: string; topic: string; type: string }> {
  const registryDir = path.join(paths.registryDir, scenarioId);
  if (!fs.existsSync(registryDir)) {
    throw new Error(`Registry directory not found: ${registryDir}`);
  }

  // 1. Read config
  const config = readYamlIfExists(path.join(registryDir, "config.yaml")) as Record<string, unknown> | null;
  if (!config) throw new Error(`No config.yaml found for ${scenarioId}`);

  const activityType = config.activity as string;

  // 2. Read transcript
  const transcriptFile = activityType === "presentation" ? "presentation.yaml" : "discussion.yaml";
  const transcript = readYamlIfExists(path.join(registryDir, transcriptFile)) as Record<string, unknown> | null;
  if (!transcript) throw new Error(`No ${transcriptFile} found for ${scenarioId}`);

  const topic = transcript.topic as string;
  const agents = transcript.agents as unknown[];

  // 3. Strip metadata for student view
  const transcriptContent = stripMetadata(transcript, activityType);

  // 4. Read evaluation
  const evalFile = activityType === "presentation" ? "presentation_evaluation.yaml" : "discussion_evaluation.yaml";
  const evaluation = readYamlIfExists(path.join(registryDir, evalFile)) as Record<string, unknown> | null;
  if (!evaluation) throw new Error(`No ${evalFile} found for ${scenarioId}`);

  // 5. Build flaw index
  const locationMap = buildLocationMap(transcript, activityType);
  const flawIndex = buildFlawIndex(evaluation, locationMap);

  // 5b. Normalize evaluation location references
  const evalFlaws = (evaluation.flaws as Array<Record<string, unknown>>) || [];
  for (const flaw of evalFlaws) {
    const loc = flaw.location as Record<string, unknown>;
    if (loc?.references && Array.isArray(loc.references)) {
      loc.references = (loc.references as string[]).map((ref) => locationMap.get(ref) || ref);
    }
  }

  // 6. Read scenario YAML and profiles
  const scenarioYaml = readYamlIfExists(path.join(paths.scenariosDir, `${scenarioId}.yaml`));
  const profiles = readProfiles(paths.profilesDir, scenarioId);

  const metadata = { scenario: scenarioYaml, profiles };

  // 7. Upsert
  const activity = await prisma.activity.upsert({
    where: { scenarioId },
    create: {
      scenarioId,
      type: activityType as "presentation" | "discussion",
      topic,
      agents: agents as object,
      transcript: transcript as object,
      transcriptContent: transcriptContent as object,
      evaluation: evaluation as object,
      flawIndex: flawIndex as object,
      metadata: metadata as object,
    },
    update: {
      type: activityType as "presentation" | "discussion",
      topic,
      agents: agents as object,
      transcript: transcript as object,
      transcriptContent: transcriptContent as object,
      evaluation: evaluation as object,
      flawIndex: flawIndex as object,
      metadata: metadata as object,
    },
    select: { id: true, scenarioId: true, topic: true, type: true },
  });

  return activity;
}

/**
 * Get the standard ingest paths relative to the CrossCheck app directory.
 * If registryDir is provided, uses it directly (absolute path).
 * scenariosDir and profilesDir are derived from the project root unless registryDir is custom.
 */
function validateRegistryPath(resolvedPath: string, projectRoot: string): void {
  const normalizedPath = path.resolve(resolvedPath);
  const normalizedRoot = path.resolve(projectRoot);
  if (!normalizedPath.startsWith(normalizedRoot + path.sep) && normalizedPath !== normalizedRoot) {
    throw new Error(
      `Registry path must be within the project root: ${normalizedRoot}`
    );
  }
  // Check symlinks that escape the project root
  try {
    const realPath = fs.realpathSync(normalizedPath);
    if (!realPath.startsWith(normalizedRoot + path.sep) && realPath !== normalizedRoot) {
      throw new Error(
        `Registry path resolves via symlink outside the project root: ${normalizedRoot}`
      );
    }
  } catch (err: unknown) {
    // Path doesn't exist yet — ingestScenario checks existence later
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export function getIngestPaths(registryDir?: string): IngestPaths {
  const appRoot = process.cwd();
  const projectRoot = path.resolve(appRoot, "..", "..");

  if (registryDir) {
    // Custom registry path — resolve relative to app root if not absolute
    const resolvedRegistry = path.isAbsolute(registryDir)
      ? registryDir
      : path.resolve(appRoot, registryDir);
    validateRegistryPath(resolvedRegistry, projectRoot);
    return {
      registryDir: resolvedRegistry,
      scenariosDir: path.join(projectRoot, "configs", "scenarios"),
      profilesDir: path.join(projectRoot, "configs", "profiles"),
    };
  }

  return {
    registryDir: path.join(projectRoot, "registry"),
    scenariosDir: path.join(projectRoot, "configs", "scenarios"),
    profilesDir: path.join(projectRoot, "configs", "profiles"),
  };
}
