import { PrismaClient } from "@prisma/client";

// Reuse one PrismaClient in development so hot reload doesn't open new connections each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
