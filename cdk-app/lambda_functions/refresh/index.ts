import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  getHttpMethod,
  getCookieHeader,
  getUserPoolClientId,
  jsonResponse,
  makeAuthCookie,
  optionsResponse,
  parseCookies,
} from "@repo/shared-lambda-utils";

const cognito = new CognitoIdentityProviderClient({});

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  if (getHttpMethod(event) === "OPTIONS") {
    return optionsResponse();
  }

  const userPoolClientId = getUserPoolClientId();
  if (!userPoolClientId) {
    console.error("Missing USER_POOL_CLIENT_ID environment variable");
    return jsonResponse(500, {
      success: false,
      error: "Auth service is not configured",
    });
  }

  const cookies = parseCookies(getCookieHeader(event));
  const refreshToken = cookies["refreshToken"];

  if (!refreshToken) {
    return jsonResponse(401, {
      success: false,
      error: "Missing refresh token",
    });
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
      return jsonResponse(401, { success: false, error: "Refresh failed" });
    }

    const accessMaxAge = auth.ExpiresIn ?? 3600;

    return jsonResponse(
      200,
      {
        success: true,
        idToken: auth.IdToken,
        accessToken: auth.AccessToken,
      },
      {
        cookies: [
          makeAuthCookie("idToken", auth.IdToken, accessMaxAge),
          makeAuthCookie("accessToken", auth.AccessToken, accessMaxAge),
        ],
      },
    );
  } catch (error: unknown) {
    const err = error as { name?: string };

    if (err.name === "NotAuthorizedException") {
      return jsonResponse(401, {
        success: false,
        error: "Refresh token expired or invalid",
      });
    }

    console.error("Refresh error:", error);
    return jsonResponse(500, {
      success: false,
      error: "Internal server error",
    });
  }
};
