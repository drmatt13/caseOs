# Local Environment Setup Guide

This guide gets a new developer from zero to running local services with the least amount of guesswork.

## Quick Start (Order Matters)

1. Configure AWS CLI (one-time).
2. Deploy CDK resources (or confirm they are already deployed).
3. Create and fill required .env files.
4. Run Prisma migration.
5. Sign in to AWS for your dev framework.
6. Start Docker services.

## 1) AWS CLI Prerequisites (One-Time)

Run this once if your machine is not configured yet:

```bash
aws configure
```

Why this matters:
- CDK uses your AWS profile context to resolve account and region defaults.

## 2) Deploy Infrastructure (CDK)

Before local app startup, make sure cloud resources exist and outputs are up to date:

```bash
cd cdk-app
npm install
npx cdk deploy
```

Tip:
- Keep note of outputs like UserPoolId, UserPoolClientId, HttpApiUrl, and DirectDatabaseUrl. You will paste these into env values below.

## 3) Configure Database Env

Create or update packages/database/.env:

```dotenv
# Used by Prisma CLI (prisma generate, prisma migrate) and as runtime fallback.
# Local Docker postgres example:
# postgresql://admin:password@localhost:5432/app_db
# Cloud mode: use RdsStack output key DirectDatabaseUrl.
DATABASE_URL=
```

## 4) Run Prisma Migration

After CDK deploy and DATABASE_URL setup:

```bash
cd packages/database
npx prisma migrate dev
```

## 5) Configure Client Env

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

## 6) Review Docker Compose Env Values

Before startup, verify values in docker-compose.yml match your deployed resources and local machine setup.

## 7) Required Login Before Docker

Your dev framework requires this login before running Docker:

```bash
aws login --profile dev
```

Do this each time your session expires.

## 8) Start Local Services

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
- If database migrations fail, confirm DATABASE_URL points to the intended local or cloud database.
