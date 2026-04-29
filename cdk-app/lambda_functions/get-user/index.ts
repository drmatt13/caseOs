import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDatabaseUrl } from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

// Get required environment variables and throw an error if any are missing
const { AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;

if (!AWS_REGION || !USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error("Missing Cognito environment variables");
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Get the ID token from the cookies
    const idToken = cookie.parse(event.headers.cookie ?? "").idToken;

    // If no token is found, return an unauthorized response
    if (!idToken) {
      return {
        statusCode: 401,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    // Verify the ID token and extract the payload
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer,
      audience: USER_POOL_CLIENT_ID,
    });

    // If the token is valid but doesn't contain the expected claims, return an unauthorized response
    if (payload.token_use !== "id" || !payload.sub) {
      return {
        statusCode: 401,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Unauthorized" }),
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
        cognitoSub: payload.sub,
      },
    });

    // If no user is found, return a 404 response
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // Return the user data in the response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ user, idToken }),
    };

    // If any errors occur during token verification or database access, return an unauthorized response
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      statusCode: 401,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }
};
