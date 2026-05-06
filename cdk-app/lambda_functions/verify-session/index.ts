import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  jsonResponse,
  requireAuthenticatedSession,
} from "@repo/shared-lambda-utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate the Cognito session and expose the ID token payload.
    const session = await requireAuthenticatedSession(event);

    // Return 401 when the request has no valid session.
    if (!session) {
      return jsonResponse(401, {
        success: false,
        error: "Invalid or expired token",
      });
    }

    // Return a successful session check.
    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error("Verify-session error:", error);
    return jsonResponse(401, {
      success: false,
      error: "Invalid or expired token",
    });
  }
};
