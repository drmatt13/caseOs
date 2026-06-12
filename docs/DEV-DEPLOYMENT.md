# DEV DEPLOYMENT

## 1. Configure `/cdk-app/.env`
`/cdk-app/.env:`

```bash
# Namespaces CDK stack names, CloudFormation exports, Cognito domain fallback,
# and shared resource names so multiple deployments can coexist.
CDK_APP_NAME=

STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional custom Cognito hosted UI domain.
# Set both values together, or leave both empty to use the generated
# *.auth.<region>.amazoncognito.com domain.
COGNITO_DOMAIN_NAME=
COGNITO_DOMAIN_CERTIFICATE_ARN=

# Trusted frontend origin for Cognito callbacks/logout and CORS.
LOCAL_DEV_URL=

# Set this to "x86_64" or "arm64"
LAMBDA_ARCHITECTURE=
```

Do not commit real secrets. `CDK_APP_NAME` should match the value passed to
`npm run export:cdk-outputs --cdkAppName=...`. For dev deployments,
`LOCAL_DEV_URL` should point to the local frontend origin used for callback,
logout, and CORS configuration.

Leave `COGNITO_DOMAIN_NAME` and `COGNITO_DOMAIN_CERTIFICATE_ARN` empty to use
the generated Cognito hosted UI domain. To use a custom Cognito domain, set
`COGNITO_DOMAIN_NAME` to the domain name or URL, for example
`auth.example.com` or `https://auth.example.com`, and set
`COGNITO_DOMAIN_CERTIFICATE_ARN` to an ACM certificate ARN in `us-east-1`.
Do not create the custom domain DNS record before the Cognito stack deploys.
Cognito creates its own managed CloudFront distribution first; after deployment,
point the custom domain at the `UserPoolDomainCloudFrontEndpoint` output. See
`docs/COGNITO-CUSTOM-DOMAIN-DNS.md` for the failure mode and recovery steps.

## 2. Deploy dev infrastructure to AWS
`/cdk-app:` 
```bash
cdk deploy --all -c enableWebSockets=true -c useCustomWsAuthorizer=true --require-approval never --profile=<PROFILE>
```

Use `/cdk-app/.env` for Cognito custom-domain configuration. Set both
`COGNITO_DOMAIN_NAME` and `COGNITO_DOMAIN_CERTIFICATE_ARN` to use a custom
hosted UI domain, or omit both values to keep the generated Cognito hosted UI
domain.

If `AWS::Cognito::UserPoolDomain` fails with a generic `InvalidRequest`, first
check whether the custom domain already has a DNS record pointing at a
CloudFront distribution. Remove that DNS record, redeploy, then recreate DNS
from the new `UserPoolDomainCloudFrontEndpoint` output. See
`docs/COGNITO-CUSTOM-DOMAIN-DNS.md`.

## 3. Generate `/.env` from CDK outputs
`/:`

```powershell
npm run export:cdk-outputs --profile=<PROFILE> --region=<REGION> --cdkAppName=<CDK_APP_NAME>
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
# HTTP endpoint for API Gateway (DEV = localhost, PROD = actual API Gateway URL)
VITE_API_GATEWAY_URL=http://localhost:8080

# Example: us-east-1
VITE_AWS_REGION=

# Cognito
VITE_USER_POOL_ID=<USER_POOL_ID>
VITE_USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>
VITE_COGNITO_DOMAIN=<COGNITO_DOMAIN_URL>

# Required when enableWebSockets=true
VITE_API_GATEWAY_WS_URL=<VITE_API_GATEWAY_WS_URL>
```

Do not copy backend-only secrets into `/client-app/.env`; every `VITE_` value is
browser-exposed.

## 5. Start local infrastructure and backend services
`/:` 

Before running Docker Compose, open `/docker-compose.yml` and set the AWS
credentials bind mount source for your OS under `x-aws-config-volume`:

```yaml
# Mac / Linux
source: ${HOME}/.aws
# Windows
# source: ${USERPROFILE}/.aws
```

or:

```yaml
# Mac / Linux
# source: ${HOME}/.aws
# Windows
source: ${USERPROFILE}/.aws
```

```bash
docker-compose up --build
```

This builds and starts the local Docker Compose development stack.

After the initial Docker Compose run, create an updated Prisma migration for
new `schema.prisma` changes from another terminal tab with:

```bash
docker compose run --rm prisma-migrate sh
```

Then inside the `prisma-migrate` container:

```bash
npx prisma migrate dev --name your_change_name
```

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
