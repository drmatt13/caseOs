import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  getDatabaseUrl,
  requireAuthenticatedSub,
} from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";
import { updateUserSchema } from "@repo/database/table.schemas";

const UpdateUserRequestSchema = updateUserSchema
  .pick({
    billingEmail: true,
    firstName: true,
    lastName: true,
    displayName: true,
    profilePicture: true,
  })
  .extend({
    displayName: updateUserSchema.shape.displayName.refine(
      (value) => value == null || value.trim().length >= 3,
      "Display name must be at least 3 characters",
    ),
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
    const cognitoSub = await requireAuthenticatedSub(event);

    if (!cognitoSub) {
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
      where: { cognitoSub },
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
