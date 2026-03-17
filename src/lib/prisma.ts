import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"; // ✅ NEW

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// ✅ NEW: create adapter
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter, // ✅ REQUIRED in Prisma 7
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}