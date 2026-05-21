import { config as loadDotEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(packageRoot, "..", "..");

loadDotEnv({ path: resolve(repoRoot, ".env"), quiet: true });
loadDotEnv({ path: resolve(packageRoot, ".env"), quiet: true });

// Keep Prisma generator compatibility checks scoped to Prisma commands.
process.env.SKIP_PRISMA_VERSION_CHECK ??= "true";
process.env.PRISMA_BINARY_TARGETS ??= JSON.stringify([
  "native",
  "rhel-openssl-3.0.x",
]);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
