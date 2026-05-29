import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
} from "aws-lambda";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getCookieHeader, parseCookies } from "./http";

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

export type HttpAuthSessionInput = {
  authorizationHeader?: string | null;
  cookieHeader?: string | null;
};

type ApiGatewayJwtAuthorizerContext = {
  jwt?: {
    claims?: Record<string, unknown>;
  };
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

const getAuthorizationHeader = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): string => event.headers.authorization ?? event.headers.Authorization ?? "";

const getBearerTokenFromAuthorizationHeader = (
  authorizationHeader: string | null | undefined,
): string | null => {
  const authorization = authorizationHeader?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match?.[1]?.trim() || null;
};

const getVerifiedAuthorizerPayload = (
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): AuthenticatedCognitoPayload | null => {
  const requestContext = event.requestContext as {
    authorizer?: ApiGatewayJwtAuthorizerContext;
  };
  const authorizer = requestContext.authorizer;
  const claims = authorizer?.jwt?.claims;

  if (!claims || claims.token_use !== "id" || typeof claims.sub !== "string") {
    return null;
  }

  return claims as AuthenticatedCognitoPayload;
};

export async function requireAuthenticatedSession(
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
): Promise<AuthenticatedCognitoSession | null> {
  const session = await requireAuthenticatedHttpSession({
    authorizationHeader: getAuthorizationHeader(event),
    cookieHeader: getCookieHeader(event),
  });

  if (!session) {
    return null;
  }

  const verifiedAuthorizerPayload = getVerifiedAuthorizerPayload(event);
  if (
    verifiedAuthorizerPayload &&
    verifiedAuthorizerPayload.sub !== session.payload.sub
  ) {
    return null;
  }

  return session;
}

export async function requireAuthenticatedHttpSession({
  authorizationHeader,
  cookieHeader,
}: HttpAuthSessionInput): Promise<AuthenticatedCognitoSession | null> {
  const idToken =
    getBearerTokenFromAuthorizationHeader(authorizationHeader) ??
    parseCookies(cookieHeader ?? "").idToken;

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
  let payload: JWTPayload;

  try {
    ({ payload } = await jwtVerify(idToken, jwks, {
      issuer,
      audience,
    }));
  } catch {
    return null;
  }

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
