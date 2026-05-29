import { config as loadDotEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

const packageRoot = __dirname;
const repoRoot = resolve(packageRoot, "..", "..");

loadDotEnv({ path: resolve(repoRoot, ".env"), quiet: true });
loadDotEnv({ path: resolve(packageRoot, ".env"), quiet: true });

process.env.PRISMA_BINARY_TARGETS ??= JSON.stringify(["native"]);

// Keep Prisma generator compatibility checks scoped to Prisma commands.
process.env.SKIP_PRISMA_VERSION_CHECK ??= "true";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
