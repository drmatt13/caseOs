import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDatabaseUrl } from "@repo/shared-lambda-utils";
import { getPrismaClient } from "@repo/database";

interface OAuthCallbackBody {
  code?: string;
  redirectUri?: string;
  rememberMe?: boolean;
}

interface CognitoTokenResponse {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

function makeCookie(name: string, value: string, maxAge?: number): string {
  const maxAgeAttribute =
    typeof maxAge === "number" ? `; Max-Age=${maxAge}` : "";

  return `${name}=${value}; HttpOnly; Secure; SameSite=None; Path=/${maxAgeAttribute}`;
}

function getDisplayName(
  firstName: string,
  lastName: string,
  email: string,
): string {
  const name = `${firstName} ${lastName}`.trim();
  return name || email;
}

function getRequiredCognitoConfig() {
  const {
    AWS_REGION,
    USER_POOL_ID,
    USER_POOL_CLIENT_ID,
    COGNITO_DOMAIN_URL,
  } = process.env;

  if (
    !AWS_REGION ||
    !USER_POOL_ID ||
    !USER_POOL_CLIENT_ID ||
    !COGNITO_DOMAIN_URL
  ) {
    throw new Error("Missing Cognito OAuth environment variables");
  }

  const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  return {
    cognitoDomainUrl: COGNITO_DOMAIN_URL,
    issuer,
    jwks,
    userPoolClientId: USER_POOL_CLIENT_ID,
  };
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    const method =
      "httpMethod" in event
        ? event.httpMethod
        : event.requestContext?.http?.method;

    if (method === "OPTIONS") {
      return { statusCode: 204, body: "" };
    }

    let body: OAuthCallbackBody;
    try {
      body = JSON.parse(event.body ?? "{}") as OAuthCallbackBody;
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid request body" }),
      };
    }

    const code = body.code?.trim();
    const redirectUri = body.redirectUri?.trim();
    const rememberMe = body.rememberMe === true;
    const cognitoConfig = getRequiredCognitoConfig();

    if (!code || !redirectUri) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Authorization code and redirect URI are required",
        }),
      };
    }

    const tokenResponse = await fetch(
      `${cognitoConfig.cognitoDomainUrl.replace(/\/+$/, "")}/oauth2/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: cognitoConfig.userPoolClientId,
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    const tokens = (await tokenResponse.json()) as CognitoTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokens.id_token ||
      !tokens.access_token ||
      !tokens.refresh_token
    ) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error:
            tokens.error_description ||
            tokens.error ||
            "Unable to complete OAuth sign in",
        }),
      };
    }

    const { payload } = await jwtVerify(tokens.id_token, cognitoConfig.jwks, {
      issuer: cognitoConfig.issuer,
      audience: cognitoConfig.userPoolClientId,
    });

    if (payload.token_use !== "id" || !payload.sub) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Invalid ID token" }),
      };
    }

    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "OAuth provider did not return an email address",
        }),
      };
    }

    const firstName =
      typeof payload.given_name === "string" && payload.given_name.trim()
        ? payload.given_name.trim()
        : email.split("@")[0];
    const lastName =
      typeof payload.family_name === "string" && payload.family_name.trim()
        ? payload.family_name.trim()
        : "";
    const profilePicture =
      typeof payload.picture === "string" ? payload.picture : null;

    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });
    const prisma = getPrismaClient(databaseUrl);

    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (
      existingUserWithEmail &&
      existingUserWithEmail.cognitoSub !== payload.sub
    ) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          success: false,
          error:
            "An account already exists with this email. Sign in with email and password first.",
        }),
      };
    }

    await prisma.user.upsert({
      where: { cognitoSub: payload.sub },
      create: {
        cognitoSub: payload.sub,
        email,
        firstName,
        lastName,
        profilePicture,
        displayName: getDisplayName(firstName, lastName, email),
        accountTier: "FREE",
        accountStatus: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        email,
        firstName,
        lastName,
        profilePicture,
        displayName: getDisplayName(firstName, lastName, email),
        updatedAt: new Date(),
      },
    });

    const accessMaxAge = tokens.expires_in ?? 3600;
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;

    return {
      statusCode: 200,
      multiValueHeaders: {
        "Set-Cookie": [
          makeCookie("idToken", tokens.id_token, accessMaxAge),
          makeCookie("accessToken", tokens.access_token, accessMaxAge),
          makeCookie("refreshToken", tokens.refresh_token, refreshMaxAge),
        ],
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("OAuth callback error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "OAuth sign in failed",
      }),
    };
  }
};
