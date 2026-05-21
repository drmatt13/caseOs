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
  getUserPoolClientId,
  jsonResponse,
  makeAuthCookie,
  optionsResponse,
  parseJsonBody,
} from "@repo/shared-lambda-utils";

const cognito = new CognitoIdentityProviderClient({});

interface SignInBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export const lambdaHandler = async (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  const userPoolClientId = getUserPoolClientId();
  if (!userPoolClientId) {
    console.error("Missing USER_POOL_CLIENT_ID environment variable");
    return jsonResponse(500, {
      success: false,
      error: "Auth service is not configured",
    });
  }

  if (getHttpMethod(event) === "OPTIONS") {
    return optionsResponse();
  }

  let body: SignInBody;
  try {
    body = parseJsonBody<SignInBody>(event.body);
  } catch {
    return jsonResponse(400, { success: false, error: "Invalid request body" });
  }

  const { email, password } = body;
  const rememberMe = body.rememberMe === true;
  if (!email || !password) {
    return jsonResponse(400, {
      success: false,
      error: "Email and password are required",
    });
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
      return jsonResponse(401, {
        success: false,
        error: "Authentication failed",
      });
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

    return jsonResponse(
      200,
      {
        success: true,
        user,
        idToken: auth.IdToken,
        accessToken: auth.AccessToken,
      },
      {
        multiValueHeaders: {
          "Set-Cookie": [
            makeAuthCookie("idToken", auth.IdToken, accessMaxAge),
            makeAuthCookie("accessToken", auth.AccessToken, accessMaxAge),
            makeAuthCookie("refreshToken", auth.RefreshToken, refreshMaxAge),
          ],
        },
      },
    );
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };

    if (
      err.name === "NotAuthorizedException" ||
      err.name === "UserNotFoundException"
    ) {
      return jsonResponse(401, {
        success: false,
        error: "Incorrect email or password",
      });
    }

    if (err.name === "UserNotConfirmedException") {
      return jsonResponse(403, {
        success: false,
        error: "Please verify your email before signing in",
      });
    }

    console.error("Sign-in error:", err);
    return jsonResponse(500, {
      success: false,
      error: "Internal server error",
    });
  }
};
