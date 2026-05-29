# Prod Deployment Agent

Use this agent when deploying or troubleshooting the production cloud stack for this repo. The goal is to make the path from a working dev deployment to a usable CloudFront-hosted production frontend repeatable.

The source of truth for the production runbook is `docs/PROD-DEPLOYMENT.md`. Keep this agent aligned with that doc when deployment flags, output names, or environment variables change.

## Current Working Dev Flow

From `cdk-app`:

```powershell
cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never --profile=dev
```

From the repo root:

```powershell
npm run export:cdk-outputs --profile=dev --region=us-east-1 --cdkAppName=<CDK_APP_NAME>
docker-compose up --build
```

From `client-app`:

```powershell
npm run dev
```

Dev uses Docker Compose for local Postgres, Prisma setup, local HTTP and WebSocket API emulators, the WebSocket tester, and pgAdmin. Production does not use Docker Compose.

Docker Compose sets `PRISMA_BINARY_TARGETS=["linux-musl-openssl-3.0.x"]`, so local container generation only keeps the Alpine/musl Prisma query engine used by `local-api-dev-server`.

## Production Environment Configuration

Before deploying production-mode infrastructure, configure `cdk-app/.env`:

```dotenv
CDK_APP_NAME=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PROD_CERTIFICATE_ARN=
LOCAL_DEV_URL=
PROD_URL=
LAMBDA_ARCHITECTURE=
```

Important rules:

- Do not commit real secrets.
- `CDK_APP_NAME` namespaces stack names, CloudFormation exports, Cognito domain fallback, and shared resources. Use the same value when exporting CDK outputs.
- `PROD_URL` is the production frontend origin used for Cognito callbacks/logout, emails, and CORS.
- `PROD_CERTIFICATE_ARN` is required when `PROD_URL` is configured for CloudFront alternate domain support.
- `LOCAL_DEV_URL` is optional and is only for testing prod APIs/auth from a local frontend.
- `LAMBDA_ARCHITECTURE` defaults to `x86_64`; set it to `arm64` for ARM_64 Lambdas. The CDK context flag `-c lambdaArchitecture=...` overrides this env value.

CDK sets the Prisma Lambda binary target from the architecture value during deployment:

- `x86_64` uses `rhel-openssl-3.0.x`.
- `arm64` uses `linux-arm64-openssl-3.0.x`.

Manual Prisma generation must set `PRISMA_BINARY_TARGETS` explicitly. The shared database generation script removes stale generated engine binaries before each `prisma generate` run.

## Production Flow

Deploy prod-mode CDK from `cdk-app`:

```powershell
cdk deploy --all -c useLocalDevStack=false -c enableWebSockets=true -c useCustomWsAuthorizer=true -c enableEcsStack=false --require-approval never --profile=<PROFILE>
```

To override `cdk-app/.env` for one ARM deploy:

```powershell
cdk deploy --all -c useLocalDevStack=false -c lambdaArchitecture=arm64 -c enableWebSockets=true -c useCustomWsAuthorizer=true -c enableEcsStack=false --require-approval never --profile=<PROFILE>
```

With `enableEcsStack=false`, ECS services are skipped. With `enableWebSockets=true`, the WebSocket API outputs should be exported for frontend use.

After `RdsStack` exists, push the Prisma schema to RDS from the repo root:

```powershell
$secretArn = aws cloudformation describe-stacks `
  --stack-name RdsStack `
  --query "Stacks[0].Outputs[?OutputKey=='RdsCredentialsSecretArn'].OutputValue | [0]" `
  --output text `
  --profile=<PROFILE>

$secret = aws secretsmanager get-secret-value `
  --secret-id $secretArn `
  --query SecretString `
  --output text `
  --profile=<PROFILE> | ConvertFrom-Json

$env:DATABASE_URL = "postgresql://$([uri]::EscapeDataString($secret.username)):$([uri]::EscapeDataString($secret.password))@$($secret.host):$($secret.port)/$($secret.dbname)?sslmode=no-verify"

npm --workspace @repo/database exec -- prisma db push
```

Use `db push` for the first production stabilization pass. Move to migrations later only after the deployment path is reliable.

Then export stack outputs from the repo root:

```powershell
npm run export:cdk-outputs --profile=<PROFILE> --region=<REGION> --cdkAppName=<CDK_APP_NAME>
```

The generated root `.env` should include:

```dotenv
APPLICATION_DATA_BUCKET_NAME=
FRONTEND_WEBSITE_BUCKET_NAME=
CLOUDFRONT_URL=
CLOUDFRONT_ID=
HTTP_API_URL=
USER_POOL_ID=
USER_POOL_CLIENT_ID=
COGNITO_DOMAIN_URL=
VITE_API_GATEWAY_WS_URL=
```

