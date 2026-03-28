/**
 * Migration script: classify → locate
 *
 * Migrates existing sessions with classify mode to locate mode.
 * Also strips knob keys from group.config, keeping only difficulty_mode.
 *
 * Run: npx tsx scripts/migrate-classify-to-locate.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting classify → locate migration...\n");

  // Find all groups with classify mode
  const groups = await prisma.group.findMany({
    select: { id: true, config: true, sessionId: true, name: true },
  });

  let classifyCount = 0;
  let knobStrippedCount = 0;

  for (const group of groups) {
    const config = group.config as Record<string, unknown> | null;
    if (!config) continue;

    const mode = config.difficulty_mode;
    let needsUpdate = false;
    const newConfig: Record<string, unknown> = {};

    // Migrate classify → locate
    if (mode === "classify") {
      newConfig.difficulty_mode = "locate";
      classifyCount++;
      needsUpdate = true;
      console.log(`  Group "${group.name}" (${group.id}): classify → locate`);
    } else if (mode) {
      newConfig.difficulty_mode = mode;
    }

    // Strip knob keys (response_format, hint_scope, categorization, explanation_format)
    const knobKeys = ["response_format", "hint_scope", "categorization", "explanation_format"];
    const hasKnobs = knobKeys.some((k) => k in config);
    if (hasKnobs) {
      knobStrippedCount++;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.group.update({
        where: { id: group.id },
        data: { config: (Object.keys(newConfig).length > 0 ? newConfig : {}) as Record<string, string> },
      });
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  ${classifyCount} groups migrated from classify → locate`);
  console.log(`  ${knobStrippedCount} groups had knob keys stripped`);
  console.log(`  ${groups.length} total groups checked`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
