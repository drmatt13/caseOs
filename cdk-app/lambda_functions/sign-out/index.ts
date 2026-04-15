type ApiGatewayResult = {
  statusCode: number;
  body: string;
  multiValueHeaders?: Record<string, string[]>;
};

const AUTH_COOKIE_NAMES = ["idToken", "accessToken", "refreshToken"];

function clearCookie(name: string): string {
  return `${name}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const lambdaHandler = async (event: any): Promise<ApiGatewayResult> => {
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
