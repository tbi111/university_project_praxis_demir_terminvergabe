import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

export type Db = PrismaClient;

export function erstellePrisma(url = process.env.DATABASE_URL ?? "file:./prisma/dev.db"): Db {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: Db };

export const prisma = globalForPrisma.prisma ?? erstellePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
