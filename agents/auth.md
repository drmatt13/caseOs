# Auth Agent

Use this agent when designing, debugging, or refactoring authentication for lawstruct-ai across `client-app`, `local-api-dev-server`, CDK HTTP API Gateway, Cognito, and Lambda handlers.

The goal is to preserve one consistent model:

- Browser and API clients send `Authorization: Bearer <idToken>` to authenticated API routes.
- API Gateway production routes use the native Cognito JWT authorizer.
- Lambda handlers still independently validate the Cognito ID token with `jose`.
- The local dev server mirrors API Gateway route auth and event shape as closely as possible.
- Frontend route guards are for UX only, not security.

## Core Architecture

Dev stack:

- Auth is AWS Cognito deployed through CDK.
- The frontend runs from `client-app`, usually `http://localhost:3000`.
- API calls can target `local-api-dev-server` or the deployed HTTP API.
- `local-api-dev-server` invokes Lambda handlers from `cdk-app/lambda_functions` using an API Gateway-like proxy event.
- Local authenticated routes should validate bearer ID tokens and inject `requestContext.authorizer.jwt.claims` before Lambda invocation.

Prod stack:

- Cognito user pool and app client are deployed by `CognitoStack`.
- Frontend static assets are served by S3 + CloudFront from `FrontendWebsiteS3Stack`.
- HTTP API Gateway is deployed by `HttpApiGatewayStack`.
- Lambda functions are deployed by `SynchronousLambdaFunctionsStack` and `AsynchronousLambdaFunctionsStack`.
- Authenticated HTTP API routes must use the native Cognito user pool/JWT authorizer.
- Lambda handlers should not trust API Gateway claims alone; they should still verify the token with `jose`.

## Route Contract

Browser-safe route constants live in:

```text
packages/api-contract/src/index.ts
```

Use `API_ROUTE` instead of hard-coded route strings wherever possible. This prevents drift between:

- `client-app`
- `local-api-dev-server`
- `cdk-app/lib/http-api-gateway-stack.ts`

Public routes:

- `/sign-in`
- `/sign-out`
- `/oauth/callback`
- `/refresh`
- `/stripe/webhook`

Authenticated routes:

- `/verify-session`
- `/get-user`
- `/graphql`
- `/s3-access-broker`
- `/billing/list-products`
- `/billing/create-setup-intent`
- `/billing/create-subscription`

If a route is added, update the route contract first, then wire it into the client, local server, and CDK route table.

## Token Standard

Authenticated HTTP API calls should use:

```http
Authorization: Bearer <idToken>
```

Use the Cognito ID token for app identity. Do not switch authenticated app routes to access-token auth unless API scopes are intentionally introduced.

Expected ID token properties:

- `token_use` is `id`
- `aud` equals `USER_POOL_CLIENT_ID`
- `iss` equals `https://cognito-idp.<region>.amazonaws.com/<USER_POOL_ID>`
- `sub` exists
- `exp` is still valid

The access token may exist in cookies/storage, but it is not the app identity token for current authenticated HTTP API routes.

## Client Auth

Main file:

```text
client-app/src/lib/auth.ts
```

Important behavior:

- `signInWithGoogle()` builds the Cognito hosted UI URL.
- `getOAuthRedirectUri()` uses `window.location.origin + "/auth/callback"`.
- `completeOAuthSignIn()` posts `code`, `state`, and `redirectUri` to the backend `/oauth/callback`.
- `fetchWithAuthRefresh()` should be used for all authenticated API calls.
- `fetchWithAuthRefresh()` should:
  - validate the locally stored ID token shape before sending it,
  - refresh proactively if the ID token is missing, expired, or invalid,
  - send `Authorization: Bearer <idToken>`,
  - include credentials,
  - retry once after a 401,
  - clear/broadcast auth state if refresh fails.

Frontend route guards:

- `redirectIfAuthenticated` keeps authenticated users off login/register pages.
- `requireAuth` keeps unauthenticated users off app pages.
- These guards are UX helpers only. They are not the security boundary.

## OAuth Flow

Google sign-in flow:

1. Frontend redirects to Cognito hosted UI with:
   - `identity_provider=Google`
   - `response_type=code`
   - `scope=openid email profile`
   - `redirect_uri=<frontend-origin>/auth/callback`
