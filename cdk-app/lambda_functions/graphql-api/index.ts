import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { createYoga } from "graphql-yoga";
import {
  getHttpMethod,
  jsonResponse,
  getDatabaseUrl,
  requireAuthenticatedSession,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";
import type { GraphQLContext } from "./graphql-context";
import {
  getRequestBody,
  getRequestHeaders,
  getRequestUrl,
  toApiGatewayResult,
} from "./lib/api-gateway-fetch";
import { schema } from "./schema";

function isGraphiqlEnabled(): boolean {
  return process.env.GRAPHQL_GRAPHIQL_ENABLED === "true";
}

function createGraphQLYoga() {
  return createYoga<GraphQLContext>({
    schema,
    graphqlEndpoint: "/graphql",
    graphiql: isGraphiqlEnabled(),
  });
}

let yoga: ReturnType<typeof createGraphQLYoga> | null = null;

function getYoga(): ReturnType<typeof createGraphQLYoga> {
  yoga ??= createGraphQLYoga();
  return yoga;
}

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

    const method = getHttpMethod(event)?.toUpperCase();

    if (method !== "POST" && method !== "GET") {
      return jsonResponse(405, { error: "Method Not Allowed" });
    }

    const yoga = getYoga();
    const response = await yoga.fetch(
      getRequestUrl(event),
      {
        method,
        headers: getRequestHeaders(event),
        body: getRequestBody(event),
      },
      {
        session,
        prisma,
      },
    );

    return toApiGatewayResult(response);
  } catch (error) {
    console.error("GraphQL API error:", error);
    return jsonResponse(500, { error: "Internal Server Error" });
  }
};
