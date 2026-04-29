# Matt's CDK Dev Kit

A full-stack, local-first AWS application framework for building serverless and container-based TypeScript apps without spending the first weeks of a project reassembling infrastructure, auth, local emulation, and shared types.

The kit runs a local Postgres database, Prisma schema, API Gateway-like Lambda dev servers, WebSocket routes, container services, Cognito auth, and a TanStack frontend from one monorepo. The same codebase deploys to real AWS infrastructure through CDK.

## What It Gives You

- **Local-first AWS development**: Docker Compose runs Postgres, Prisma generation/migrations, local API Lambda invocation, local WebSocket Lambda invocation, pgAdmin, and a WebSocket tester.
- **API Gateway behavior locally**: Express and WebSocket dev servers construct Lambda-shaped events, preserve headers/cookies/query strings, and normalize local cookie behavior for browser development.
- **Sync, async, and WebSocket Lambda workflows**: HTTP routes, Cognito triggers, replayable event-driven functions, and API Gateway WebSocket-style routes live in one TypeScript workspace.
- **Cloud invocation replay**: async Lambdas can capture real cloud invocations to S3; S3 notifications fan into SQS; a local poller replays the original invocation locally for accurate debugging.
- **Fast container iteration**: Fargate-style container services can be rebuilt and run locally through Docker instead of waiting on repeated CDK deploys.
- **Production-grade auth foundation**: Cognito login, registration, email verification, password reset, Google OAuth, refresh-token handling, HttpOnly cookies, session sync, and route guards are already wired.
- **Shared data model and types**: Prisma and Zod schemas live in `packages/database` and are consumed across frontend and backend boundaries.
- **CDK-defined infrastructure**: Cognito, API Gateway, Lambda, RDS, ECS/Fargate, WebSocket APIs, S3, and SQS are modeled in CDK stacks.

## Repository Layout

```txt
client-app/                              TanStack React app with Cognito auth
cdk-app/                                 AWS CDK app, Lambda functions, ECS containers
cdk-app/lambda_functions/                HTTP, Cognito, OAuth, and WebSocket Lambdas
cdk-app/ecs_containers/langgraph-service Example Fargate-style service
local-api-dev-server/                    Local API Gateway/Lambda emulator
local-ws-dev-server/                     Local API Gateway WebSocket emulator
frontend-ws-connection-and-payload-tester Local WebSocket test UI
packages/database/                       Prisma schema, generated client, Zod schemas
packages/shared-lambda-utils/            Database and event replay utilities
docker-compose.yml                       Local development orchestration
```

## Adding Lambda Functions

When you create a new Lambda under `cdk-app/lambda_functions`, wire it in two places:

1. Add it to the matching CDK stack:
   - async/event-driven Lambda: `cdk-app/lib/asynchronous-lambda-functions-stack.ts`
   - HTTP/synchronous Lambda: `cdk-app/lib/synchronous-lambda-functions-stack.ts`
   - WebSocket Lambda: `cdk-app/lib/websocket-lambda-functions-stack.ts`
2. Add it to the matching local dev server:
   - HTTP/synchronous Lambda: `local-api-dev-server/src/index.ts`
   - async/event-driven Lambda replay: `local-api-dev-server/src/invokeAsyncLambdaFunctions.ts`
   - WebSocket Lambda: `local-ws-dev-server/src/index.ts`

This keeps local execution and deployed infrastructure moving together.

## Prerequisites

- Node.js and npm
- Docker Desktop
- AWS CLI configured with a `dev` profile
- AWS CDK credentials for your target account and region

One-time AWS CLI setup:

```bash
aws configure --profile dev
```

When your AWS session expires:

```bash
aws login --profile dev
```

## First Cloud Deploy

Deploy once without Google credentials first. This creates Cognito and outputs the provider redirect URI that Google needs.

```bash
cd cdk-app
npm install
npx cdk deploy --all \
  -c useCustomWsAuthorizer=true \
  -c enableWebSockets=true \
  -c skipEmailVerification=true \
  --require-approval never \
  --profile dev
```

