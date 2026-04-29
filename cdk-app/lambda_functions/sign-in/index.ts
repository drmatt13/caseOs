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

function getUserPoolClientId(): string | null {
  const value = process.env.USER_POOL_CLIENT_ID;
  return value && value.trim().length > 0 ? value : null;
}

interface SignInBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

function makeCookie(name: string, value: string, maxAge?: number): string {
  const maxAgeAttribute =
    typeof maxAge === "number" ? `; Max-Age=${maxAge}` : "";

  return `${name}=${value}; HttpOnly; Secure; SameSite=None; Path=/${maxAgeAttribute}`;
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
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

  const method =
    "httpMethod" in event
      ? event.httpMethod
      : event.requestContext?.http?.method;

  if (method === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  let body: SignInBody;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Invalid request body" }),
    };
  }

  const { email, password } = body;
  const rememberMe = body.rememberMe === true;
  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: "Email and password are required",
      }),
    };
  }

  try {
    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: userPoolClientId,
        AuthParameters: {
          USERNAME: email.trim().toLowerCase(),
          PASSWORD: password,
        },
      }),
    );

    const auth = result.AuthenticationResult;
    if (!auth?.IdToken || !auth?.AccessToken || !auth?.RefreshToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Authentication failed",
        }),
      };
    }

    // Decode idToken to extract user info
    const payload = JSON.parse(
      Buffer.from(auth.IdToken.split(".")[1], "base64url").toString("utf-8"),
    );

    const user = {
      id: payload.sub,
      email: payload.email,
      userName: payload["cognito:username"],
      firstName: payload.given_name ?? "",
      lastName: payload.family_name ?? "",
    };

    const accessMaxAge = auth.ExpiresIn ?? 3600;
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;

    return {
      statusCode: 200,
      multiValueHeaders: {
        "Set-Cookie": [
          makeCookie("idToken", auth.IdToken, accessMaxAge),
          makeCookie("accessToken", auth.AccessToken, accessMaxAge),
          makeCookie("refreshToken", auth.RefreshToken, refreshMaxAge),
        ],
      },
      body: JSON.stringify({ success: true, user }),
    };
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };

    if (
      err.name === "NotAuthorizedException" ||
      err.name === "UserNotFoundException"
    ) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Incorrect email or password",
        }),
      };
    }

    if (err.name === "UserNotConfirmedException") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          error: "Please verify your email before signing in",
        }),
      };
    }

    console.error("Sign-in error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Internal server error" }),
    };
  }
};
