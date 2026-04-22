# Local Environment Setup Guide

This guide gets a new developer from zero to running local services with the least amount of guesswork.

## Quick Start (Order Matters)

1. Configure AWS CLI (one-time).
2. Deploy CDK resources (or confirm they are already deployed).
3. Create and fill required client env files.
4. Sign in to AWS for your dev framework.
5. Start Docker services.

## 1) AWS CLI Prerequisites (One-Time)

Run this once if your machine is not configured yet:

```bash
aws configure
```

Why this matters:
- CDK uses your AWS profile context to resolve account and region defaults.

## 2) Deploy Infrastructure (CDK)

Before client-app startup, make sure cloud resources exist and outputs are up to date:

```bash
cd cdk-app
npm install
npx cdk deploy
```

Tip:
- Keep note of outputs like `UserPoolId`, `UserPoolClientId`, `HttpApiUrl`, and `RdsCredentialsSecretArn`. You will paste these into env values below.

## 3) Database Env: Local vs Cloud Mode

For normal local development, you can skip manual database env setup.

Why:
- `docker-compose.yml` already provides the local database connection for the app containers.
- Root workspace dependencies are installed automatically by the `root-deps` service during `docker-compose up`.
- Prisma client generation is handled automatically by the `prisma-generate` service before app services start.
- Local Prisma migrations are handled automatically by the `prisma-migrate` service during `docker-compose up`.
- You do not need to manually populate `packages/database/.env` just to run the local Docker stack.

Only do manual database credential setup if you are intentionally working in cloud mode with `useLocalImplementations=false` in [cdk-app.ts](</d:/code/Agentic%20+%20ML/caseOs/cdk-app/bin/cdk-app.ts:62>).

In that case, the cloud Lambdas use `PRIMARY_DATABASE_SECRET_ARN` and resolve the database credentials from AWS Secrets Manager at runtime.

If you need to inspect the RDS credentials secret directly, fetch it with:

```bash
aws secretsmanager get-secret-value \
  --secret-id <RdsCredentialsSecretArn> \
  --query 'SecretString' \
  --output text
```

If you specifically need Prisma CLI on your host machine to target a database outside Docker, create or update `packages/database/.env`:

```dotenv
# Example direct database URL
DATABASE_URL=postgresql://<username>:<password>@<rds-endpoint>:5432/app_db
```

That host-side `.env` is optional for the Docker-based local workflow.

## 4) Configure Client Env

Create or update `client-app/.env`:

```dotenv
# Local mode: http://localhost:8080
# Cloud mode: ApiGatewayStack output key HttpApiUrl
VITE_API_GATEWAY_URL=http://localhost:8080

# Example: us-east-1
VITE_AWS_REGION=us-east-1

# Source: CognitoStack output key UserPoolId
VITE_USER_POOL_ID=

# Source: CognitoStack output key UserPoolClientId
VITE_USER_POOL_CLIENT_ID=
```

Standard local env files used in this repo:
- `packages/database/.env`
- `client-app/.env`

## 5) Review Docker Compose Env Values

Before startup, verify values in docker-compose.yml match your deployed resources and local machine setup.

Important:
- Root workspace dependency installation is handled automatically by Docker Compose via the `root-deps` service.
- Prisma client generation is handled automatically by Docker Compose via the `prisma-generate` service.
- Local Prisma migrations are handled automatically by Docker Compose via the `prisma-migrate` service.
- `local-api-dev-server` waits for both Prisma generation and migrations to complete successfully before it starts.
- `langgraph-service` waits for Prisma migrations to complete successfully before it starts.
- You should not need to run `npx prisma migrate dev` manually for normal local startup.

## 6) Required Login Before Docker

Your dev framework requires this login before running Docker:

```bash
aws login --profile dev
```

Do this each time your session expires.

## 7) Start Local Services

Run from repository root:

```bash
docker-compose up --build
```

Useful endpoints after startup:
- Local API dev server: http://localhost:8080
- Local WS dev server: ws://localhost:8081
- WS tester frontend: http://localhost:3001
- pgAdmin: http://localhost:5050

## Troubleshooting

- If AWS-related calls fail inside containers, run aws login --profile dev again and restart services.
- If dependency mismatch appears in containers, rebuild with docker-compose up --build.
- If the local stack stalls before the API starts, check the `root-deps`, `prisma-generate`, and `prisma-migrate` container logs in that order.
- If database migrations fail, confirm `DATABASE_URL` points to the intended local database and that the `postgres` container is healthy.