Record these stack outputs:

- `CognitoStack.UserPoolId`
- `CognitoStack.UserPoolClientId`
- `CognitoStack.UserPoolDomainUrl`
- `CognitoStack.OAuthProviderRedirectUri`
- `DevLambdaReplayStack.ReplayBucketName`
- `DevLambdaReplayStack.ReplayQueueUrl`
- `WebSocketApiStack.WebSocketAPIEndpoint` if WebSockets are enabled
- `HttpApiGatewayStack.HttpApiUrl` for cloud-mode frontend calls

## Google OAuth Setup

Google needs Cognito's provider callback, not your React callback.

1. Deploy the stack once without Google context.
2. Copy `CognitoStack.OAuthProviderRedirectUri`.
3. In Google Cloud Console, create an OAuth Web Client.
4. Add the copied value to **Authorized redirect URIs**. It should look like:

```txt
https://<cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse
```

5. Redeploy with Google context:

```bash
npx cdk deploy --all \
  -c useCustomWsAuthorizer=true \
  -c enableWebSockets=true \
  -c skipEmailVerification=true \
  -c googleClientId=<GOOGLE_CLIENT_ID> \
  -c googleClientSecret=<GOOGLE_CLIENT_SECRET> \
  --require-approval never \
  --profile dev
```

PowerShell single-line form:

```powershell
npx cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true -c googleClientId=<GOOGLE_CLIENT_ID> -c googleClientSecret=<GOOGLE_CLIENT_SECRET> --require-approval never --profile dev
```

CDK context values must be `key=value`, not `key value`.

## Frontend Environment

Create `client-app/.env`:

```dotenv
# Local mode: http://localhost:8080
# Cloud mode: HttpApiGatewayStack output key HttpApiUrl
VITE_API_GATEWAY_URL=http://localhost:8080

VITE_AWS_REGION=us-east-1

# Source: CognitoStack output key UserPoolId
VITE_USER_POOL_ID=<USER_POOL_ID>

# Source: CognitoStack output key UserPoolClientId
VITE_USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>

# Source: CognitoStack output key UserPoolDomainUrl
VITE_COGNITO_DOMAIN=<COGNITO_DOMAIN_URL>
```

## Docker Compose Configuration

Update placeholders in `docker-compose.yml` after CDK deploy:

```yaml
x-cognito-env: &cognito-env
  USER_POOL_ID: "<USER_POOL_ID>"
  USER_POOL_CLIENT_ID: "<USER_POOL_CLIENT_ID>"
  COGNITO_DOMAIN_URL: "<COGNITO_DOMAIN_URL>"

x-local-api-dev-server-env: &local-api-dev-server-env
  DEV_LAMBDA_REPLAY_BUCKET_NAME: "<DEV_LAMBDA_REPLAY_BUCKET_NAME>"
  DEV_LAMBDA_REPLAY_QUEUE_URL: "<DEV_LAMBDA_REPLAY_QUEUE_URL>"

x-frontend-ws-connection-and-payload-tester-env: &frontend-ws-connection-and-payload-tester-env
  VITE_API_GATEWAY_WS_URL: "wss://<WEB_SOCKET_API_ENDPOINT>?token="
```

On Windows, the AWS credentials volume should use:

```yaml
source: ${USERPROFILE}/.aws
```

On macOS/Linux, switch it to:

```yaml
source: ${HOME}/.aws
```

## Start Local Services

From the repo root:

```bash
docker-compose up --build
```

Docker Compose handles:

- root workspace dependency install
- Prisma client generation
- local Prisma migration or `db push`
- local Postgres startup
- local API Lambda dev server startup
- local WebSocket Lambda dev server startup
- local container service startup

Useful local endpoints:

