import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { createSchema, createYoga } from "graphql-yoga";
import {
  getHttpMethod,
  jsonResponse,
  getDatabaseUrl,
  requireAuthenticatedSession,
  type AuthenticatedCognitoSession,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

type GraphQLContext = {
  session: AuthenticatedCognitoSession;
  prisma: ReturnType<typeof getPrismaClient>;
};

const yoga = createYoga<GraphQLContext>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        health: String!
        hello: String!
        echo(message: String): String!
      }
    `,
    resolvers: {
      Query: {
        health: () => "ok",
        hello: () => "Hello from graphql-api",
        echo: (_parent: unknown, { message }: { message?: string }) =>
          message ?? "",
      },
    },
  }),
  graphqlEndpoint: "/graphql",
  graphiql: false,
});

function getRequestUrl(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): string {
  if ("rawPath" in event) {
    const protocol = event.headers["x-forwarded-proto"] ?? "https";
    const host =
      event.headers.host ??
      event.headers.Host ??
      event.requestContext.domainName ??
      "localhost";
    const queryString = event.rawQueryString ? `?${event.rawQueryString}` : "";

    return `${protocol}://${host}${event.rawPath}${queryString}`;
  }

  const protocol = event.headers["x-forwarded-proto"] ?? "https";
  const host =
    event.headers.host ?? event.headers.Host ?? event.requestContext.domainName;
  const path = event.path || "/graphql";
  const queryString = event.queryStringParameters
    ? `?${new URLSearchParams(
        Object.entries(event.queryStringParameters).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      ).toString()}`
    : "";

  return `${protocol}://${host ?? "localhost"}${path}${queryString}`;
}

function getRequestHeaders(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(event.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return headers;
}

function getRequestBody(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): BodyInit | undefined {
  if (!event.body) {
    return undefined;
  }

  return event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
}

async function toApiGatewayResult(
  response: Response,
): Promise<APIGatewayProxyResult> {
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
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
