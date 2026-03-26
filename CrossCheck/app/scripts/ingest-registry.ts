/**
 * Ingest YAML files from the Polylogue 3 registry into the CrossCheck database.
 *
 * Usage:
 *   npx tsx scripts/ingest-registry.ts --scenario plastic-pollution-mississippi-river
 *   npx tsx scripts/ingest-registry.ts --all
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

// Paths relative to the Polylogue 3 project root (two levels up from CrossCheck/app/)
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const REGISTRY_DIR = path.join(PROJECT_ROOT, "registry");
const SCENARIOS_DIR = path.join(PROJECT_ROOT, "configs", "scenarios");
const PROFILES_DIR = path.join(PROJECT_ROOT, "configs", "profiles");

interface FlawIndexEntry {
  flaw_id: string;
  locations: string[];
  flaw_type: string;
  severity: string;
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

/**
 * Strip metadata from each section/turn to produce student-visible content.
 */
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

/**
 * Build a map from section/turn names to their IDs.
 * Evaluation files reference sections by name ("introduction"), but the transcript
 * uses section_id ("section_01"). This map lets us normalize.
 */
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

/**
 * Build the flaw index from evaluation data for annotation matching.
 * Normalizes location references to use section_id/turn_id (not section names).
 */
function buildFlawIndex(evaluation: Record<string, unknown>, locationMap: Map<string, string>): FlawIndexEntry[] {
  const flaws = (evaluation.flaws as Array<Record<string, unknown>>) || [];
  return flaws.map((flaw) => {
    const location = flaw.location as Record<string, unknown>;
    const rawRefs = (location?.references as string[]) || [];
    // Normalize: if a reference is a section name, map it to the section_id
    const normalizedRefs = rawRefs.map((ref) => locationMap.get(ref) || ref);
    return {
      flaw_id: flaw.flaw_id as string,
      locations: normalizedRefs,
      flaw_type: flaw.flaw_type as string,
      severity: flaw.severity as string,
    };
  });
}

/**
 * Read all agent profile YAMLs for a scenario.
 */
function readProfiles(scenarioId: string): unknown[] {
  const profileDir = path.join(PROFILES_DIR, scenarioId);
  if (!fs.existsSync(profileDir)) {
    console.warn(`  Warning: No profiles directory found at ${profileDir}`);
    return [];
  }

  const files = fs.readdirSync(profileDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  return files.map((f) => readYaml(path.join(profileDir, f)));
}

async function ingestScenario(scenarioId: string): Promise<void> {
  console.log(`\nIngesting scenario: ${scenarioId}`);

  const registryDir = path.join(REGISTRY_DIR, scenarioId);
  if (!fs.existsSync(registryDir)) {
    console.error(`  Error: Registry directory not found: ${registryDir}`);
    return;
  }

  // 1. Read config to determine activity type
  const config = readYamlIfExists(path.join(registryDir, "config.yaml")) as Record<string, unknown> | null;
  if (!config) {
    console.error(`  Error: No config.yaml found in ${registryDir}`);
    return;
  }

  const activityType = config.activity as string;
  console.log(`  Activity type: ${activityType}`);

  // 2. Read transcript
  const transcriptFile = activityType === "presentation" ? "presentation.yaml" : "discussion.yaml";
  const transcript = readYamlIfExists(path.join(registryDir, transcriptFile)) as Record<string, unknown> | null;
  if (!transcript) {
    console.error(`  Error: No ${transcriptFile} found`);
    return;
  }

  const topic = transcript.topic as string;
  const agents = transcript.agents as unknown[];
  const itemKey = activityType === "presentation" ? "sections" : "turns";
  const itemCount = Array.isArray(transcript[itemKey]) ? (transcript[itemKey] as unknown[]).length : 0;
  console.log(`  Topic: ${topic}`);
  console.log(`  Agents: ${agents.length}`);
  console.log(`  ${itemKey}: ${itemCount}`);

  // 3. Build content-only transcript (metadata stripped)
  const transcriptContent = stripMetadata(transcript, activityType);

  // 4. Read evaluation
  const evalFile = activityType === "presentation" ? "presentation_evaluation.yaml" : "discussion_evaluation.yaml";
  const evaluation = readYamlIfExists(path.join(registryDir, evalFile)) as Record<string, unknown> | null;
  if (!evaluation) {
    console.error(`  Error: No ${evalFile} found`);
    return;
  }

  // 5. Build flaw index (with location normalization)
  const locationMap = buildLocationMap(transcript, activityType);
  const flawIndex = buildFlawIndex(evaluation, locationMap);
  console.log(`  Flaws indexed: ${flawIndex.length}`);

  // 5b. Normalize evaluation location references to use section_id/turn_id
  const evalFlaws = (evaluation.flaws as Array<Record<string, unknown>>) || [];
  for (const flaw of evalFlaws) {
    const loc = flaw.location as Record<string, unknown>;
    if (loc?.references && Array.isArray(loc.references)) {
      loc.references = (loc.references as string[]).map((ref) => locationMap.get(ref) || ref);
    }
  }

  // 6. Read scenario YAML
  const scenarioYaml = readYamlIfExists(path.join(SCENARIOS_DIR, `${scenarioId}.yaml`));

  // 7. Read agent profiles
  const profiles = readProfiles(scenarioId);
  console.log(`  Profiles loaded: ${profiles.length}`);

  // 8. Combine into metadata
  const metadata = {
    scenario: scenarioYaml,
    profiles: profiles,
  };

  // 9. Upsert into database
  await prisma.activity.upsert({
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
  });

  console.log(`  Upserted into activities table.`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let scenarioIds: string[] = [];

  if (args.includes("--all")) {
    // Find all directories in registry/
    if (!fs.existsSync(REGISTRY_DIR)) {
      console.error(`Registry directory not found: ${REGISTRY_DIR}`);
      process.exit(1);
    }
    scenarioIds = fs
      .readdirSync(REGISTRY_DIR)
      .filter((f) => fs.statSync(path.join(REGISTRY_DIR, f)).isDirectory());
  } else {
    const scenarioIdx = args.indexOf("--scenario");
    if (scenarioIdx === -1 || !args[scenarioIdx + 1]) {
      console.error("Usage:");
      console.error("  npx tsx scripts/ingest-registry.ts --scenario <scenario-id>");
      console.error("  npx tsx scripts/ingest-registry.ts --all");
      process.exit(1);
    }
    scenarioIds = [args[scenarioIdx + 1]];
  }

  console.log(`Found ${scenarioIds.length} scenario(s) to ingest: ${scenarioIds.join(", ")}`);

  for (const id of scenarioIds) {
    await ingestScenario(id);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
