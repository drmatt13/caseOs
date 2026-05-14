import type { AuthenticatedCognitoSession } from "@repo/shared-lambda-utils";
import type { getPrismaClient } from "@repo/database";

export type GraphQLContext = {
  session: AuthenticatedCognitoSession;
  prisma: ReturnType<typeof getPrismaClient>;
};
