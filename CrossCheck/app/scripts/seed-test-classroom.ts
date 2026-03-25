/**
 * Seed a realistic UMS classroom for testing.
 *
 * Creates:
 *   - 1 teacher (Mrs. Davis / teacher1 / teacher123)
 *   - 20 students with realistic names (log in by name only)
 *   - 1 researcher (Dr. Phan / researcher1 / researcher123)
 *
 * Safe to run multiple times (upserts by username).
 *
 * Usage: npx tsx scripts/seed-test-classroom.ts
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const users = [
  // Teacher
  { username: "teacher1", displayName: "Mrs. Davis", role: "teacher" as const, password: "teacher123" },

  // 20 students — realistic Memphis middle school names
  { username: "maya_j", displayName: "Maya Johnson", role: "student" as const },
  { username: "deandre_w", displayName: "DeAndre Williams", role: "student" as const },
  { username: "sophia_c", displayName: "Sophia Chen", role: "student" as const },
  { username: "jaylen_b", displayName: "Jaylen Brooks", role: "student" as const },
  { username: "aaliyah_m", displayName: "Aaliyah Mitchell", role: "student" as const },
  { username: "carlos_r", displayName: "Carlos Ramirez", role: "student" as const },
  { username: "emma_t", displayName: "Emma Thompson", role: "student" as const },
  { username: "malik_h", displayName: "Malik Harris", role: "student" as const },
  { username: "chloe_p", displayName: "Chloe Patterson", role: "student" as const },
  { username: "isaiah_d", displayName: "Isaiah Davis", role: "student" as const },
  { username: "lily_n", displayName: "Lily Nguyen", role: "student" as const },
  { username: "marcus_j", displayName: "Marcus Jackson", role: "student" as const },
  { username: "ava_w", displayName: "Ava Washington", role: "student" as const },
  { username: "tyler_l", displayName: "Tyler Lee", role: "student" as const },
  { username: "jasmine_k", displayName: "Jasmine King", role: "student" as const },
  { username: "noah_g", displayName: "Noah Garcia", role: "student" as const },
  { username: "brianna_s", displayName: "Brianna Smith", role: "student" as const },
  { username: "ethan_m", displayName: "Ethan Moore", role: "student" as const },
  { username: "zara_a", displayName: "Zara Ahmed", role: "student" as const },
  { username: "liam_f", displayName: "Liam Foster", role: "student" as const },

  // Researcher
  { username: "researcher1", displayName: "Dr. Phan", role: "researcher" as const, password: "researcher123" },
];

async function main() {
  console.log("Seeding test classroom...\n");

  for (const user of users) {
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

    console.log(`  ${created.role.padEnd(12)} ${created.displayName}`);
  }

  console.log(`\n${users.length} users seeded.\n`);
  console.log("Login:");
  console.log("  Teacher:    teacher1 / teacher123");
  console.log("  Students:   enter display name (e.g., Maya Johnson, DeAndre Williams)");
  console.log("  Researcher: researcher1 / researcher123");
  console.log("\nSuggested groups of 5:");
  console.log("  Group A: Maya Johnson, DeAndre Williams, Sophia Chen, Jaylen Brooks, Aaliyah Mitchell");
  console.log("  Group B: Carlos Ramirez, Emma Thompson, Malik Harris, Chloe Patterson, Isaiah Davis");
  console.log("  Group C: Lily Nguyen, Marcus Jackson, Ava Washington, Tyler Lee, Jasmine King");
  console.log("  Group D: Noah Garcia, Brianna Smith, Ethan Moore, Zara Ahmed, Liam Foster");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
