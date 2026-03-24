/**
 * Seed test user accounts for development.
 *
 * Usage: npx tsx scripts/seed-users.ts
 *
 * Students log in by name only (no password).
 * Teachers and researchers require a password.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const testUsers = [
  { username: "teacher1", displayName: "Ms. Johnson", role: "teacher" as const, password: "teacher123" },
  { username: "student1", displayName: "Alex", role: "student" as const },
  { username: "student2", displayName: "Jordan", role: "student" as const },
  { username: "student3", displayName: "Sam", role: "student" as const },
  { username: "student4", displayName: "Taylor", role: "student" as const },
  { username: "researcher1", displayName: "Dr. Chen", role: "researcher" as const, password: "researcher123" },
];

async function main() {
  for (const user of testUsers) {
    const passwordHash = user.password
      ? await bcrypt.hash(user.password, 10)
      : null;

    const created = await prisma.user.upsert({
      where: { username: user.username },
      create: {
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash,
      },
    });

    console.log(`  ${created.role.padEnd(12)} ${created.username.padEnd(15)} "${created.displayName}"`);
  }

  console.log("\nDone. Login:");
  console.log("  teacher1 / teacher123");
  console.log("  Students: enter name only (Alex, Jordan, Sam, Taylor)");
  console.log("  researcher1 / researcher123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
