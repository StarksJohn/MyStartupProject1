/**
 * Prisma Client Singleton
 * Prevents connection exhaustion under Next.js dev hot-reload.
 *
 * NOTE for Story 1.1: `prisma/schema.prisma` is intentionally not present yet
 * (business models land in Story 3.1). This file is kept so later stories
 * can import `prisma` from a stable path without churning imports.
 * `PrismaClient` is only instantiated at runtime; importing this module
 * alone is a no-op until the schema is generated.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
