const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL DB successfully!");

  // 1. Create Institution Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Institution" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "emailDomain" TEXT NOT NULL,
      "tokenPrefix" TEXT NOT NULL DEFAULT 'KJU',
      "campuses" TEXT NOT NULL,
      "logo" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Verified 'Institution' table.");

  // 2. Insert Default Institutions: KJU, Christ, RVCE
  await client.query(`
    INSERT INTO "Institution" ("id", "name", "code", "emailDomain", "tokenPrefix", "campuses", "logo", "isActive", "createdAt", "updatedAt")
    VALUES 
      ('kju', 'Kristu Jayanti University', 'KJU', 'kristujayanti.com', 'KJU', '["Central Campus", "Airport Road Campus"]', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('christ', 'Christ (Deemed to be University)', 'CU', 'christuniversity.in', 'CU', '["Central Campus (Hosur)", "Kengeri Campus", "Bannerghatta Road Campus", "Yeshwanthpur Campus"]', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('rvce', 'RV College of Engineering', 'RVCE', 'rvce.edu.in', 'RVCE', '["Mysore Road Main Campus"]', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("id") DO UPDATE SET 
      "name" = EXCLUDED."name",
      "code" = EXCLUDED."code",
      "emailDomain" = EXCLUDED."emailDomain",
      "tokenPrefix" = EXCLUDED."tokenPrefix",
      "campuses" = EXCLUDED."campuses",
      "updatedAt" = CURRENT_TIMESTAMP;
  `);
  console.log("Upserted default colleges: KJU, Christ University, RVCE.");

  // 3. Add institutionId columns to tables if missing
  await client.query(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionId" TEXT DEFAULT 'kju';
    ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "institutionId" TEXT DEFAULT 'kju';
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "institutionId" TEXT DEFAULT 'kju';
    ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "institutionId" TEXT DEFAULT 'kju';
  `);

  // Ensure all existing null institutionIds are populated with 'kju'
  await client.query(`
    UPDATE "User" SET "institutionId" = 'kju' WHERE "institutionId" IS NULL;
    UPDATE "Restaurant" SET "institutionId" = 'kju' WHERE "institutionId" IS NULL;
    UPDATE "Order" SET "institutionId" = 'kju' WHERE "institutionId" IS NULL;
    UPDATE "SystemSetting" SET "institutionId" = 'kju' WHERE "institutionId" IS NULL;
  `);
  console.log("Verified institutionId columns & updated all existing records to 'kju'.");

  // 4. Ensure SystemSetting per institution
  await client.query(`
    INSERT INTO "SystemSetting" ("id", "platformFee", "convenienceFee", "takeawayFee", "institutionId")
    VALUES 
      ('kju', 2.0, 2.0, 10.0, 'kju'),
      ('christ', 2.0, 2.0, 10.0, 'christ'),
      ('rvce', 2.0, 2.0, 10.0, 'rvce')
    ON CONFLICT ("id") DO NOTHING;
  `);
  console.log("Upserted SystemSettings for all colleges.");

  // 5. Seed Platform Super Admin: superadmin / superadmin123
  const superAdminHash = await bcrypt.hash("superadmin123", 10);
  await client.query(`DELETE FROM "User" WHERE "username" = 'superadmin' OR "email" = 'superadmin@campusbites.com';`);
  await client.query(`
    INSERT INTO "User" ("id", "username", "email", "name", "passwordHash", "role", "institutionId", "updatedAt")
    VALUES ('usr_superadmin', 'superadmin', 'superadmin@campusbites.com', 'Platform Super Admin', $1, 'SUPER_ADMIN', NULL, CURRENT_TIMESTAMP);
  `, [superAdminHash]);
  console.log("Provisioned Platform Super Admin: superadmin / superadmin123");

  // 6. Seed KJU Admin: admin / admin123
  const kjuAdminHash = await bcrypt.hash("admin123", 10);
  await client.query(`DELETE FROM "User" WHERE "username" = 'admin' OR "email" = 'admin@kristujayanti.com';`);
  await client.query(`
    INSERT INTO "User" ("id", "username", "email", "name", "passwordHash", "role", "institutionId", "updatedAt")
    VALUES ('usr_kju_admin', 'admin', 'admin@kristujayanti.com', 'Kristu Jayanti Admin', $1, 'ADMIN', 'kju', CURRENT_TIMESTAMP);
  `, [kjuAdminHash]);
  console.log("Provisioned KJU College Admin: admin / admin123");

  // 7. Seed Christ Admin: cu_admin / admin123
  const christAdminHash = await bcrypt.hash("admin123", 10);
  await client.query(`DELETE FROM "User" WHERE "username" = 'cu_admin' OR "email" = 'admin@christuniversity.in';`);
  await client.query(`
    INSERT INTO "User" ("id", "username", "email", "name", "passwordHash", "role", "institutionId", "updatedAt")
    VALUES ('usr_christ_admin', 'cu_admin', 'admin@christuniversity.in', 'Christ University Admin', $1, 'ADMIN', 'christ', CURRENT_TIMESTAMP);
  `, [christAdminHash]);
  console.log("Provisioned Christ College Admin: cu_admin / admin123");

  // 8. Seed RVCE Admin: rvce_admin / admin123
  const rvceAdminHash = await bcrypt.hash("admin123", 10);
  await client.query(`DELETE FROM "User" WHERE "username" = 'rvce_admin' OR "email" = 'admin@rvce.edu.in';`);
  await client.query(`
    INSERT INTO "User" ("id", "username", "email", "name", "passwordHash", "role", "institutionId", "updatedAt")
    VALUES ('usr_rvce_admin', 'rvce_admin', 'admin@rvce.edu.in', 'RVCE College Admin', $1, 'ADMIN', 'rvce', CURRENT_TIMESTAMP);
  `, [rvceAdminHash]);
  console.log("Provisioned RVCE College Admin: rvce_admin / admin123");

  // 9. Ensure Student 21bcaf59 is assigned to 'kju'
  await client.query(`UPDATE "User" SET "institutionId" = 'kju' WHERE "username" = '21bcaf59';`);

  console.log("\n=== ALL SUPABASE MULTI-COLLEGE MIGRATIONS & SEEDING COMPLETED SUCCESSFULLY! ===");
  await client.end();
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
