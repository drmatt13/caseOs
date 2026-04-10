import { UserSchema } from "#/schemas/user";
import type { User } from "#/schemas/user";
import type {
  CognitoIdTokenPayload,
  CognitoAccessTokenPayload,
  CognitoAuthResult,
} from "#/schemas/cognito";

// PLACEHOLDER: Replace with real Cognito auth when user pool is set up
const MOCK_COGNITO_ISS =
  "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_PLACEHOLDER";
const MOCK_CLIENT_ID = "placeholder-client-id";

function mockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa("mock-signature");
  return `${header}.${body}.${signature}`;
}

export default function login(
  username: string,
  password: string,
  userId: string,
): {
  user: User;
  tokens: CognitoAuthResult;
} {
  // TODO: Replace with real Cognito InitiateAuth call
  // Backend returns Set-Cookie with HttpOnly for refresh token,
  // and id/access tokens in response body.

  // PLACEHOLDER LOGIC BELOW

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const idTokenPayload: CognitoIdTokenPayload = {
    sub: userId,
    aud: MOCK_CLIENT_ID,
    email: `${username}@example.com`,
    email_verified: true,
    token_use: "id",
    auth_time: now,
    iss: MOCK_COGNITO_ISS,
    "cognito:username": username,
    exp: expiry,
    iat: now,
    given_name: "test",
    family_name: "user",
  };

  const accessTokenPayload: CognitoAccessTokenPayload = {
    sub: userId,
    token_use: "access",
    scope: "openid profile email",
    auth_time: now,
    iss: MOCK_COGNITO_ISS,
    exp: expiry,
    iat: now,
    client_id: MOCK_CLIENT_ID,
    username: username,
  };

  const tokens: CognitoAuthResult = {
    idToken: mockJwt(idTokenPayload as unknown as Record<string, unknown>),
    accessToken: mockJwt(
      accessTokenPayload as unknown as Record<string, unknown>,
    ),
    refreshToken: btoa(`mock-refresh-${userId}-${now}`),
  };

  document.cookie = `idToken=${tokens.idToken}; path=/;`;
  document.cookie = `accessToken=${tokens.accessToken}; path=/;`;
  document.cookie = `refreshToken=${tokens.refreshToken}; path=/;`;

  // Map Cognito sub → User.id
  return {
    user: {
      id: idTokenPayload.sub,
      userName: idTokenPayload["cognito:username"],
      firstName: idTokenPayload.given_name ?? "",
      lastName: idTokenPayload.family_name ?? "",
      email: idTokenPayload.email,
    },
    tokens,
  };
}
