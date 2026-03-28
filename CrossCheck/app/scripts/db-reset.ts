/**
 * Reset the database to a clean state with seed data.
 *
 * Usage: npx tsx scripts/db-reset.ts
 *    or: npm run db:reset
 *
 * This will:
 * 1. Drop and recreate all tables (migrate reset)
 * 2. Create teacher/researcher accounts from seed.yaml
 * 3. Ingest all registry activities
 */

import { execSync } from "child_process";
import { resolve } from "path";

const root = resolve(__dirname, "..");

function run(cmd: string, label: string) {
  console.log(`\n→ ${label}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

async function main() {
  run(
    `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="reset" npx prisma migrate reset --force`,
    "Resetting database",
  );

  run("npx prisma generate", "Generating Prisma client");
  run("npx tsx scripts/seed-users.ts", "Seeding users from seed.yaml");
  run("npx tsx scripts/ingest-registry.ts --all", "Ingesting registry activities");

  console.log("\n✓ Database reset complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
