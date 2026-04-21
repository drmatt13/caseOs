import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // Reuse the Prisma client across warm Lambda invocations in development/runtime.
  var __repoPrismaClient: PrismaClient | undefined;
}

// function getDatabaseUrl(): string {
//   const databaseUrl =
//     process.env.PRIMARY_DATABASE_URL ?? process.env.DATABASE_URL;

//   if (!databaseUrl) {
//     throw new Error(
//       "PRIMARY_DATABASE_URL or DATABASE_URL must be set before using Prisma.",
//     );
//   }

//   return databaseUrl;
// }

function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg(databaseUrl);

  return new PrismaClient({ adapter });
}

export function getPrismaClient(databaseUrl: string): PrismaClient {
  if (!globalThis.__repoPrismaClient) {
    globalThis.__repoPrismaClient = createPrismaClient(databaseUrl);
  }

  return globalThis.__repoPrismaClient;
}

export async function disconnectPrisma(): Promise<void> {
  if (!globalThis.__repoPrismaClient) {
    return;
  }

  await globalThis.__repoPrismaClient.$disconnect();
  globalThis.__repoPrismaClient = undefined;
}
