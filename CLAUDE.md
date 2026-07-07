# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lawstruct.ai is an AI-powered legal case intelligence platform. It transforms scattered legal materials into a structured knowledge graph of interconnected case records (facts, issues, arguments, timeline events, testimony, precedent) with a human-in-the-loop AI review workflow.

The repository is a **TypeScript npm monorepo** with workspaces: `cdk-app/`, `client-app/`, `packages/*`, and several local dev tools.

## Essential Commands

### Development
```powershell
# Start all local services (Postgres on 5432, local API on 8080, WS on 8081, pgAdmin on 5050, LangGraph)
docker-compose up --build

# Frontend dev server on :3000 (after Docker Compose is running)
npm --workspace client-app run dev
```

### Codegen (run after GraphQL schema changes)
```powershell
# Regenerate Prisma client + Pothos types (after schema.prisma changes)
npm --workspace @repo/database run generate

# Regenerate typed GraphQL operations into client-app/src/api/generated/
npm run codegen
```

### Testing
```powershell
npm --workspace client-app run test    # Vitest (frontend)
npm --workspace cdk-app run test       # Jest (CDK)
```

### Build
```powershell
npm --workspace client-app run build   # Production frontend -> client-app/dist/
npm --workspace cdk-app run build      # tsc compile CDK
```

### TypeScript checks (per package, not root-level)
```powershell
npx tsc --noEmit -p packages\api-contract\tsconfig.json
npx tsc --noEmit -p packages\shared-lambda-utils\tsconfig.json
npx tsc --noEmit -p local-api-dev-server\tsconfig.json
```

### CDK Deploy
```powershell
# Dev (from cdk-app/)
cdk deploy --all -c enableWebSockets=true -c useCustomWsAuthorizer=true --require-approval never --profile=dev

# Prod
cdk deploy --all -c useLocalDevStack=false -c enableWebSockets=true -c useCustomWsAuthorizer=true -c enableEcsStack=false --require-approval never --profile=<PROFILE>
```

## Architecture

### Typed Contract Chain (critical — never skip steps)

```
packages/database/prisma/schema.prisma
  → npm --workspace @repo/database run generate   (Prisma client + pothos.ts)
  → cdk-app/lambda_functions/graphql-api/schema/  (Pothos schema builder)
  → npm run codegen                               (typed operations → client-app/src/api/generated/)
  → client-app/src/api/<feature>/operations.ts    (typed documents + raw API functions)
  → client-app/src/api/<feature>/hooks.ts         (React Query hooks)
  → UI components
```

**Never manually edit `client-app/src/api/generated/` or `packages/database/src/generated/`.** Treat codegen TypeScript errors as contract drift.

### Backend (AWS CDK + Lambda + ECS)

- **IaC:** AWS CDK v2 in `cdk-app/lib/` — each stack is a separate file
- **API:** AWS HTTP API Gateway v2 → Lambda handlers in `cdk-app/lambda_functions/`; one directory per handler
- **GraphQL:** Pothos schema builder + GraphQL Yoga in the `graphql-api` Lambda
- **Database:** PostgreSQL 16 via Prisma 6 (RDS in prod, Docker Compose locally)
- **Auth:** Cognito User Pool (Google OAuth IdP); ID tokens in `Authorization: Bearer` headers; double-verified by API Gateway Cognito authorizer + `jose` in Lambda
- **AI:** LangGraph + AWS Bedrock in `cdk-app/ecs_containers/langgraph-service/` (ECS/Fargate in prod, Docker Compose locally)

### Shared Packages

| Package | Purpose |
|---|---|
| `@repo/api-contract` | Browser-safe API route constants |
| `@repo/database` | Prisma schema, generated client, Zod API schemas |
| `@repo/shared-lambda-utils` | Cognito JWT verification, HTTP response helpers, DB connection helper |

### Frontend (`client-app/`)

- React 19 + Vite 7; TanStack Router (file-based routes, `routeTree.gen.ts` is auto-generated)
- TanStack React Query v5 for server state
- Tailwind CSS v4 with custom config in `src/styles.css`
- GraphQL client via `executeGraphQL()` in `src/api/graphql/`
- Per-feature API folders follow `operations.ts` (GraphQL documents + raw calls) / `model.ts` (normalization + UI-facing types) / `hooks.ts` (React Query); see `src/api/workspace/` and `src/api/currentUser/`
- Hardcoded demo workspace data lives in `client-app/src/demo/` (`caseWorkspaceDemo.ts` Faxon Commons, `caseWorkspaceDemoOj.ts` O.J. Simpson, resolved by `getCaseDemo` in `caseDemos.ts`) — not in `src/lib/`

