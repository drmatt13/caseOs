import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  getDatabaseUrl,
  jsonResponse,
  requireAuthenticatedSession,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate the Cognito session and expose the ID token payload.
    const session = await requireAuthenticatedSession(event);

    // Return 401 when the request has no valid session.
    if (!session) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    // Resolve the production or local database URL.
    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    // Initialize Prisma with the resolved database URL.
    const prisma = getPrismaClient(databaseUrl);

    // Fetch the user by Cognito subject.
    const user = await prisma.user.findUnique({
      where: {
        cognitoSub: session.payload.sub,
      },
    });

    // Return 404 when the authenticated user has no database record.
    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    // Return the user profile and current ID token.
    return jsonResponse(200, { user, idToken: session.idToken });
  } catch (error) {
    console.error("Error fetching user:", error);
    return jsonResponse(500, { error: "Internal Server Error" });
  }
};
