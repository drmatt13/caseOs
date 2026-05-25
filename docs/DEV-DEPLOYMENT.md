# DEV DEPLOYMENT

## 1. Configure `/cdk-app/.env`
`/cdk-app/.env:`

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Trusted frontend origin for Cognito callbacks/logout and CORS.
LOCAL_DEV_URL=
```

Do not commit real secrets. For dev deployments, `LOCAL_DEV_URL` should point to
the local frontend origin used for callback, logout, and CORS configuration.

## 2. Deploy dev infrastructure to AWS
`/cdk-app:` 
```bash
cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never --profile=dev
```

## 3. Generate `/.env` from CDK outputs
`/:`

```bash
npm run export:cdk-outputs:profile-dev
```

If the profile-dev alias is not present in `package.json`, use the existing
script directly:

```bash
npm run export:cdk-outputs:aws-profile-dev
```

The generated root `.env` should include values such as:

```dotenv
APPLICATION_DATA_BUCKET_NAME=
FRONTEND_WEBSITE_BUCKET_NAME=
USER_POOL_ID=
USER_POOL_CLIENT_ID=
COGNITO_DOMAIN_URL=
VITE_API_GATEWAY_WS_URL=
```

## 4. Manually port relevant variables from `/.env` into `/client-app/.env`
`/.env` -> `/client-app/.env`

```bash
# Local mode: http://localhost:8080
# Cloud mode: HttpApiGatewayStack output key HttpApiUrl
VITE_API_GATEWAY_URL=http://localhost:8080

VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=<USER_POOL_ID>
VITE_USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>
VITE_COGNITO_DOMAIN=<COGNITO_DOMAIN_URL>

# Required when enableWebSockets=true
VITE_API_GATEWAY_WS_URL=<VITE_API_GATEWAY_WS_URL>

VITE_STRIPE_PUBLISHABLE_KEY=<provided separately>
```

Do not copy backend-only secrets into `/client-app/.env`; every `VITE_` value is
browser-exposed.

## 5. Start local infrastructure and backend services
`/:` 
```bash
docker-compose up --build
```

This builds and starts the local Docker Compose development stack.

### One-time initialization services
- Install root workspace dependencies
- Generate the Prisma client
- Synchronize the local database schema

### Long-running development services
- PostgreSQL
- pgAdmin
- Local API Gateway / Lambda emulation server
- LangGraph service
- Local WebSocket server
- WebSocket tester frontend

## 6. Start the frontend development server
`/client-app:` 
```bash
npm run dev
```
