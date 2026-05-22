import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  clearAuthCookie,
  getHttpMethod,
  jsonResponse,
  optionsResponse,
} from "@repo/shared-lambda-utils";

const AUTH_COOKIE_NAMES = ["idToken", "accessToken", "refreshToken"];

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  if (getHttpMethod(event) === "OPTIONS") {
    return optionsResponse();
  }

  return jsonResponse(
    200,
    { success: true },
    {
      cookies: AUTH_COOKIE_NAMES.map(clearAuthCookie),
    },
  );
};
