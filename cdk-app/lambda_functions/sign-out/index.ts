import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";

const AUTH_COOKIE_NAMES = ["idToken", "accessToken", "refreshToken"];

function clearCookie(name: string): string {
  return `${name}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

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

  return {
    statusCode: 200,
    multiValueHeaders: {
      "Set-Cookie": AUTH_COOKIE_NAMES.map(clearCookie),
    },
    body: JSON.stringify({ success: true }),
  };
};
