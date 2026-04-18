# Environment Setup Checklist

Use this checklist to create the required `.env` files for local development across the monorepo.

---

## Prerequisites

Ensure you have the AWS CLI configured before deploying. The CDK CLI uses your AWS CLI profile to automatically populate `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`:

```bash
aws configure
```

---

## Deploy Infrastructure (CDK)

Before setting environment variables, deploy your AWS resources:

```bash
cd cdk-app
npm install
npx cdk deploy
```

## Client App (`client-app/.env`)

```dotenv
# Local mode: http://localhost:8080
# Cloud mode: ApiGatewayStack output key `HttpApiUrl` (for example: https://abc123.execute-api.us-east-1.amazonaws.com/dev)
VITE_API_GATEWAY_URL=http://localhost:8080

# Example: us-east-1
# Source: AWS region used for deployment
VITE_AWS_REGION=us-east-1

# Example: us-east-1_XXXXXXXXX
# Source: CognitoStack output key `UserPoolId`
VITE_USER_POOL_ID=

# Example: 4h57exampleclientid123456
# Source: CognitoStack output key `UserPoolClientId`
VITE_USER_POOL_CLIENT_ID=
```

---

## Local Dev Server (`local-dev-server/.env`)

```dotenv
# Example: us-east-1
# Source: AWS region used for deployment
AWS_REGION=us-east-1

# Same as VITE_USER_POOL_CLIENT_ID from client-app
# Source: CognitoStack output key `UserPoolClientId`
USER_POOL_CLIENT_ID=

# Source: DevLambdaReplayStack output key `ReplayBucketName`
DEV_LAMBDA_REPLAY_BUCKET_NAME=

# Source: DevLambdaReplayStack output key `ReplayQueueUrl`
DEV_LAMBDA_REPLAY_QUEUE_URL=
```

---

## Database Package (`packages/database/.env`)

```dotenv
# Needed when running Prisma CLI commands (for example: `prisma migrate` / `prisma generate`).

# For local Docker postgres: postgresql://app_user:app_password@localhost:5432/app_db
# For cloud mode, prefer RdsStack output key `RdsPrimaryEndpoint`.
DATABASE_URL=
```
