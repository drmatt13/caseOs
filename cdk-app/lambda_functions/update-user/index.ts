import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  getDatabaseUrl,
  jsonResponse,
  parseJsonBody,
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

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate the Cognito session and expose the Cognito subject.
    const cognitoSub = await requireAuthenticatedSub(event);

    // Return 401 when the request has no valid session.
    if (!cognitoSub) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let body: unknown;

    try {
      // Parse the JSON request body.
      body = parseJsonBody(event.body);
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    // Validate the requested user profile updates.
    const parsedBody = UpdateUserRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return jsonResponse(400, { error: "Invalid user update payload" });
    }

    if (Object.keys(parsedBody.data).length === 0) {
      return jsonResponse(400, { error: "No user fields to update" });
    }

    // Resolve the production or local database URL.
    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });

    // Initialize Prisma with the resolved database URL.
    const prisma = getPrismaClient(databaseUrl);

    // Update the user by Cognito subject.
    const user = await prisma.user.update({
      where: { cognitoSub },
      data: parsedBody.data,
    });

    // Return 404 when the authenticated user has no database record.
    if (!user) {
      return jsonResponse(404, { error: "User not found" });
    }

    // Return the updated user profile.
    return jsonResponse(200, { success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return jsonResponse(401, { error: "Unauthorized" });
  }
};
