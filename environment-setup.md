# Environment Setup Checklist

Use this checklist to create the required `.env` files for local development across the monorepo.

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
# Example: https://abc123.execute-api.us-east-1.amazonaws.com/dev
VITE_API_GATEWAY_URL=

# Example: us-east-1
VITE_AWS_REGION=

# Example: us-east-1_XXXXXXXXX
VITE_USER_POOL_ID=

# Example: 4h57exampleclientid123456
VITE_USER_POOL_CLIENT_ID=
```

---

## Local Dev Server (`local-dev-server/.env`)

```dotenv
# Same as VITE_USER_POOL_CLIENT_ID from client-app
USER_POOL_CLIENT_ID=
```

---

## Database Package (`packages/database/.env`)

```dotenv
DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db
```
