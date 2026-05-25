# Matt's CDK Dev Kit

A full-stack TypeScript monorepo for building AWS-backed apps with local
development, shared contracts, Lambda functions, Prisma, Cognito auth, and a
React frontend in one workspace.

This document is a repo orientation guide. For deployment steps, use:

- `docs/DEV-DEPLOYMENT.md`
- `docs/PROD-DEPLOYMENT.md`

## What It Gives You

- **One monorepo for app, infra, and shared code**: frontend, CDK stacks,
  Lambda functions, local emulators, Prisma, and shared packages live together.
- **AWS-shaped local development**: local HTTP and WebSocket servers invoke the
  same Lambda handlers that CDK deploys.
- **Shared browser-safe route contracts**: API paths live in
  `packages/api-contract` and are consumed by the frontend, local API server,
  and CDK HTTP API stack.
- **Shared Lambda utilities**: auth, database URL resolution, HTTP responses,
  cookies, and event replay helpers live in `packages/shared-lambda-utils`.
- **Prisma-centered data layer**: `packages/database` owns `schema.prisma`,
  generated Prisma/Pothos output, and API-facing schemas.
- **CDK-defined cloud infrastructure**: stacks model Cognito, API Gateway,
  Lambda, WebSocket APIs, S3, RDS, ECS, CloudFront, and local replay resources.

## Repository Layout

```txt
client-app/                                Vite + React + TanStack frontend
cdk-app/                                   AWS CDK app and infrastructure stacks
cdk-app/bin/cdk-app.ts                     Stack composition and CDK context flags
cdk-app/lib/                               CDK stack definitions
cdk-app/lambda_functions/                  Lambda workspaces, one folder per function
cdk-app/ecs_containers/                    Container service workspaces
local-api-dev-server/                      Local HTTP API Gateway/Lambda emulator
local-ws-dev-server/                       Local WebSocket API Gateway emulator
frontend-ws-connection-and-payload-tester/ WebSocket test UI
packages/api-contract/                     Shared browser-safe API route constants
packages/database/                         Prisma schema, generated clients, API schemas
packages/shared-lambda-utils/              Shared Lambda auth, DB, HTTP, replay helpers
scripts/                                   Repo automation scripts
docs/                                      Architecture and deployment docs
docker-compose.yml                         Local service orchestration
```

## Monorepo Model

The root `package.json` declares npm workspaces for:

- `client-app`
- `cdk-app`
- `cdk-app/lambda_functions/*`
- `cdk-app/ecs_containers/*`
- `packages/*`
- `local-api-dev-server`
- `local-ws-dev-server`
- `frontend-ws-connection-and-payload-tester`

Shared packages are referenced with workspace dependencies such as
`@repo/api-contract`, `@repo/database`, and `@repo/shared-lambda-utils`.

Useful workspace commands:

```bash
npm --workspace cdk-app run build
npm --workspace client-app run build
npm --workspace @repo/database run generate
npm --workspace cdk-app/lambda_functions/graphql-api run compile
```

## Updating HTTP Lambda Functions

HTTP Lambda handlers live in `cdk-app/lambda_functions/<function-name>/`.
Each function is its own workspace with an `index.ts`, `package.json`, and
`tsconfig.json`.

When adding or changing an HTTP route, keep these files aligned:

- `packages/api-contract/src/index.ts`: add or update the shared `API_ROUTE`
  entry and place it in the public or authenticated route list.
- `cdk-app/lambda_functions/<function-name>/index.ts`: implement the Lambda
  handler.
- `cdk-app/lib/synchronous-lambda-functions-stack.ts`: create or update the
  deployed Lambda construct.
- `cdk-app/lib/http-api-gateway-stack.ts`: attach the Lambda to the HTTP API
  route using `API_ROUTE`.
- `local-api-dev-server/src/index.ts`: import the same handler and register it
  with `addPublicRoute` or `addAuthenticatedRoute`.
- `client-app/`: call the route through the shared contract instead of
  hard-coding paths.

Authenticated routes should use the shared auth helpers in
`@repo/shared-lambda-utils` rather than trusting frontend route guards.

## Updating Async and Cognito Lambdas

Async/event-driven and Cognito trigger Lambdas also live under
`cdk-app/lambda_functions/`, but they are wired through the async stack.

Check these files when updating that class of function:

- `cdk-app/lib/asynchronous-lambda-functions-stack.ts`
- `cdk-app/lib/cognito-stack.ts` for Cognito trigger attachment
- `local-api-dev-server/src/invokeAsyncLambdaFunctions.ts` for local replay
- `packages/shared-lambda-utils/src/event-replay.ts` when using invocation
  capture/replay helpers

## Updating WebSocket Lambdas

WebSocket route handlers live beside the other Lambda functions, commonly named
`ws-*-route`.

When adding or changing a WebSocket route, check:

- `cdk-app/lib/websocket-lambda-functions-stack.ts`: Lambda constructs
- `cdk-app/lib/websocket-api-stack.ts`: WebSocket API route integrations
- `local-ws-dev-server/src/index.ts`: local route dispatch
- `frontend-ws-connection-and-payload-tester/`: tester behavior, if the route
  needs a manual testing UI

The local WebSocket server mirrors API Gateway route keys such as `$connect`,
`$disconnect`, `$default`, and custom actions sent in the message body.

## Updating `schema.prisma`

The Prisma schema lives at:

```txt
packages/database/prisma/schema.prisma
```

Keep schema changes centered in `packages/database`; do not duplicate model
definitions in Lambda or frontend code. After changing the schema, regenerate
the database package:

```bash
npm --workspace @repo/database run generate
```

Then update any affected consumers:

- Lambda handlers that import `@repo/database`
- GraphQL/Pothos code that uses generated database types
- API schemas in `packages/database/src/api.schemas.ts`
- Frontend queries, mutations, or UI code that depend on the changed data shape

Use the migration or `db push` workflow documented in the deployment guides for
the environment you are working against.

## Shared Contracts

Prefer shared packages over local string duplication:

- Route paths: `packages/api-contract/src/index.ts`
- Database client, generated types, and API schemas: `packages/database`
- Lambda auth, database URL resolution, cookies, responses, and replay:
  `packages/shared-lambda-utils`

This keeps the frontend, local emulators, Lambda handlers, and CDK routes from
drifting apart.

## Deployment Docs

Deployment details intentionally live outside this orientation doc:

- Dev/local deployment: `docs/DEV-DEPLOYMENT.md`
- Production/cloud deployment: `docs/PROD-DEPLOYMENT.md`

Those docs cover `.env` setup, CDK deploy flags, CDK output export, Prisma
database updates, frontend environment values, Docker Compose, frontend build,
and S3/CloudFront publish steps.
