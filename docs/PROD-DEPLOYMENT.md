# PROD DEPLOYMENT

This flow deploys the cloud-mode stack and publishes the Vite frontend to the
S3 bucket served by CloudFront. The examples below use the `dev` AWS profile.

## 1. Configure `/cdk-app/.env`
`/cdk-app/.env:`

```bash
# Namespaces CDK stack names, CloudFormation exports, Cognito domain fallback,
# and shared resource names so multiple deployments can coexist.
CDK_APP_NAME=

# Optional
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Required when PROD_URL is configured for CloudFront alternate domain support.
PROD_CERTIFICATE_ARN=

# Optional localhost origin for testing prod APIs/auth from local frontend.
LOCAL_DEV_URL=

# Production frontend origin for Cognito callbacks/logout, emails, and CORS.
PROD_URL=

# Optional Lambda CPU architecture. Valid values: x86_64 or arm64.
# Defaults to x86_64. The CDK context flag `-c lambdaArchitecture=...` overrides this.
LAMBDA_ARCHITECTURE=
```

Do not commit real secrets. `CDK_APP_NAME` should match the value passed to
`npm run export:cdk-outputs --cdkAppName=...`. For production deployments,
`PROD_URL` should point to the production frontend origin used for callback,
logout, email, and CORS configuration. `PROD_CERTIFICATE_ARN` is required when
`PROD_URL` is set. Leave `LAMBDA_ARCHITECTURE` empty for x86_64 Lambdas, or set
it to `arm64` when deploying ARM_64 Lambdas.

CDK sets the Prisma Lambda binary target from this architecture value during
deployment. `x86_64` uses `rhel-openssl-3.0.x`; `arm64` uses
`linux-arm64-openssl-3.0.x`. Manual Prisma generation must set
`PRISMA_BINARY_TARGETS` explicitly.

## 2. Deploy production-mode infrastructure to AWS
`/cdk-app:`

```powershell
cdk deploy --all -c useLocalDevStack=false -c enableWebSockets=true -c useCustomWsAuthorizer=true -c enableEcsStack=false --require-approval never --profile=<PROFILE>
```

To override `/cdk-app/.env` for one deploy, pass the architecture explicitly:

```powershell
cdk deploy --all -c useLocalDevStack=false -c lambdaArchitecture=arm64 -c enableWebSockets=true -c useCustomWsAuthorizer=true -c enableEcsStack=false --require-approval never --profile=<PROFILE>
```

This creates the production cloud stack instead of the local Docker-backed dev
stack. With `enableEcsStack=false`, ECS services are skipped. With
`enableWebSockets=true`, the WebSocket API outputs should also be exported for
frontend use. `lambdaArchitecture` defaults to `x86_64`; when it is `arm64`,
CDK also generates and bundles the ARM Prisma query engine.

## 3. Push the Prisma schema to RDS
`/:`

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

Linux/macOS Bash version:

```bash
secretArn=$(aws cloudformation describe-stacks \
  --stack-name RdsStack \
  --query "Stacks[0].Outputs[?OutputKey=='RdsCredentialsSecretArn'].OutputValue | [0]" \
  --output text \
  --profile=<PROFILE>)

secret=$(aws secretsmanager get-secret-value \
  --secret-id "$secretArn" \
  --query SecretString \
  --output text \
  --profile=<PROFILE>)

username=$(printf '%s' "$secret" | jq -r '.username' | jq -sRr @uri)
password=$(printf '%s' "$secret" | jq -r '.password' | jq -sRr @uri)
host=$(printf '%s' "$secret" | jq -r '.host')
port=$(printf '%s' "$secret" | jq -r '.port')
dbname=$(printf '%s' "$secret" | jq -r '.dbname')

export DATABASE_URL="postgresql://${username}:${password}@${host}:${port}/${dbname}?sslmode=no-verify"

npm --workspace @repo/database exec -- prisma db push
```

Use `prisma db push` after `RdsStack` exists so the deployed Lambdas can use the
current schema.

## 4. Generate `/.env` from CDK outputs
`/:`

```powershell
npm run export:cdk-outputs --profile=<PROFILE> --region=<REGION> --cdkAppName=<CDK_APP_NAME>
```

The generated root `.env` should include values such as:

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

## 5. Manually port relevant variables from `/.env` into `/client-app/.env`
`/.env` -> `/client-app/.env`

```bash
# HTTP endpoint for API Gateway (DEV = localhost, PROD = actual API Gateway URL)
VITE_API_GATEWAY_URL=<HTTP_API_URL>

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

## 6. Build the frontend
`/:`

```powershell
npm --workspace client-app run build
```

This writes the deployable static assets to `/client-app/dist`.

## 7. Publish the frontend to S3
`/:`

```powershell
aws s3 sync client-app/dist s3://<FRONTEND_WEBSITE_BUCKET_NAME> --delete --profile=<PROFILE>
```

Use the `FRONTEND_WEBSITE_BUCKET_NAME` value generated into the root `.env`.

## 8. Optional: invalidate CloudFront
`/:`

```powershell
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_ID> --paths "/*" --profile=<PROFILE>
```

This is useful after replacing an existing frontend build so CloudFront stops
serving cached assets.