- Frontend app: run separately with `npm run dev --workspace client-app`
- Local API dev server: `http://localhost:8080`
- Local WebSocket dev server: `ws://localhost:8081`
- WebSocket tester: `http://localhost:3001`
- pgAdmin: `http://localhost:5050`
- Postgres: `localhost:5432`, database `app_db`, user `admin`, password `password`

## Run the Frontend

In another terminal:

```bash
npm run dev --workspace client-app
```

Open:

```txt
http://localhost:3000
```

The auth flow uses Cognito Hosted UI for Google and returns to:

```txt
http://localhost:3000/auth/callback
```

The callback posts the Cognito auth code to `/oauth/callback`, where a Lambda exchanges it for tokens, sets HttpOnly cookies, and upserts the app user.

## Local API Without Docker

If you run `local-api-dev-server` directly on the host, create `local-api-dev-server/.env`:

```dotenv
AWS_REGION=us-east-1
USER_POOL_ID=<USER_POOL_ID>
USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>
COGNITO_DOMAIN_URL=<COGNITO_DOMAIN_URL>
PRIMARY_DATABASE_URL=postgresql://admin:password@localhost:5432/app_db
```

Then run:

```bash
npm run dev --workspace local-api-dev-server
```

## Database Workflow

For normal local development, do not manually generate Prisma or run migrations. Docker Compose does it:

- `root-deps` installs workspace dependencies.
- `prisma-generate` generates Prisma clients.
- `prisma-migrate` applies migrations or runs `prisma db push`.
- app services wait for those steps.

If you are not using Docker, generate Prisma manually:

```bash
cd packages/database
npm install
npx prisma generate
```

For cloud mode, Lambdas use `PRIMARY_DATABASE_SECRET_ARN` and resolve credentials through Secrets Manager.

## Event Replay Workflow

Event-driven cloud Lambdas can call `captureEventDrivenInvocation` at the top of the handler.

The replay pipeline is:

```txt
Cloud Lambda invocation
-> capture original event to S3
-> S3 object-created notification to SQS
-> local poller reads SQS
-> local dev server invokes matching Lambda handler with original event
```

This gives you cloud-accurate payloads while debugging locally.

## WebSocket Workflow

The local WebSocket server mirrors API Gateway WebSocket routing:

- `$connect`
- `$disconnect`
- `$default`
- custom message routes using `body.action`
- optional custom authorizer
- local `/ingest` route for sending payloads to a connection id

Use the WebSocket tester at `http://localhost:3001` to exercise the local and cloud WebSocket APIs.

## Common Commands

Build CDK:

```bash
npm run build --workspace cdk-app
```

Build frontend:

```bash
npm run build --workspace client-app
```

Compile OAuth callback Lambda:

```bash
npm run compile --workspace cdk-app/lambda_functions/oauth-callback
```

Deploy all stacks:

```bash
cd cdk-app
npx cdk deploy --all --require-approval never --profile dev
```

## Troubleshooting

- **`Context argument is not an assignment`**: use `-c key=value`, not `-c key value`.
- **Google sign-in reaches `/auth/callback` but does not complete**: restart the frontend and local API dev server after changing `.env` values.
- **OAuth callback returns non-JSON or HTML**: verify `VITE_API_GATEWAY_URL` points at `http://localhost:8080`, and verify the local API has `COGNITO_DOMAIN_URL`.
- **`An account already exists with this email`**: Cognito and Postgres are out of sync, or an email/password account exists and has not been explicitly linked to Google. In dev, delete or update the local `users` row. In production, implement explicit account linking.
- **AWS calls fail in containers**: run `aws login --profile dev` and restart services.
- **Local stack stalls before API starts**: check `root-deps`, `prisma-generate`, and `prisma-migrate` logs in that order.
- **Database migrations fail**: confirm the Postgres container is healthy and `DATABASE_URL` points to the intended local database.

## Notes on Secrets

Do not commit Google client secrets, database secrets, or AWS credentials. The current CDK context flow accepts `googleClientSecret` for development convenience, but a production hardening pass should move OAuth provider secrets into Secrets Manager or SSM.
