import {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
} from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
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

function attr(
  attrs: { Name?: string; Value?: string }[] | undefined,
  name: string,
): string {
  return attrs?.find((a) => a.Name === name)?.Value ?? "";
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

  const cookieHeader = event.headers?.cookie || event.headers?.Cookie;
  const cookies = parseCookies(cookieHeader);
  const accessToken = cookies["accessToken"];

  if (!accessToken) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: "Missing accessToken" }),
    };
  }

  try {
    const result = await cognito.send(
      new GetUserCommand({ AccessToken: accessToken }),
    );

    const user = {
      id: attr(result.UserAttributes, "sub"),
      email: attr(result.UserAttributes, "email"),
      userName: result.Username ?? "",
      firstName: attr(result.UserAttributes, "given_name"),
      lastName: attr(result.UserAttributes, "family_name"),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user }),
    };
  } catch (error: unknown) {
    const err = error as { name?: string };

    if (
      err.name === "NotAuthorizedException" ||
      err.name === "UserNotFoundException"
    ) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Invalid or expired token",
        }),
      };
    }

    console.error("Verify-user error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Internal server error" }),
    };
  }
};
