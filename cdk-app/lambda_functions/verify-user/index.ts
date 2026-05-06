import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { requireAuthenticatedUser } from "@repo/shared-lambda-utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  const method =
    "httpMethod" in event
      ? event.httpMethod
      : event.requestContext?.http?.method;

  if (method === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  try {
    const payload = await requireAuthenticatedUser(event);

    if (!payload) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Invalid or expired token",
        }),
      };
    }

    const user = {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      userName:
        typeof payload["cognito:username"] === "string"
          ? payload["cognito:username"]
          : "",
      firstName: typeof payload.given_name === "string" ? payload.given_name : "",
      lastName: typeof payload.family_name === "string" ? payload.family_name : "",
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user }),
    };
  } catch (error: unknown) {
    console.error("Verify-user error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: "Invalid or expired token",
      }),
    };
  }
};