2. Cognito redirects to Google.
3. Google redirects back through Cognito.
4. Cognito redirects to `<frontend-origin>/auth/callback?code=...&state=...`.
5. The frontend route calls backend `/oauth/callback`.
6. Backend exchanges the auth code with Cognito `/oauth2/token`.
7. Backend verifies the Cognito ID token with `jose`.
8. Backend creates or updates the RDS user through Prisma.
9. Backend sets HttpOnly cookies for `idToken`, `accessToken`, and `refreshToken`.
10. Frontend stores usable token hints for bearer auth and navigates to `/`.

Backend file:

```text
cdk-app/lambda_functions/oauth-callback/index.ts
```

Important OAuth details:

- The `redirect_uri` used in the token exchange must exactly match the URI used in the authorize request.
- Cognito app client callback URLs must include every frontend origin plus `/auth/callback`.
- For prod CloudFront testing, the callback URL must include the CloudFront origin.
- For localhost testing against prod, the callback URL must include `http://localhost:3000/auth/callback`.

## Google Profile Picture

The CDK Cognito Google provider requests:

```text
openid email profile
```

and maps:

- Google email to Cognito email
- Google given name to Cognito given name
- Google family name to Cognito family name
- Google picture to Cognito `picture`

Relevant file:

```text
cdk-app/lib/cognito-stack.ts
```

If localhost gets a picture but CloudFront-created users do not, do not assume CloudFront changed Google behavior. Check these first:

- Is the Cognito ID token missing `picture`, or is only the RDS `profilePicture` field null?
- Did the Cognito post-confirmation trigger create the RDS user before `/oauth/callback` updated OAuth profile fields?
- Was the user already created without a profile picture?
- Is the app preserving an existing uploaded/custom profile picture instead of overwriting it with Google’s picture?

Relevant files:

```text
cdk-app/lambda_functions/oauth-callback/index.ts
cdk-app/lambda_functions/cognito-post-confirmation-trigger/index.ts
```

The intended behavior is:

- On create, store Google/Cognito `picture` if present.
- On OAuth sign-in for an existing user, fill `profilePicture` only when it is currently empty.
- Do not overwrite a user-uploaded/custom profile picture with Google’s picture.

## Cookies

Shared helpers live in:

```text
packages/shared-lambda-utils/src/http.ts
```

Auth cookies are HttpOnly and use:

```text
Secure; SameSite=None; Path=/
```

This is required for cross-origin frontend/API usage such as:

- CloudFront frontend to API Gateway
- localhost frontend to prod API Gateway

HTTP API payload format 2.0 supports a top-level `cookies` response array. `jsonResponse()` should support v2 `cookies` while preserving v1-style `multiValueHeaders["Set-Cookie"]` compatibility for local/dev tooling.

## Lambda Verification

Shared auth helpers live in:

```text
packages/shared-lambda-utils/src/cognito-auth.ts
```

Expected verification model:

- Extract bearer token from `Authorization`.
- Fallback to auth cookies when needed.
- Parse API Gateway v2 `cookies`.
- Verify ID token using Cognito JWKS through `jose`.
- Require issuer and audience.
- Require `token_use === "id"`.
- Treat API Gateway authorizer claims as optional context/cross-check only.

Do not accept API Gateway authorizer claims without also verifying the actual token at Lambda level.

Expected Cognito verifier config:

