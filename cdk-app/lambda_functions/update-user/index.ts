import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDatabaseUrl } from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";
import { updateUserSchema } from "@repo/database/table.schemas";

// Get required environment variables and throw an error if any are missing
const { AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;

if (!AWS_REGION || !USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error("Missing Cognito environment variables");
}

const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

const UpdateUserRequestSchema = updateUserSchema
  .pick({
    firstName: true,
    lastName: true,
    displayName: true,
    profilePicture: true,
  })
  .strict();

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
});

const parseJsonBody = (body: string | null | undefined): unknown => {
  if (!body) return {};
  return JSON.parse(body);
};

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Get the ID token from the cookies
    const idToken = cookie.parse(event.headers.cookie ?? "").idToken;

    // If no token is found, return an unauthorized response
    if (!idToken) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    // Verify the ID token and extract the payload
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer,
      audience: USER_POOL_CLIENT_ID,
    });

    // If the token is valid but doesn't contain the expected claims, return an unauthorized response
    if (payload.token_use !== "id" || !payload.sub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let body: unknown;

    try {
      body = parseJsonBody(event.body);
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const parsedBody = UpdateUserRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return jsonResponse(400, { error: "Invalid user update payload" });
    }

    if (Object.keys(parsedBody.data).length === 0) {
      return jsonResponse(400, { error: "No user fields to update" });
    }

    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    const prisma = getPrismaClient(databaseUrl);

    const user = await prisma.user.update({
      where: { cognitoSub: payload.sub },
      data: parsedBody.data,
    });

    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    // Return the user data in the response
    return jsonResponse(200, { success: true, user });

    // If any errors occur during token verification or database access, return an unauthorized response
  } catch (error) {
    console.error("Error fetching user:", error);
    return jsonResponse(401, { error: "Unauthorized" });
  }
};
