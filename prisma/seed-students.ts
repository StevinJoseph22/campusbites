import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "Student@123";

interface StudentRow {
  username: string;
  email: string;
  name: string;
  course: string;
}

async function main() {
  const filePath = path.join(process.cwd(), "prisma", "student-import.json");
  const students: StudentRow[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log(`Seeding ${students.length} student accounts...`);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let created = 0;
  let updated = 0;

  for (const s of students) {
    const existing = await prisma.user.findUnique({ where: { username: s.username } });

    await prisma.user.upsert({
      where: { username: s.username },
      update: {
        email: s.email,
        name: s.name,
      },
      create: {
        username: s.username,
        email: s.email,
        name: s.name,
        role: "STUDENT",
        passwordHash,
        isTempPassword: true,
        campus: "Airport Road Campus",
      },
    });

    if (existing) updated++;
    else created++;
  }

  console.log(`Done. Created ${created}, updated ${updated} (existing accounts keep their own password).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