Create or update `client-app/.env` from the exported root `.env` values:

```dotenv
VITE_API_GATEWAY_URL=<HTTP_API_URL>
VITE_AWS_REGION=<REGION>
VITE_USER_POOL_ID=<USER_POOL_ID>
VITE_USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>
VITE_COGNITO_DOMAIN=<COGNITO_DOMAIN_URL>
VITE_API_GATEWAY_WS_URL=<VITE_API_GATEWAY_WS_URL>
```

Do not copy backend-only secrets into `client-app/.env`; every `VITE_` value is browser-exposed.

Build and publish the frontend from the repo root:

```powershell
npm --workspace client-app run build
aws s3 sync client-app/dist s3://<FRONTEND_WEBSITE_BUCKET_NAME> --delete --profile=<PROFILE>
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_ID> --paths "/*" --profile=<PROFILE>
```

The invalidation is optional but useful after replacing an existing frontend build.

## Prod Back To Dev Flow

When moving a working prod-mode deployment back to the Docker/local dev flow, update the shared stacks to dev mode before destroying prod-only stacks. This recreates `DevLambdaReplayStack` and removes Lambda/Cognito references to RDS.

From `cdk-app`, redeploy dev-mode infrastructure:

```powershell
cdk deploy --all -c useLocalDevStack=true -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never --profile=dev
```

Then destroy the prod-only stacks from a prod-mode assembly:

```powershell
cdk destroy HttpApiGatewayStack CloudFrontStack RdsStack -c useLocalDevStack=false -c localDevUrl=http://localhost:3000 -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --force --profile=dev
```

Only include `EcsServicesStack` in the destroy command if it was actually deployed with `-c enableEcsStack=true`.

From the repo root, export outputs and start local services again:

```powershell
npm run export:cdk-outputs --profile=dev --region=us-east-1 --cdkAppName=<CDK_APP_NAME>
docker-compose up --build
```

Then run the client from `client-app` with `VITE_API_GATEWAY_URL=http://localhost:8080`:

```powershell
npm run dev
```

Destroying `RdsStack` deletes the production database unless it was deployed with `-c retainStatefulResouces=true`. Skip `RdsStack` in the destroy command if the database must be kept for later.

## Trusted Frontend URLs

Production always trusts the generated CloudFront URL. Additional trusted frontend origins come from `PROD_URL` and optional `LOCAL_DEV_URL` in `cdk-app/.env`.

Trusted frontend URLs are used for:

- Cognito callback URLs: `<frontend-url>/auth/callback`
- Cognito logout URLs: `<frontend-url>`
- HTTP API CORS origins
- Application data S3 CORS origins
- Cognito custom-message email links

Production URLs must use `https://`, except loopback testing URLs such as `http://localhost:3000`, `http://127.0.0.1:3000`, or `http://[::1]:3000`.

## Known Verified Facts

- `npm --workspace cdk-app run build` passed with the trusted frontend URL implementation.
- `npm --workspace @repo/database run generate` defaults to the Docker/local musl target and cleans stale query-engine binaries.
- CDK synth sets the Lambda Prisma target from `LAMBDA_ARCHITECTURE` or `-c lambdaArchitecture=...` before bundling Lambda assets.
- Prod deploy examples now use `npm run export:cdk-outputs --profile=<PROFILE> --region=<REGION> --cdkAppName=<CDK_APP_NAME>` rather than profile-specific helper scripts.

## Troubleshooting Checklist

- Missing or wrong stack exports: confirm `CDK_APP_NAME` in `cdk-app/.env` matches the value passed to `npm run export:cdk-outputs --cdkAppName=...`.
- CORS failure: confirm the browser origin exactly matches one trusted frontend URL, including scheme and port.
- Cognito redirect mismatch: confirm Cognito app client callback URLs include `<origin>/auth/callback`.
- OAuth returns HTML/non-JSON: confirm `VITE_API_GATEWAY_URL` points at `HttpApiGatewayStack.HttpApiUrl`, not the CloudFront URL.
- Empty CloudFront site: confirm `client-app/dist` was built and synced to `FRONTEND_WEBSITE_BUCKET_NAME`.
- Stale frontend assets: create a CloudFront invalidation for `/*` using `CLOUDFRONT_ID`.
- RDS connection failure during Prisma push: confirm `RdsStack` exists, the secret output resolves, your current network can reach the public RDS endpoint, and the generated `DATABASE_URL` includes `sslmode=no-verify`.
- Post-confirmation or GraphQL database errors: confirm Lambdas have the RDS secret from `RdsStack` and that `prisma db push` has run successfully.
- Prisma query engine errors in Lambda: confirm the deployed architecture matches the packaged Prisma binary target, `x86_64` with `rhel-openssl-3.0.x` or `arm64` with `linux-arm64-openssl-3.0.x`.
