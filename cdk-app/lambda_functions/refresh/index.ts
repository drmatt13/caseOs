import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({});

function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
}

function makeCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

function getUserPoolClientId(): string | null {
  const value = process.env.USER_POOL_CLIENT_ID;
  return value && value.trim().length > 0 ? value : null;
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

  const userPoolClientId = getUserPoolClientId();
  if (!userPoolClientId) {
    console.error("Missing USER_POOL_CLIENT_ID environment variable");
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Auth service is not configured",
      }),
    };
  }

  const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
  const cookies = parseCookies(cookieHeader);
  const refreshToken = cookies["refreshToken"];

  if (!refreshToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: "Missing refresh token" }),
    };
  }

  try {
    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: userPoolClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }),
    );

    const auth = result.AuthenticationResult;
    if (!auth?.IdToken || !auth?.AccessToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Refresh failed" }),
      };
    }

    const accessMaxAge = auth.ExpiresIn ?? 3600;

    return {
      statusCode: 200,
      multiValueHeaders: {
        "Set-Cookie": [
          makeCookie("idToken", auth.IdToken, accessMaxAge),
          makeCookie("accessToken", auth.AccessToken, accessMaxAge),
        ],
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error: unknown) {
    const err = error as { name?: string };

    if (err.name === "NotAuthorizedException") {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Refresh token expired or invalid",
        }),
      };
    }

    console.error("Refresh error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Internal server error" }),
    };
  }
};
