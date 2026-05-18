# CaseOS Product And Architecture Agent

Use this agent when planning, implementing, or reviewing work that affects CaseOS as a product: case workspaces, case records, documents, intake, graph relationships, AI-assisted reasoning, human review flows, or the persistence/API/UI contracts that make those features real.

This agent is intentionally broader than a single implementation task. Its job is to keep the application pointed at the product vision while respecting the codebase as it exists today.

## Product North Star

CaseOS is an AI-assisted case intelligence platform for turning scattered legal and case material into structured, connected, searchable knowledge.

The product should not feel like a generic document upload tool with a chat box attached. It should feel like a structured case command center where users can see, create, verify, connect, and reason across:

- Cases
- Facts
- Issues
- Arguments
- Evidence
- Documents and files
- Timelines
- Case notes
- Legal precedent
- Objectives and risks
- Testimony
- Tasks
- AI-generated insights
- Case strategy views

The deeper bet is that legal reasoning gets stronger when humans and agents reason over structured case objects instead of only raw documents. The system should bridge:

```txt
documents -> extracted records -> facts/issues/arguments -> timeline/context -> AI-assisted strategy
```

In plain terms: CaseOS helps users turn messy legal material into an organized, traceable case model that both humans and AI agents can query and reason across.

## Current Repository Reality

The repo is a TypeScript monorepo that started as a local-first AWS/CDK development kit and is being shaped into CaseOS.

Current major areas:

- `client-app/`: TanStack React frontend with Cognito auth, route guards, React Query, generated GraphQL client code, case intake UI, workspace shell, and early case workspace menu.
- `packages/database/`: Prisma schema, generated Prisma client, generated Pothos types, and shared database exports.
- `cdk-app/`: AWS CDK stacks plus Lambda functions for auth, billing, GraphQL, S3 access brokering, WebSocket routes, and an ECS/Fargate-style LangGraph service.
- `local-api-dev-server/`: local API Gateway/Lambda emulator.
- `local-ws-dev-server/`: local API Gateway WebSocket emulator.
- `frontend-ws-connection-and-payload-tester/`: local WebSocket testing UI.
- `agents/`: durable agent briefs for future Codex/implementation work.

Important current constraints:

- The Prisma schema already contains CaseOS domain models for workspaces, managed cases, document indexes, record indexes, view indexes, state manifests, and LLM usage events.
- The active GraphQL schema currently exposes only current-user and user-profile operations. Case, workspace, document, record, manifest, and view APIs are not yet exposed through GraphQL.
- The frontend has a case intake wizard at `/cases/new` and a case route shell at `/case/$id`, but the route currently uses placeholder/demo data and does not yet load a real case workspace from the backend.
- `client-app/src/types/caseWorkspace.ts` is a useful product-domain sketch, but it is not yet fully reconciled with Prisma enums, persisted storage, or GraphQL contracts.
- The LangGraph service exists as a Bedrock-backed demo service with simple routing/tools. It is not yet a CaseOS record-generation or enrichment workflow.
- S3/STS support exists today for profile picture upload. Case document storage and scoped document upload/download flows still need product-specific expansion.

## Existing Product Model

The key frontend product sketch is `client-app/src/types/caseWorkspace.ts`.

It defines:

- Legal intake types: practice area, client role, representation role, procedural status, timeline and urgency, goals and risks, people and witnesses, documents and evidence.
- Workspace partitions through `StateObjectTypes`:
  - `arguments`
  - `case_notes`
  - `facts`
  - `issues`
  - `legal_precedent`
  - `objectives`
  - `posture`
  - `tasks`
  - `testimony`
  - `timeline`
- Review lifecycle types:
  - `LinkStatus = "proposed" | "accepted" | "rejected"`
  - `RecordStatus = "proposed" | "accepted" | "rejected" | "superseded"`
- Graph-like reference maps:
  - `references`
  - `referencedBy`
  - `supersedes`
  - `supersededBy`
- Master workspace views:
  - record-type views such as `arguments`, `facts`, `timeline`
  - system views such as `agent_config`, `case_summary`, and `documents_index`

The key persistence model is `packages/database/prisma/schema.prisma`.

It currently supports:

- Users, billing status, account tier, and subscription metadata.
- Workspaces with owners, memberships, invitations, storage bucket/prefix, and status.
- Managed cases under workspaces.
- Case documents indexed by workspace/case/category/storage key/status/summary/date/reference metadata.
- Case records indexed by workspace/case/type/category/status/visibility/version/confidence/references/supersession metadata/search text/event date/due date.
- Case views indexed by workspace/case/view type/storage key/version/source hash/generated actor.
- Case state manifests that can snapshot workspace or case state.
- LLM usage events for billing/audit tracking.

