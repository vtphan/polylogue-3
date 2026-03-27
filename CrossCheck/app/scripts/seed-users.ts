/**
 * Seed user accounts from seed.yaml.
 *
 * Usage: npx tsx scripts/seed-users.ts
 *
 * Everyone logs in by name. Teachers/researchers also need a password.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import YAML from "yaml";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

interface SeedConfig {
  teachers?: { name: string; password: string }[];
  researchers?: { name: string; password: string }[];
}

function toUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

async function main() {
  const configPath = resolve(__dirname, "../seed.yaml");
  const raw = readFileSync(configPath, "utf-8");
  const config: SeedConfig = YAML.parse(raw);

  const teachers = config.teachers || [];
  const researchers = config.researchers || [];

  for (const t of teachers) {
    const passwordHash = await bcrypt.hash(t.password, 10);
    const user = await prisma.user.upsert({
      where: { username: toUsername(t.name) },
      create: {
        username: toUsername(t.name),
        displayName: t.name,
        role: "teacher",
        passwordHash,
      },
      update: {
        displayName: t.name,
        passwordHash,
      },
    });
    console.log(`  teacher     ${user.displayName}`);
  }

  for (const r of researchers) {
    const passwordHash = await bcrypt.hash(r.password, 10);
    const user = await prisma.user.upsert({
      where: { username: toUsername(r.name) },
      create: {
        username: toUsername(r.name),
        displayName: r.name,
        role: "researcher",
        passwordHash,
      },
      update: {
        displayName: r.name,
        passwordHash,
      },
    });
    console.log(`  researcher  ${user.displayName}`);
  }

  console.log("\nDone. Login with name + password:");
  for (const t of teachers) {
    console.log(`  ${t.name} / ${t.password}`);
  }
  for (const r of researchers) {
    console.log(`  ${r.name} / ${r.password}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
