import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // ← datasource.url removed: Prisma reads DATABASE_URL from
  //   schema.prisma's env() call + your .env file automatically.
  //   Declaring it here causes a generate-time resolution error.
});