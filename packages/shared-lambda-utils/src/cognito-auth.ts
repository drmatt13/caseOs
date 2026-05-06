import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
} from "aws-lambda";
import cookie from "cookie";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type CognitoAuthConfig = {
  audience: string;
  issuer: string;
  jwks: ReturnType<typeof createRemoteJWKSet>;
};

export type AuthenticatedCognitoPayload = JWTPayload & {
  sub: string;
  token_use: string;
};

export type AuthenticatedCognitoSession = {
  idToken: string;
  payload: AuthenticatedCognitoPayload;
};

let cognitoAuthConfig: CognitoAuthConfig | null = null;

const getCognitoAuthConfig = (): CognitoAuthConfig => {
  if (cognitoAuthConfig) {
    return cognitoAuthConfig;
  }

  const { AWS_REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;

  if (!AWS_REGION || !USER_POOL_ID || !USER_POOL_CLIENT_ID) {
    throw new Error("Missing Cognito environment variables");
  }

  const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;

  cognitoAuthConfig = {
    audience: USER_POOL_CLIENT_ID,
    issuer,
    jwks: createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)),
  };

  return cognitoAuthConfig;
};

const getCookieHeader = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): string => event.headers.cookie ?? event.headers.Cookie ?? "";

export async function requireAuthenticatedSession(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<AuthenticatedCognitoSession | null> {
  const idToken = cookie.parse(getCookieHeader(event)).idToken;

  if (!idToken) {
    return null;
  }

  const payload = await verifyCognitoIdToken(idToken);

  if (!payload) {
    return null;
  }

  return {
    idToken,
    payload,
  };
}

export async function verifyCognitoIdToken(
  idToken: string,
): Promise<AuthenticatedCognitoPayload | null> {
  const { audience, issuer, jwks } = getCognitoAuthConfig();
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer,
    audience,
  });

  if (payload.token_use !== "id" || !payload.sub) {
    return null;
  }

  return payload as AuthenticatedCognitoPayload;
}

export async function requireAuthenticatedUser(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<AuthenticatedCognitoPayload | null> {
  return (await requireAuthenticatedSession(event))?.payload ?? null;
}

export async function requireAuthenticatedSub(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<string | null> {
  return (await requireAuthenticatedUser(event))?.sub ?? null;
}