### CDK Context Flags

`useLocalDevStack` (default `true`) is the master toggle:
- **Dev:** Includes `DevLambdaReplayStack`, skips `RdsStack`, `HttpApiGatewayStack`, `CloudFront`
- **Prod:** Includes RDS, HTTP API Gateway, CloudFront; skips dev replay stack

## Frontend UI System

Defined in `agents/frontend-style-parity-agent.md` and `client-app/src/styles.css`:

- **Base font size:** `html, body { font-size: 21px }`, stepping to 19px at ≥100rem viewport (2xl) and 17px at ≥150rem (3xl) — `text-md` (0.875rem) is normal readable UI. Never hardcode 21 in JS px↔rem math; read the live root font size.
- **Custom breakpoints:** xs=45rem, sm=50rem, md=60rem, lg=72.5rem, xl=84rem, 2xl=100rem, 3xl=150rem (2xl/3xl are density tiers: smaller root + wider `AppLayout` shell)
- **Visual language:** Translucent glass panels — `bg-white/40 backdrop-blur-sm border border-black/15 shadow-md rounded-2xl`
- **Neutrals:** Black-alpha system (`border-black/10`, `bg-black/10`, `text-black/60`) — not hard Tailwind grays
- **Buttons:** Use `Button.tsx`; primary is `bg-[#282828] text-white`, secondary is `bg-black/10`
- **Icons:** `lucide-react` only; standard row icons `w-4 h-4`
- **Fonts:** Geist (sans), Cormorant Garamond (serif for logo + modal headings)
- **Reference for case workspace UI:** `workspaces.$workspaceId_.cases.$caseId.tsx`

## Domain Model Notes

### Active Prisma models (live):
`User`, `Workspace`, `WorkspaceMembership`, `WorkspaceInvitation`

### Commented-out (planned, not yet active):
`ManagedCase`, `CaseDocumentIndex`, `CaseRecordIndex`, `CaseViewIndex`, `CaseStateManifest`, `LlmUsageEvent`, and billing/usage tables. These are defined in `schema.prisma` and ready to be un-commented as MVP features land.

### Frontend domain types:
`StateObjectTypes` in `client-app/src/types/caseWorkspace.ts`: arguments, case_notes, facts, issues, legal_precedent, objectives, posture, tasks, testimony, timeline. Records have status: `proposed | accepted | rejected | superseded`.

## Key Architectural Constraints

- **Prisma binary targets are architecture-aware.** Dev Docker uses `linux-musl-openssl-3.0.x`; Lambda prod uses `rhel-openssl-3.0.x` (x86) or `linux-arm64-openssl-3.0.x` (ARM). CDK handles target selection at synth time.
- **S3 credential brokering uses `AssumeRole`**, not `GetFederationToken` (which fails on Lambda execution roles). Profile photo uploads go through a dedicated `ProfilePictureUploadRole` with inline session policy.
- **Vite must use `base: "/"`** (not `"./"`) for CloudFront SPA routing.
- **Docker Compose on Windows** requires `CHOKIDAR_USEPOLLING=true` / `CHOKIDAR_INTERVAL=300` for file watching in containers.

## Environment Variables

### `cdk-app/.env`
`CDK_APP_NAME`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PROD_CERTIFICATE_ARN`, `LOCAL_DEV_URL`, `PROD_URL`, `LAMBDA_ARCHITECTURE`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`

### `client-app/.env`
`VITE_API_GATEWAY_URL`, `VITE_AWS_REGION`, `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_COGNITO_DOMAIN`, `VITE_API_GATEWAY_WS_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`

Root `.env` is generated by `npm run export:cdk-outputs` from CDK stack outputs.

## Agent Briefs

The `agents/` directory contains authoritative working documents encoding product vision, implementation checklists, and design guardrails. Read the relevant agent brief before working on a new area:

- `agents/lawstruct-ai-product-architecture-agent.md` — main architecture + product
- `agents/record-linking-agent.md` — record graph links, replacement/supersession lifecycle, link/chip rendering rules
- `agents/auth.md` — auth system
- `agents/frontend-style-parity-agent.md` — UI style guide
- `agents/typed-contract-propagation-agent.md` — data contract change workflow
- `agents/prod-deployment-agent.md` — deployment runbook
