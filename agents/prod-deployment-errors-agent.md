# Prod Deployment Errors Agent

Use this file to record production deployment/runtime failures and the fix that was applied, so later deploy attempts get faster instead of starting over.

## 2026-05-20 - Cognito PostConfirmation Prisma Engine Mismatch

### Symptom

Cognito registration succeeded, then the post-confirmation trigger failed with a Prisma query-engine runtime error:

```txt
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
This happened because Prisma Client was generated for "windows", but the actual deployment required "rhel-openssl-3.0.x".
```

### Cause

AWS Lambda Node.js 20 runs on an Amazon Linux runtime that Prisma resolves as `rhel-openssl-3.0.x`. The Prisma generators only included `native` and `linux-musl-openssl-3.0.x`, so the Lambda bundle did not include the engine binary required by the deployed runtime.

### Fix

Make the Prisma generators read `binaryTargets = env("PRISMA_BINARY_TARGETS")`, then make CDK run database generation with `PRISMA_BINARY_TARGETS=["rhel-openssl-3.0.x"]`. Docker Compose uses `PRISMA_BINARY_TARGETS=["linux-musl-openssl-3.0.x"]`.

### Verification

- Run `npm --workspace @repo/database run generate` for the local musl default.
- Run CDK synth/deploy and confirm it regenerates with the rhel target.
- Run `npm --workspace cdk-app run build`.
- Run prod `cdk synth`.
- Redeploy the Lambda stacks, then register a new user or manually retry the post-confirmation path.

## 2026-05-20 - Cognito PostConfirmation Prisma Bundler Engine Lookup

### Symptom

Cognito registration reached the post-confirmation trigger, but Prisma still failed after adding the `rhel-openssl-3.0.x` binary target:

```txt
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
This is likely caused by a bundler that has not copied "libquery_engine-rhel-openssl-3.0.x.so.node" next to the resulting bundle.
```

### Cause

`aws-lambda-nodejs`/esbuild bundled the Prisma client runtime into `index.js`. The engine existed under `node_modules/.prisma/client`, but Prisma's bundled-runtime resolver also needs a deterministic engine path or a copy beside the final Lambda bundle.

### Fix

Update `cdk-app/lib/prisma-lambda-bundling.ts` to:

- copy `node_modules/.prisma/client` into each Prisma-backed Lambda asset;
- copy `libquery_engine-rhel-openssl-3.0.x.so.node` beside the Lambda `index.js`;
- set `PRISMA_QUERY_ENGINE_LIBRARY=/var/task/libquery_engine-rhel-openssl-3.0.x.so.node` on each Prisma-backed Lambda.

### Verification

- Run `npm --workspace cdk-app run build`.
- Run prod `cdk synth`.
- Confirm synthesized Lambda assets include root-level `libquery_engine-rhel-openssl-3.0.x.so.node`.
- Confirm synthesized templates include `PRISMA_QUERY_ENGINE_LIBRARY`.
- Redeploy `AsynchronousLambdaFunctionsStack` and `SynchronousLambdaFunctionsStack`.

## 2026-05-20 - Localhost GraphQL 401 After Successful Sign-In

### Symptom

Registration and Cognito post-confirmation worked, but signing in from `http://localhost:3000` led to:

```txt
POST https://<api-id>.execute-api.us-east-1.amazonaws.com/graphql 401 (Unauthorized)
```

### Cause

`http://localhost:3000` was trusted for CORS and Cognito redirects. The 401 came from the HTTP API Cognito authorizer, not CORS. Protected routes use the `Authorization` header as the authorizer identity source, while the client was only sending auth cookies with `credentials: "include"`.

### Fix

Keep the HTTP API Cognito authorizer unchanged. Return the Cognito ID token from `/sign-in`, `/oauth/callback`, and `/refresh`; store it in browser session/local storage according to the remember-me setting; and attach `Authorization: Bearer <idToken>` to protected API requests. Lambda session parsing now accepts the bearer token while still supporting cookies as a fallback.

### Verification

- Run `npm --workspace cdk-app run build`.
- Run `npm --workspace client-app run build`.
- Redeploy `SynchronousLambdaFunctionsStack`.
- Restart or refresh the frontend, sign in, and confirm `/graphql` sends an `Authorization` header.
