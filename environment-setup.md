# Local Environment Setup Guide

This guide gets a new developer from zero to running local services with the least amount of guesswork.

## Quick Start (Order Matters)

1. Configure AWS CLI (one-time).
2. Deploy CDK resources (or confirm they are already deployed).
3. Create and fill required .env files.
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

## 3) Configure Database Env

Create or update packages/database/.env:

```dotenv
# Used by Prisma CLI and local development tooling.
# Local Docker postgres example:
# postgresql://admin:password@localhost:5432/app_db
DATABASE_URL=
```

Notes:
- For local development, `DATABASE_URL` should usually point at your local Docker Postgres instance, for example `postgresql://admin:password@localhost:5432/app_db`.
- Cloud Lambda functions no longer build their Prisma connection from a manually copied URL. They receive `PRIMARY_DATABASE_SECRET_ARN` and resolve credentials from AWS Secrets Manager at runtime.
- You typically do not need to put the cloud database password into `packages/database/.env` just to run the app locally.

If you need to inspect the cloud RDS credentials secret directly, you can still fetch it with:

```bash
aws secretsmanager get-secret-value \
  --secret-id <RdsCredentialsSecretArn> \
  --query 'SecretString' \
  --output text
```

## 4) Configure Client Env

Create or update client-app/.env:

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

## 5) Review Docker Compose Env Values

Before startup, verify values in docker-compose.yml match your deployed resources and local machine setup.

Important:
- Local Prisma migrations are now handled automatically by Docker Compose via the `prisma-migrate` service.
- `local-api-dev-server` and `langgraph-service` both wait for that migration container to complete successfully before they start.
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
- If the local stack stalls before the API starts, check the `prisma-migrate` container logs first.
- If database migrations fail, confirm `DATABASE_URL` points to the intended local database and that the `postgres` container is healthy.