```ts
const issuer = `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`;

cognitoAuthConfig = {
  audience: USER_POOL_CLIENT_ID,
  issuer,
  jwks: createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`)),
};
```

## API Gateway

Main file:

```text
cdk-app/lib/http-api-gateway-stack.ts
```

Rules:

- Public routes should not have the Cognito authorizer.
- Authenticated routes must have the native Cognito authorizer.
- Lambda integrations should use HTTP API payload format `2.0`.
- CORS must allow the deployed frontend origins and `Authorization`.
- Access logs are valuable for distinguishing API Gateway 401s from Lambda 401s.

When production returns:

```json
{"message":"Unauthorized"}
```

first determine where it came from:

- Native API Gateway authorizer 401 means the request likely did not include a valid bearer token in the expected format.
- Lambda-generated 401 means API Gateway likely invoked the Lambda and Lambda auth/session verification failed.
- Lambda should avoid returning 401 for non-auth infrastructure failures, because it makes debugging misleading.

## Local API Dev Server

Main files:

```text
local-api-dev-server/src/index.ts
local-api-dev-server/lib/invokeLambdaFunction.ts
```

The local server should expose route helpers mirroring CDK:

- `addPublicRoute`
- `addAuthenticatedRoute`

For authenticated local routes:

- Accept `Authorization: Bearer <idToken>`.
- Verify the token with the same shared Cognito/JWKS logic as Lambda.
- Return 401 before invoking Lambda when auth fails.
- Inject `requestContext.authorizer.jwt.claims` into the v2 event when auth succeeds.
- Preserve CORS and OPTIONS behavior.

`invokeLambdaFunction` should build APIGatewayProxyEventV2-shaped events by default.

## S3 Access Broker

Main files:

```text
cdk-app/lambda_functions/s3-access-broker/index.ts
cdk-app/lib/synchronous-lambda-functions-stack.ts
```

The S3 broker is authenticated like other routes:

- Native Cognito authorizer at API Gateway.
- Lambda-level `requireAuthenticatedSub()`.

The broker returns short-lived credentials scoped to the current user’s profile picture key:

```text
profile-pictures/<cognito-sub>.jpg
```

Important prod STS lesson:

- Lambda execution role credentials are already session credentials.
- `sts:GetFederationToken` fails from Lambda with:

```text
AccessDenied: Cannot call GetFederationToken with session credentials
```

Use `AssumeRole` in prod:

- CDK creates `ProfilePictureUploadRole`.
- Broker Lambda role can call `sts:AssumeRole` on that role.
- Broker Lambda receives `PROFILE_PICTURE_UPLOAD_ROLE_ARN`.
- The assumed role has only `s3:PutObject` on `profile-pictures/*`.
- The Lambda also passes an inline session policy scoped to the exact user object key.

Auth failures should return 401. STS/S3 broker failures should return 500.

## CloudFront Frontend

Main file:

```text
client-app/vite.config.ts
```

For a Vite SPA hosted at the CloudFront root, use:

```ts
base: "/"
```

Do not use `base: "./"` for this app. With `base: "./"`, a deep link such as:

```text
https://<distribution>.cloudfront.net/auth/callback
```

causes the browser to request JS from:

```text
/auth/assets/<bundle>.js
```

CloudFront can then serve `index.html` as JavaScript through the SPA fallback, producing a white screen before React boots.

After frontend changes:

```powershell
npm --workspace client-app run build
aws s3 sync client-app/dist s3://<FRONTEND_WEBSITE_BUCKET_NAME> --delete --profile dev
aws cloudfront create-invalidation --distribution-id <FRONTEND_DISTRIBUTION_ID> --paths "/*" --profile dev
```

## Env Vars

Frontend `client-app/.env`:

```dotenv
VITE_API_GATEWAY_URL=<HTTP_API_URL>
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=<USER_POOL_ID>
VITE_USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>
VITE_COGNITO_DOMAIN=<COGNITO_DOMAIN_URL>
VITE_API_GATEWAY_WS_URL=<websocket-url-if-enabled>
VITE_STRIPE_PUBLISHABLE_KEY=<publishable-key-if-billing-ui-enabled>
```

Root `.env` generated by CDK exports includes:

- `FRONTEND_WEBSITE_URL`
- `FRONTEND_WEBSITE_BUCKET_NAME`
- `FRONTEND_DISTRIBUTION_ID`
- `HTTP_API_URL`
- `COGNITO_DOMAIN_URL`
- `USER_POOL_ID`
- `USER_POOL_CLIENT_ID`

Do not put backend-only secrets in `client-app/.env`.

## Deployment Commands

Prod-mode CDK deploy:

```powershell
npx cdk deploy --all -c useLocalDevStack=false -c frontendUrl=http://localhost:3000 -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --require-approval never --profile=dev
```

Auth Lambda-only deploy after OAuth/session changes:

```powershell
npx cdk deploy AsynchronousLambdaFunctionsStack SynchronousLambdaFunctionsStack HttpApiGatewayStack -c useLocalDevStack=false -c frontendUrl=http://localhost:3000 -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --require-approval never --profile=dev
```

Frontend publish:

```powershell
npm --workspace client-app run build
aws s3 sync client-app/dist s3://<FRONTEND_WEBSITE_BUCKET_NAME> --delete --profile dev
aws cloudfront create-invalidation --distribution-id <FRONTEND_DISTRIBUTION_ID> --paths "/*" --profile dev
```

## Verification Commands

Run focused checks after auth changes:

```powershell
npx tsc --noEmit -p packages\api-contract\tsconfig.json
npx tsc --noEmit -p packages\shared-lambda-utils\tsconfig.json
npx tsc --noEmit -p local-api-dev-server\tsconfig.json
npm --workspace cdk-app run build
npm --workspace client-app run build
```

For specific Lambda changes:

```powershell
npx tsc --noEmit -p cdk-app\lambda_functions\oauth-callback\tsconfig.json
npx tsc --noEmit -p cdk-app\lambda_functions\s3-access-broker\tsconfig.json
npx tsc --noEmit -p cdk-app\lambda_functions\cognito-post-confirmation-trigger\tsconfig.json
```

CDK synth with prod flags:

```powershell
npx cdk synth --all -c useLocalDevStack=false -c frontendUrl=http://localhost:3000 -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --profile=dev
```

## Troubleshooting

Fresh sign-in succeeds from localhost but fails from CloudFront:

- Check CloudFront deep-link asset paths.
- Confirm `client-app/vite.config.ts` has `base: "/"`.
- Rebuild, sync S3, and invalidate CloudFront.
- Confirm `VITE_API_GATEWAY_URL` points to API Gateway, not CloudFront.

Cognito redirect mismatch:

- Confirm Cognito callback URLs include the exact frontend origin plus `/auth/callback`.
- Confirm the frontend sends the same `redirect_uri` to authorize and backend token exchange.
- Confirm `frontendUrl` CDK context and `FRONTEND_WEBSITE_URL` are both trusted as needed.

API Gateway returns 401 before Lambda logs:

- Confirm the request includes `Authorization: Bearer <idToken>`.
- Confirm the token is an ID token, not access token.
- Confirm `aud`, `iss`, and region/user pool/client ID match the deployed stack.
- Confirm the route is in the authenticated route list and uses the Cognito authorizer.

Lambda returns 401:

- Check shared token extraction from bearer and cookies.
- Check v2 cookie parsing.
- Check `USER_POOL_ID`, `USER_POOL_CLIENT_ID`, and `AWS_REGION` Lambda env vars.
- Check whether refresh failed and client auth state was cleared.

OAuth callback returns HTML/non-JSON:

- `VITE_API_GATEWAY_URL` is likely wrong.
- It should be the HTTP API URL, for example `https://<api-id>.execute-api.<region>.amazonaws.com`.

OAuth callback returns 500:

- Check CloudWatch logs for `/oauth/callback`.
- Common causes are missing Prisma tables, RDS connectivity, missing Cognito env vars, or bad token exchange.
- If tables are missing in a new prod RDS, run Prisma `db push` or migrations.

`/s3-access-broker` returns 401 but `/graphql` works:

- Check Lambda logs before assuming Cognito failure.
- If logs show `Cannot call GetFederationToken with session credentials`, the broker needs the prod `AssumeRole` path and CDK role/env wiring.

Profile picture missing for Google users:

- Decode the ID token and see whether `picture` exists.
- If `picture` exists in the token but not GraphQL `currentUser.user.profilePicture`, check RDS update flow.
- The post-confirmation trigger and OAuth callback can race; both should handle `picture`.
- Existing users may need another OAuth login after the fix to backfill.

CORS failure:

- The browser origin must exactly match a trusted frontend URL, including scheme and port.
- API Gateway CORS must allow `Authorization`.
- Cookies require `Access-Control-Allow-Credentials: true` and non-wildcard origin.

## Design Guardrails

- Keep API route names centralized in `@repo/api-contract`.
- Keep token validation centralized in `@repo/shared-lambda-utils`.
- Keep frontend guards cache-friendly but do not treat them as authorization.
- Keep local server behavior close to API Gateway behavior.
- Prefer ID-token bearer auth until route-level OAuth scopes become a real requirement.
- Avoid returning 401 for infrastructure errors after authentication has succeeded.
- Do not log raw tokens or secrets.
