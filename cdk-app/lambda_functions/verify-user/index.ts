import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";

interface User {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
}

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

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  // TODO: Replace mock decode with real Cognito token verification via JWKS

  const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
  const cookies = parseCookies(cookieHeader);
  const idToken = cookies["idToken"];

  if (!idToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: "Missing idToken" }),
    };
  }

  // Mock decode: real Cognito tokens are JWTs verified against the JWKS endpoint
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Malformed token" }),
      };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8"),
    );

    // TODO: Verify signature against Cognito JWKS, check exp, iss, aud, token_use
    if (payload.token_use !== "id") {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Invalid token_use, expected id token",
        }),
      };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Token expired" }),
      };
    }

    const user: User = {
      id: payload.sub,
      userName: payload["cognito:username"],
      firstName: payload.given_name ?? "",
      lastName: payload.family_name ?? "",
      email: payload.email,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user }),
    };
  } catch (e) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: "Invalid token" }),
    };
  }
};
