import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient; prismaDbUrl?: string };

function getPrismaClient(): PrismaClient {
  const currentUrl = process.env.DATABASE_URL;
  if (globalForPrisma.prisma && globalForPrisma.prismaDbUrl === currentUrl) {
    return globalForPrisma.prisma;
  }

  const adapter = new PrismaPg({ connectionString: currentUrl });
  const client = new PrismaClient({
    adapter,
    log: ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaDbUrl = currentUrl;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  }
});
