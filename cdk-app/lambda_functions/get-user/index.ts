import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  getDatabaseUrl,
  requireAuthenticatedSession,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const session = await requireAuthenticatedSession(event);

    if (!session) {
      return {
        statusCode: 401,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Gets production or local database URL, with support for Secrets Manager in production
    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    // Initialize Prisma client with the database URL
    const prisma = getPrismaClient(databaseUrl);

    // Fetch the user from the database using the Cognito sub from the token payload
    const user = await prisma.user.findUnique({
      where: {
        cognitoSub: session.payload.sub,
      },
    });

    // If no user is found, return a 404 response
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Return the user data in the response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ user, idToken: session.idToken }),
    };

    // If any errors occur during token verification or database access, return an unauthorized response
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      statusCode: 401,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }
};
