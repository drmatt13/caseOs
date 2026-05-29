import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  getDatabaseUrl,
  getHttpMethod,
  jsonResponse,
  makeAuthCookie,
  optionsResponse,
  parseJsonBody,
  verifyCognitoIdToken,
} from "@repo/shared-lambda-utils";
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

  return {
    cognitoDomainUrl: COGNITO_DOMAIN_URL,
    userPoolClientId: USER_POOL_CLIENT_ID,
  };
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  try {
    if (getHttpMethod(event) === "OPTIONS") {
      return optionsResponse();
    }

    let body: OAuthCallbackBody;
    try {
      body = parseJsonBody<OAuthCallbackBody>(event.body);
    } catch {
      return jsonResponse(400, {
        success: false,
        error: "Invalid request body",
      });
    }

    const code = body.code?.trim();
    const redirectUri = body.redirectUri?.trim();
    const rememberMe = body.rememberMe === true;
    const cognitoConfig = getRequiredCognitoConfig();

    if (!code || !redirectUri) {
      return jsonResponse(400, {
        success: false,
        error: "Authorization code and redirect URI are required",
      });
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
      return jsonResponse(401, {
        success: false,
        error:
          tokens.error_description ||
          tokens.error ||
          "Unable to complete OAuth sign in",
      });
    }

    const payload = await verifyCognitoIdToken(tokens.id_token);

    if (!payload) {
      return jsonResponse(401, { success: false, error: "Invalid ID token" });
    }

    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) {
      return jsonResponse(401, {
        success: false,
        error: "OAuth provider did not return an email address",
      });
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
    const getOAuthProfileData = (existingProfilePicture?: string | null) => ({
      email,
      firstName,
      lastName,
      updatedAt: new Date(),
      ...(profilePicture && !existingProfilePicture ? { profilePicture } : {}),
    });

    const databaseUrl = await getDatabaseUrl({
      primaryDatabaseSecretArn: process.env.PRIMARY_DATABASE_SECRET_ARN,
      primaryDatabaseUrl: process.env.PRIMARY_DATABASE_URL,
      primaryDatabaseSslmode: process.env.PRIMARY_DATABASE_SSLMODE,
    });
    const prisma = getPrismaClient(databaseUrl);

    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserWithEmail) {
      await prisma.user.update({
        where: { id: existingUserWithEmail.id },
        data: {
          cognitoSub: payload.sub,
          ...getOAuthProfileData(existingUserWithEmail.profilePicture),
        },
      });
    } else {
      const existingUserWithSub = await prisma.user.findUnique({
        where: { cognitoSub: payload.sub },
      });

      if (existingUserWithSub) {
        await prisma.user.update({
          where: { id: existingUserWithSub.id },
          data: getOAuthProfileData(existingUserWithSub.profilePicture),
        });
      } else {
        await prisma.user.create({
          data: {
            cognitoSub: payload.sub,
            email,
            firstName,
            lastName,
            profilePicture,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    const accessMaxAge = tokens.expires_in ?? 3600;
    const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;

    return jsonResponse(
      200,
      {
        success: true,
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
      },
      {
        cookies: [
          makeAuthCookie("idToken", tokens.id_token, accessMaxAge),
          makeAuthCookie("accessToken", tokens.access_token, accessMaxAge),
          makeAuthCookie("refreshToken", tokens.refresh_token, refreshMaxAge),
        ],
      },
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : "OAuth sign in failed",
    });
  }
};