The Prisma model is already closer to the intended backend architecture than the frontend API is. The next major product work should expose and use this model safely.

## Core Product Principles

1. Structured records are first-class.
   Documents matter, but they should feed a structured case model. A PDF summary should become useful because it can attach to facts, issues, arguments, testimony, precedent, and timelines.

2. Human review is mandatory for agent-created case knowledge.
   Agent-created records and links should begin as proposals. Users should accept, reject, edit, or supersede them before they become trusted case material.

3. Every case object should be traceable.
   Important claims, facts, and strategy suggestions should point back to evidence, documents, notes, testimony, or prior records when possible.

4. The graph matters.
   CaseOS should preserve relationships between records. Updating or superseding one record should make affected links and derived views visible for review instead of silently hiding the consequences.

5. Master views are derived, not the source of truth.
   Master markdown views such as an arguments digest, document index, or full case summary should summarize indexed records and documents. They should be regenerated or updated from structured state, with source hashes/manifests where useful.

6. Local development should stay fast.
   The architecture favors local emulation, generated contracts, and Docker Compose so schema/API/UI/agent work can iterate without constant cloud deployment.

7. Strong contracts beat ad hoc JSON drift.
   Prisma, GraphQL, generated frontend types, React Query hooks, and UI models should move together. When changing the data model, use `agents/typed-contract-propagation-agent.md`.

## Human-In-The-Loop Lifecycle

All agent-generated records and links should follow a proposal workflow.

Record lifecycle:

```txt
proposed -> accepted
proposed -> rejected
accepted -> superseded
accepted -> proposed superseding record -> accepted superseding record
```

Link lifecycle:

```txt
proposed -> accepted
proposed -> rejected
accepted -> affected by record update/supersession -> review needed
```

User actions should generally include:

- Create a record manually.
- Ask an agent to propose new records from intake, notes, documents, or prompts.
- Ask an agent to enrich an existing record.
- Edit a proposed record before accepting it.
- Reject a proposed record with optional rationale.
- Delete a proposed record when it should be removed from the review queue rather than preserved as a rejected proposal.
- Ask an agent to suggest edits to a proposed record before accepting or rejecting it.
- Supersede an accepted record when new case context changes it.
- Review incoming/outgoing links affected by a change.
- Compare current and superseded versions.

For a newly proposed record, the default review actions should be:

- `Accept proposal`: promote the record into accepted case knowledge.
- `Reject proposal`: require or strongly encourage the user to enter a reason so the rejection is auditable and useful to later agents.
- `Delete proposal`: remove the proposal from the active review surface when it is noise, duplicate, or not worth preserving as a rejected item.
- `Suggest edits`: use a compact AI/sparkle action that lets the user ask for a revised proposal instead of manually rewriting it.

If the proposal is intended to supersede another record, the UI must make that explicit before the user acts. Show that it is a proposed superseding record, reference the record it wants to supersede, and give the user a way to inspect or compare the target record.

When implementing this lifecycle, preserve auditability:

- Who or what created the record.
- Who last updated it.
- When it changed.
- Whether it was human-created or agent-created.
- Confidence, if generated or inferred.
- Source documents and supporting records.
- Supersession relationships.

## Workspace And Case Structure

The current product direction separates workspace-level collaboration from case-level intelligence.

Workspace:

- Created by a user.
- Can have members and invitations.
- Owns a storage bucket/prefix.
- Contains one or more managed cases.
- May eventually have workspace-level messages, settings, billing, and shared policies.

Case:

- Belongs to a workspace.
- Starts with initial intake.
- Contains documents, structured records, derived views, and manifests.
- Is the main unit of legal reasoning and AI workflows.

Case workspace partitions should align with `StateObjectTypes` and Prisma `CaseRecordType`.

Current naming caveat:

- Frontend types use lower-case string values such as `"case_notes"`.
- Prisma uses enum values such as `CASE_NOTE @map("case_notes")`.
- API and codegen should make this mapping intentional so UI code does not hand-roll fragile conversions.

## Record Types

Use these conceptual meanings when designing UI, schema fields, or agent prompts.

