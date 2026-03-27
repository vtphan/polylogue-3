/**
 * Seed user accounts, classes, and rosters from seed.yaml.
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
  classes?: { name: string; teacher: string; students: string[] }[];
}

function toUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

async function upsertUser(
  username: string,
  displayName: string,
  role: "teacher" | "researcher" | "student",
  passwordHash: string | null = null,
): Promise<string> {
  const user = await prisma.user.upsert({
    where: { username },
    create: { username, displayName, role, passwordHash },
    update: { displayName, passwordHash },
  });
  return user.id;
}

async function main() {
  const configPath = resolve(__dirname, "../seed.yaml");
  const raw = readFileSync(configPath, "utf-8");
  const config: SeedConfig = YAML.parse(raw);

  const teachers = config.teachers || [];
  const researchers = config.researchers || [];
  const classes = config.classes || [];

  // Map display name → user id (for class roster linking)
  const userMap = new Map<string, string>();

  // Create teachers
  for (const t of teachers) {
    const hash = await bcrypt.hash(t.password, 10);
    const id = await upsertUser(toUsername(t.name), t.name, "teacher", hash);
    userMap.set(t.name, id);
    console.log(`  teacher     ${t.name}`);
  }

  // Create researchers
  for (const r of researchers) {
    const hash = await bcrypt.hash(r.password, 10);
    const id = await upsertUser(toUsername(r.name), r.name, "researcher", hash);
    userMap.set(r.name, id);
    console.log(`  researcher  ${r.name}`);
  }

  // Create students from class rosters (deduplicated)
  const allStudentNames = new Set<string>();
  for (const cls of classes) {
    for (const name of cls.students) {
      allStudentNames.add(name);
    }
  }
  for (const name of allStudentNames) {
    const id = await upsertUser(toUsername(name), name, "student");
    userMap.set(name, id);
    console.log(`  student     ${name}`);
  }

  // Create classes and rosters
  if (classes.length > 0) {
    console.log("\nClasses:");
    for (const cls of classes) {
      const teacherId = userMap.get(cls.teacher);
      if (!teacherId) {
        console.error(`  ERROR: teacher "${cls.teacher}" not found for class "${cls.name}"`);
        continue;
      }

      // Delete existing class with same name for this teacher (idempotent)
      await prisma.class.deleteMany({ where: { name: cls.name, teacherId } });

      const studentIds = cls.students
        .map((name) => userMap.get(name))
        .filter((id): id is string => !!id);

      await prisma.class.create({
        data: {
          teacherId,
          name: cls.name,
          students: { create: studentIds.map((id) => ({ userId: id })) },
        },
      });

      console.log(`  ${cls.name} (${cls.teacher}) — ${studentIds.length} students`);
    }
  }

  console.log("\nDone. Login with name + password:");
  for (const t of teachers) {
    console.log(`  ${t.name} / ${t.password}`);
  }
  for (const r of researchers) {
    console.log(`  ${r.name} / ${r.password}`);
  }
  if (allStudentNames.size > 0) {
    console.log(`  Students: enter name only (${[...allStudentNames].slice(0, 3).join(", ")}, ...)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
