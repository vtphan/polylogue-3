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
import { PrismaClient } from "../src/generated/prisma/client";
import { ingestScenario, type IngestPaths } from "../src/lib/ingest";

const prisma = new PrismaClient();

// Paths relative to the Polylogue 3 project root (two levels up from CrossCheck/app/)
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const paths: IngestPaths = {
  registryDir: path.join(PROJECT_ROOT, "registry"),
  scenariosDir: path.join(PROJECT_ROOT, "configs", "scenarios"),
  profilesDir: path.join(PROJECT_ROOT, "configs", "profiles"),
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let scenarioIds: string[] = [];

  if (args.includes("--all")) {
    if (!fs.existsSync(paths.registryDir)) {
      console.error(`Registry directory not found: ${paths.registryDir}`);
      process.exit(1);
    }
    scenarioIds = fs
      .readdirSync(paths.registryDir)
      .filter((f) => fs.statSync(path.join(paths.registryDir, f)).isDirectory());
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
    console.log(`\nIngesting scenario: ${id}`);
    try {
      const result = await ingestScenario(prisma, id, paths);
      console.log(`  Upserted: ${result.topic} (${result.type})`);
    } catch (err) {
      console.error(`  Error: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