- Arguments: claims, defenses, counterarguments, theories, and strategic legal positions.
- Case notes: human or agent notes, strategy thoughts, research notes, questions, and observations.
- Facts: background, disputed, undisputed, procedural, or other factual assertions.
- Issues: legal, factual, procedural, or strategic questions that organize the case.
- Legal precedent: cited authority, jurisdiction, court, citation, and relevance to the case.
- Objectives: desired outcomes, priorities, settlement goals, and risk-aware case objectives.
- Posture: procedural status, litigation stage, discovery/settlement/appeal posture.
- Tasks: actionable work items with status, priority, and due dates.
- Testimony: anticipated, actual, or impeachment-related witness testimony.
- Timeline: dated events with date confidence.

Each record type should share a base record contract and add typed metadata only where it improves the user experience or agent reasoning.

## Documents

Documents should be indexed and linked into the case model.

Expected document flow:

1. User uploads a file under a workspace/case-scoped S3 key.
2. The system creates a `CaseDocumentIndex` row with category, file name, storage location, MIME metadata, status, and user description.
3. An async or agentic processor extracts text/metadata where possible.
4. The system generates an LLM summary and searchable text.
5. The agent proposes links to existing or new records.
6. Human review accepts, rejects, edits, or supersedes proposed knowledge.

The document object itself should not become the only place knowledge lives. It should support records.

## Master Markdown Views

The product vision includes master markdown records/views for each case workspace partition and one master agent/workspace file.

Represent these as derived `CaseViewIndex` records where possible:

- `arguments.md`: list argument record filenames/ids, mini summaries, relationship highlights, and overall argument synthesis.
- `facts.md`: accepted and proposed facts, disputed status, source links, and confidence notes.
- `issues.md`: key legal/factual/procedural issues, linked facts, arguments, and precedent.
- `timeline.md`: dated case events, source documents, confidence, and gaps.
- `documents_index.md`: uploaded documents, summaries, categories, and linked records.
- `case_summary.md`: case-wide synthesis from accepted records and selected proposed items.
- `agent_config.md` or `agent.md`: agent instructions, case workspace conventions, tool permissions, and current strategy constraints.

Rules for these views:

- Treat structured records and indexes as source of truth.
- Store the generated view in S3 and index it in the database.
- Track version, source hash, generation actor, and manifest where possible.
- Make stale views detectable when source records or documents change.

## Agentic Workflows

Agents should propose changes; users decide what becomes accepted case knowledge.

Near-term useful workflows:

- Generate initial workspace records from the case intake wizard.
- Summarize uploaded documents and propose related records.
- Propose links between documents and facts/issues/arguments/timeline events.
- Enrich an existing record based on a user prompt.
- Propose a superseding record when new context conflicts with accepted material.
- Generate or refresh master markdown views.
- Identify inconsistencies, missing evidence, unresolved issues, and timeline gaps.

Agent outputs should be structured. Avoid freeform blobs when the UI needs actionable proposals.

Every agent workflow should answer:

- What records are being proposed or changed?
- What links are being proposed or changed?
- What sources support the proposal?
- What confidence or uncertainty applies?
- What existing accepted records may be affected?
- What should the user review next?

The current `cdk-app/ecs_containers/langgraph-service` is a demo. When making it CaseOS-specific, keep the service boundary explicit:

- Inputs should include workspace id, case id, actor user id, operation name, relevant records/documents, and prompt/context.
- Outputs should be structured proposals ready to persist through backend mutations.
- Usage should create `LlmUsageEvent` rows for audit/billing.

## Frontend Experience

The frontend should present the case workspace as an operational legal dashboard, not a marketing page.

Current relevant UI:

- `/cases/new`: case intake wizard.
- `/case/$id`: authenticated case route shell.
- `WorkspaceMenu.tsx`: left menu for `agent_config`, `case_summary`, record partitions, timeline, and documents.
- `Workspace.tsx`: workspace-level overview shell with members and workspace actions.
- `agents/frontend-style-parity-agent.md`: visual style guide for app UI.

The desired `/case/$id` experience:

- Show the user only cases/workspaces they can access.
- Load the real case by route id.
- Show workspace/case title, search, and record partition navigation.
- Let each partition open a purpose-built interactive view.
- Support record creation, proposal review, filtering by status, and linked source inspection.
- Make AI actions available as workflow tools inside the relevant context.
- Surface proposed vs accepted vs rejected vs superseded state clearly.
- Make document uploads and document-derived summaries visible in the documents view.
- Let users trace a record to supporting documents and related records.

Do not turn every view into a generic markdown editor. Markdown views are useful summaries; structured record views are the working surface.

## Backend/API Direction

Near-term backend work should expose the existing Prisma domain through GraphQL with ownership and membership checks.

Expected API areas:

