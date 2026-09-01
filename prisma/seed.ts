import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean old canteens and vendor users to prevent duplicates (e.g. vendor-1 vs campusgrill)
  await prisma.restaurant.deleteMany({});
  await prisma.user.deleteMany({
    where: { role: "VENDOR" }
  });

  // Delete existing conflicting Admin accounts to prevent unique constraint failures
  await prisma.user.deleteMany({
    where: {
      OR: [
        { username: "Admin" },
        { username: "admin" },
        { email: "admin@kristujayanti.com" },
        { email: "admin-lower@kristujayanti.com" }
      ]
    }
  });

  // Seed default SystemSetting
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformFee: 5.0,
      takeawayFee: 10.0
    }
  });

  // Seed default Admin credentials as requested: Username: Admin, Password: Admin@123
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      username: "Admin",
      email: "admin@kristujayanti.com",
      name: "Super Admin",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  // Also keep "admin" lowercase fallback
  const adminLowerHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin-lower@kristujayanti.com",
      name: "Admin Fallback",
      role: "ADMIN",
      passwordHash: adminLowerHash,
    },
  });

  // Seed default vendors
  const vendors = [
    // Central Campus (CC)
    {
      id: "campusgrillCC",
      name: "The Campus Grill & Burger Club (Central Campus)",
      tokenPrefix: "KJC-TC-CC",
      floor: "Ground Floor",
      email: "campusgrillCC@kristujayanti.com",
      cuisine: "Burgers, Wraps & Loaded Fries",
      logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
      location: "Main Canteen Block — Stall #01",
      type: "MIXED",
      pinCode: "123456",
      campus: "Central Campus"
    },
    {
      id: "southexpressCC",
      name: "South Express Dosa & Tiffins (Central Campus)",
      tokenPrefix: "KJC-SE-CC",
      floor: "Ground Floor",
      email: "southexpressCC@kristujayanti.com",
      cuisine: "Crispy Dosa, Idli & Filter Coffee",
      logo: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=120&h=120&fit=crop",
      location: "Main Canteen Block — Stall #04",
      type: "PURE_VEG",
      pinCode: "123456",
      campus: "Central Campus"
    },
    {
      id: "coldbrewCC",
      name: "Cold Brew & Sandwich Bar (Central Campus)",
      tokenPrefix: "KJC-CB-CC",
      floor: "1st Floor",
      email: "coldbrewCC@kristujayanti.com",
      cuisine: "Artisanal Coffee & Grilled Panini",
      logo: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&h=120&fit=crop",
      location: "Student Activity Center — Floor 1",
      type: "PURE_VEG",
      pinCode: "123456",
      campus: "Central Campus"
    },
    {
      id: "wokrollCC",
      name: "Wok & Roll Noodle Hub (Central Campus)",
      tokenPrefix: "KJC-WR-CC",
      floor: "2nd Floor",
      email: "wokrollCC@kristujayanti.com",
      cuisine: "Hakka Noodles, Dimsums & Manchow",
      logo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&h=120&fit=crop",
      location: "Food Plaza — Floor 2",
      type: "MIXED",
      pinCode: "123456",
      campus: "Central Campus"
    },

    // Airport Road Campus (ARC)
    {
      id: "campusgrillARC",
      name: "The Campus Grill & Burger Club (Airport Road Campus)",
      tokenPrefix: "KJC-TC-ARC",
      floor: "Ground Floor",
      email: "campusgrillARC@kristujayanti.com",
      cuisine: "Burgers, Wraps & Loaded Fries",
      logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
      location: "Main Canteen Block — Stall #01",
      type: "MIXED",
      pinCode: "123456",
      campus: "Airport Road Campus"
    },
    {
      id: "southexpressARC",
      name: "South Express Dosa & Tiffins (Airport Road Campus)",
      tokenPrefix: "KJC-SE-ARC",
      floor: "Ground Floor",
      email: "southexpressARC@kristujayanti.com",
      cuisine: "Crispy Dosa, Idli & Filter Coffee",
      logo: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=120&h=120&fit=crop",
      location: "Main Canteen Block — Stall #04",
      type: "PURE_VEG",
      pinCode: "123456",
      campus: "Airport Road Campus"
    },
    {
      id: "coldbrewARC",
      name: "Cold Brew & Sandwich Bar (Airport Road Campus)",
      tokenPrefix: "KJC-CB-ARC",
      floor: "1st Floor",
      email: "coldbrewARC@kristujayanti.com",
      cuisine: "Artisanal Coffee & Grilled Panini",
      logo: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&h=120&fit=crop",
      location: "Student Activity Center — Floor 1",
      type: "PURE_VEG",
      pinCode: "123456",
      campus: "Airport Road Campus"
    },
    {
      id: "wokrollARC",
      name: "Wok & Roll Noodle Hub (Airport Road Campus)",
      tokenPrefix: "KJC-WR-ARC",
      floor: "2nd Floor",
      email: "wokrollARC@kristujayanti.com",
      cuisine: "Hakka Noodles, Dimsums & Manchow",
      logo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&h=120&fit=crop",
      location: "Food Plaza — Floor 2",
      type: "MIXED",
      pinCode: "123456",
      campus: "Airport Road Campus"
    }
  ];

  for (const v of vendors) {
    const passwordHash = await bcrypt.hash("vendor123", 10);
    // Delete potential conflicting vendor users
    await prisma.user.deleteMany({
      where: {
        OR: [
          { username: v.id },
          { email: v.email }
        ]
      }
    });

    // Create user account for vendor
    await prisma.user.create({
      data: {
        username: v.id,
        email: v.email,
        name: v.name,
        role: "VENDOR",
        passwordHash
      }
    });

    // Create/Upsert Restaurant
    await prisma.restaurant.upsert({
      where: { id: v.id },
      update: {
        name: v.name,
        tokenPrefix: v.tokenPrefix,
        floor: v.floor,
        cuisine: v.cuisine,
        logo: v.logo,
        location: v.location,
        type: v.type,
        pinCodeHash: v.pinCode,
        campus: v.campus
      },
      create: {
        id: v.id,
        name: v.name,
        tokenPrefix: v.tokenPrefix,
        floor: v.floor,
        cuisine: v.cuisine,
        logo: v.logo,
        location: v.location,
        type: v.type,
        pinCodeHash: v.pinCode,
        campus: v.campus
      }
    });
  }

  // Delete all existing menu items as requested
  await prisma.menuItem.deleteMany({});
  console.log("Cleared all menu items from database.");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
