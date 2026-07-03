/**
 * Usage: npx tsx prisma/seed.ts your.email@auis.edu.krd ADMIN
 * Run this AFTER you've signed in at least once (so the user row exists),
 * since new sign-ups default to SUBMITTER.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !role) {
    console.log("Usage: npx tsx prisma/seed.ts <email> <SUBMITTER|TECHNICIAN|ADMIN>");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: role as any },
  });

  console.log(`Updated ${user.email} to role ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