- Current user workspace memberships.
- Workspace list/details/invitations.
- Managed case create/read/update under workspace access.
- Case intake persistence and initial workspace generation trigger.
- Case document upload broker and document index mutations.
- Case record queries by case/type/status/search.
- Case record create/update/status transition/supersede mutations.
- Case record link proposal/accept/reject mutations.
- Case view queries and regeneration triggers.
- Case state manifest create/read/current queries.
- LLM usage event recording or service-side usage reporting.

Security rule of thumb:

- Every case/document/record/view access must verify workspace membership.
- Owner/admin/member capabilities should be explicit.
- Storage keys should be scoped under workspace/case prefixes, not user-provided arbitrary paths.

Use `agents/typed-contract-propagation-agent.md` for any schema-to-frontend contract work.

## Data Model Guidance

Preserve a hybrid model:

- PostgreSQL/Prisma indexes hold identity, ownership, status, metadata, graph edges, storage keys, search text, timestamps, and queryable fields.
- S3 stores larger markdown, JSON snapshots, original files, extracted text, and generated views.
- Manifests connect a coherent snapshot of records/views/documents when needed.

Prefer queryable columns for things the UI filters or sorts on:

- record type
- status
- visibility
- event date
- due date
- creator
- workspace/case ids
- category
- document status
- current manifest

Use JSON for flexible relationship maps and typed metadata while the domain is still evolving, but avoid hiding core workflow state only in JSON.

Known cleanup candidates:

- `catagory` in `WorkspaceRecordBase` should eventually become `category` or align with `recordCategory`.
- Reconcile frontend `CaseStatus` for legal procedural stage with Prisma `CaseStatus` for open/closed/archived. These are different concepts and should not share a name long term.
- Decide whether record statuses are required or optional. The product vision suggests agent-created records should default to proposed and accepted human records should be explicit.
- Define a stable conversion between Prisma enum names and UI string values.

## MVP Direction

A practical MVP should prove the loop from intake to structured records to human review.

Recommended MVP slice:

1. Authenticated user can create or select a workspace.
2. User can complete case intake and create a `ManagedCase`.
3. The system creates an initial case workspace state from intake.
4. Initial records are stored as proposed `CaseRecordIndex` entries, grouped by record type.
5. `/case/$id` loads real case data and shows the workspace menu.
6. At least facts, issues, arguments, timeline, and documents have usable views.
7. User can manually create a record.
8. User can accept/reject/edit/supersede a proposed record.
9. User can upload a document and see a document index row.
10. Agent can summarize the document or intake and propose records/links.
11. A case summary or record-type markdown view can be generated and displayed.

Avoid spending the first MVP pass on every possible record type if it slows the core loop. Facts, issues, arguments, timeline, and documents are enough to demonstrate the thesis.

## Implementation Checklist

Before changing code:

1. Identify whether the change is product model, persistence, API, frontend, agent workflow, storage, or infrastructure.
2. Read the nearest existing files instead of assuming patterns.
3. If the change touches the typed contract, follow `agents/typed-contract-propagation-agent.md`.
4. If the change adds app UI, follow `agents/frontend-style-parity-agent.md`.
5. Keep user-created changes in the worktree intact.

For new CaseOS domain work:

1. Start with the persistence and access model.
2. Add GraphQL fields/mutations with membership checks.
3. Add frontend operations and React Query hooks.
4. Build compact UI views with loading/error/empty/review states.
5. Add agent workflows only after the target records and proposal mutations exist.
6. Verify with codegen and a client build when feasible.

## Review Checklist

When reviewing CaseOS work, ask:

- Does this advance the structured case model, or does it collapse back into unstructured chat/files?
- Are proposed, accepted, rejected, and superseded states represented clearly?
- Are record links traceable and reviewable?
- Can the user understand why an AI proposal exists and what sources support it?
- Does the API enforce workspace/case access?
- Does the UI distinguish documents, records, and derived views?
- Are generated markdown views treated as derived artifacts rather than source of truth?
- Does the data contract propagate cleanly from Prisma to GraphQL to generated frontend types?
- Is this small enough to serve the MVP without freezing future schema refinement?

## Tone For Future Agents

Be conservative with architecture and ambitious with product clarity.

The codebase is early, so expect names and schemas to evolve. Do not overfit to the current draft types when the Prisma model already says something stronger, and do not ignore the draft types when they capture the intended user experience. Reconcile them deliberately.

The goal is not to build a perfect legal operating system in one pass. The goal is to create a trustworthy loop where messy case inputs become structured records, structured records become reviewable case intelligence, and human decisions keep the system grounded.
