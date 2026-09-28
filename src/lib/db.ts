import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see .env.example)');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/**
 * The shared Prisma client, created on first use so `next build` works without a database.
 * Development keeps one instance across hot reloads.
 */
export function db(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}
