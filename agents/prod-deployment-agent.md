# Prod Deployment Agent

Use this agent when deploying or troubleshooting the production cloud stack for lawstruct-ai. The goal is to make the path from the working dev deployment to a usable CloudFront-hosted production frontend repeatable.

## Current Working Dev Flow

From `cdk-app`:

```powershell
cdk deploy --all -c useCustomWsAuthorizer=true -c enableWebSockets=true -c skipEmailVerification=true --require-approval never --profile=dev
```

From the repo root:

```powershell
npm run export:cdk-outputs:profile-dev
docker-compose up --build
```

From `client-app`:

```powershell
npm run dev
```

Dev uses Docker Compose for local Postgres, Prisma setup, local HTTP and WebSocket API emulators, the WebSocket tester, and pgAdmin. Production does not use Docker Compose.

Docker Compose sets `PRISMA_BINARY_TARGETS=["linux-musl-openssl-3.0.x"]`, so local container generation only keeps the Alpine/musl Prisma query engine used by `local-api-dev-server`.

## Production Flow

Deploy prod-mode CDK from `cdk-app`:

```powershell
cdk deploy --all -c useLocalDevStack=false -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --require-approval never --profile=dev
```

CDK generation sets `PRISMA_BINARY_TARGETS=["rhel-openssl-3.0.x"]`, so Lambda assets only package the Amazon Linux/RHEL Prisma query engine. The shared database generation script removes stale generated engine binaries before each `prisma generate` run.

Then export stack outputs from the repo root:

```powershell
npm run export:cdk-outputs:profile-dev
```

Create or update `client-app/.env` from the exported root `.env` values, plus any browser-exposed app keys that are not exported by CDK:

```dotenv
VITE_API_GATEWAY_URL=<HTTP_API_URL>
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=<USER_POOL_ID>
VITE_USER_POOL_CLIENT_ID=<USER_POOL_CLIENT_ID>
VITE_COGNITO_DOMAIN=<COGNITO_DOMAIN_URL>
VITE_API_GATEWAY_WS_URL=<VITE_API_GATEWAY_WS_URL>
VITE_STRIPE_PUBLISHABLE_KEY=<stripe publishable key, if billing UI is enabled>
```

Build and publish the frontend from the repo root:

```powershell
npm --workspace client-app run build
aws s3 sync client-app/dist s3://<FRONTEND_WEBSITE_BUCKET_NAME> --delete --profile dev
aws cloudfront create-invalidation --distribution-id <FRONTEND_DISTRIBUTION_ID> --paths "/*" --profile dev
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
cdk destroy HttpApiGatewayStack CloudFrontStack RdsStack -c useLocalDevStack=false -c frontendUrl=http://localhost:3000 -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --force --profile=dev
```

Only include `EcsServicesStack` in the destroy command if it was actually deployed with `-c enableEcsStack=true`.

From the repo root, export outputs and start local services again:

```powershell
npm run export:cdk-outputs:profile-dev
docker-compose up --build
```

Then run the client from `client-app` with `VITE_API_GATEWAY_URL=http://localhost:8080`:

```powershell
npm run dev
```

Destroying `RdsStack` deletes the production database unless it was deployed with `-c retainStatefulResouces=true`. Skip `RdsStack` in the destroy command if the database must be kept for later.

## Trusted Frontend URLs

Production always trusts the generated CloudFront URL. One additional trusted URL can come from:

- `-c frontendUrl=<url>`
- `cdk-app/.env` as `FRONTEND_URL=<url>` when the context value is not provided

Trusted frontend URLs are used for:

- Cognito callback URLs: `<frontend-url>/auth/callback`
- Cognito logout URLs: `<frontend-url>`
- HTTP API CORS origins
- Application data S3 CORS origins

Production URLs must use `https://`, except loopback testing URLs such as `http://localhost:3000`, `http://127.0.0.1:3000`, or `http://[::1]:3000`.

The Cognito custom-message Lambda keeps CloudFront as the primary `FRONTEND_URL` in prod so verification and password-reset emails do not accidentally point at localhost.

## RDS Prisma Push

After `RdsStack` exists, push the Prisma schema to RDS from the repo root:

```powershell
$secretArn = aws cloudformation describe-stacks `
  --stack-name RdsStack `
  --query "Stacks[0].Outputs[?OutputKey=='RdsCredentialsSecretArn'].OutputValue | [0]" `
  --output text `
  --profile dev

$secret = aws secretsmanager get-secret-value `
  --secret-id $secretArn `
  --query SecretString `
  --output text `
  --profile dev | ConvertFrom-Json

$env:DATABASE_URL = "postgresql://$([uri]::EscapeDataString($secret.username)):$([uri]::EscapeDataString($secret.password))@$($secret.host):$($secret.port)/$($secret.dbname)?sslmode=no-verify"

npm --workspace @repo/database exec -- prisma db push
```

Use `db push` for the first production stabilization pass. Move to migrations later only after the deployment path is reliable.

## Known Verified Facts

- `npm --workspace cdk-app run build` passes with the trusted frontend URL implementation.
- `npm --workspace @repo/database run generate` defaults to the Docker/local musl target and cleans stale query-engine binaries.
- CDK synth sets the rhel target before bundling Lambda assets.
- After a clean `cdk.out` synth of the Lambda stacks, no musl query engine is present and the 8 Prisma-backed Lambda assets include `libquery_engine-rhel-openssl-3.0.x.so.node`.
- Prod synth with the intended flags passes:

```powershell
npx cdk synth --all -c useLocalDevStack=false -c useCustomWsAuthorizer=true -c enableWebSockets=true -c enableEcsStack=false -c skipEmailVerification=true --profile=dev
```

## Troubleshooting Checklist

- CORS failure: confirm the browser origin exactly matches one trusted frontend URL, including scheme and port.
- Cognito redirect mismatch: confirm Cognito app client callback URLs include `<origin>/auth/callback`.
- OAuth returns HTML/non-JSON: confirm `VITE_API_GATEWAY_URL` points at `HttpApiGatewayStack.HttpApiUrl`, not the CloudFront URL.
- Empty CloudFront site: confirm `client-app/dist` was built and synced to `FRONTEND_WEBSITE_BUCKET_NAME`.
- Stale frontend assets: create a CloudFront invalidation for `/*`.
- RDS connection failure during Prisma push: confirm `RdsStack` exists, the secret output resolves, your current network can reach the public RDS endpoint, and the generated `DATABASE_URL` includes `sslmode=no-verify`.
- Post-confirmation or GraphQL database errors: confirm Lambdas have `PRIMARY_DATABASE_SECRET_ARN` from `RdsStack` and that `prisma db push` has run successfully.
