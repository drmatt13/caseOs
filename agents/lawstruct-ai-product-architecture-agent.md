# lawstruct-ai Product And Architecture Agent

Use this agent when planning, implementing, or reviewing work that affects lawstruct-ai as a product: case workspaces, case records, documents, intake, graph relationships, AI-assisted reasoning, human review flows, or the persistence/API/UI contracts that make those features real.

This agent is intentionally broader than a single implementation task. Its job is to keep the application pointed at the product vision while respecting the codebase as it exists today.

## Product North Star

lawstruct-ai is an AI-assisted case intelligence platform for turning scattered legal and case material into structured, connected, searchable knowledge.

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

In plain terms: lawstruct-ai helps users turn messy legal material into an organized, traceable case model that both humans and AI agents can query and reason across.

## Current Repository Reality

The repo is a TypeScript monorepo that started as a local-first AWS/CDK development kit and is being shaped into lawstruct-ai.

Current major areas:

- `client-app/`: TanStack React frontend with Cognito auth, route guards, React Query, generated GraphQL client code, case intake UI, workspace shell, and a full-featured case workspace UI shell.
- `packages/database/`: Prisma schema, generated Prisma client, generated Pothos types, and shared database exports.
- `cdk-app/`: AWS CDK stacks plus Lambda functions for auth, billing, GraphQL, S3 access brokering, WebSocket routes, and an ECS/Fargate-style LangGraph service.
- `local-api-dev-server/`: local API Gateway/Lambda emulator.
- `local-ws-dev-server/`: local API Gateway WebSocket emulator.
- `frontend-ws-connection-and-payload-tester/`: local WebSocket testing UI.
- `agents/`: durable agent briefs for future Codex/implementation work.

Important current constraints:

- The Prisma schema contains lawstruct-ai domain models for workspaces, managed cases, document indexes, record indexes, view indexes, state manifests, and LLM usage events — but the case-related models (`ManagedCase`, `CaseDocumentIndex`, `CaseRecordIndex`, `CaseViewIndex`, `CaseStateManifest`, `LlmUsageEvent`) are currently commented out in `packages/database/prisma/schema.prisma`. Un-comment them when the case persistence layer is ready.
- The active GraphQL schema currently exposes only current-user and user-profile operations. Case, workspace, document, record, manifest, and view APIs are not yet exposed through GraphQL.
- The frontend case workspace route (`client-app/src/routes/workspaces.$workspaceId_.cases.$caseId.tsx`) is a full-featured demo UI shell backed by the demo dataset in `client-app/src/demo/caseWorkspaceDemo.ts`. It renders record views, the review queue, timeline, documents, people, the agent panel, and the overview. It does not yet load real case data from the backend. (The route delegates its local UI state to the `useCaseWorkspace` hook in `components/features/case-workspace/`.)
- The frontend domain type system is fully defined (see "Existing Product Model" below) and is the authoritative contract for the case knowledge graph domain. When adding GraphQL/backend support, reconcile Prisma field names with these types deliberately.
- The LangGraph service exists as a Bedrock-backed demo service with simple routing/tools. It is not yet a lawstruct-ai record-generation or enrichment workflow.
- S3/STS support exists today for profile picture upload. Case document storage and scoped document upload/download flows still need product-specific expansion.

## Existing Product Model

The frontend domain type system is split across four files in `client-app/src/types/`:

### `caseDomain.ts` — shared domain primitives
Defines: `RepresentationPracticeArea`, `ClientRole`, `RepresentationRole`, `CaseActiveStatus`, `CaseStatus` (procedural stage), `DocumentCategory`, `DocumentProcessingStatus`, `PersonRole`.

### `caseIntake.ts` — intake wizard data
Defines: `CaseIntake` (the raw form captured at case creation) and `CaseIntakeDocument`. Re-exports the domain primitives intake needs. Import intake types from here.

### `caseContext.ts` — case-level metadata
Defines: `CaseContext` — the structured frame derived from intake that drives party labels, objectives, claims, and posture for the whole workspace.

### `caseRecords.ts` — knowledge graph types
The authoritative frontend contract for case records, links, documents, and chunks.

Record taxonomy by level:
- Level 0 (meta/orthogonal): `CASE_SUMMARY`, `PERSON`
- Level 1 (strategic): `OBJECTIVE`, `POSTURE`, `CLAIM`
- Level 2 (analytical): `THEORY`, `ISSUE`, `ARGUMENT`, `TASK`
- Level 3 (evidentiary): `FACT`, `TIMELINE_EVENT`, `TESTIMONY`, `LEGAL_PRECEDENT`, `NOTE`
- Level 4 (source bridge): `DOCUMENT`

Key types:
- `RecordStatus`: `PROPOSED | ACCEPTED | REJECTED | SUPERSESSION_PENDING | SUPERSEDED`
- `LinkStatus`: `PROPOSED | ACCEPTED | REJECTED`
- `SupportStatus`: `SUPPORTED | PARTIALLY_SUPPORTED | UNSUPPORTED | SUPPORT_NOT_REQUIRED | SUPPORT_UNKNOWN`
- `RecordParty`: `ours | opposing | neutral` (resolved to case-specific labels via `CaseContext.representation.clientRole`)
- `RecordSubstatus`: typed union of per-type substatus enums (ObjectiveSubstatus, FactSubstatus, etc.) — no arbitrary strings allowed
- `TypedCaseRecord`: discriminated union of all 15 typed record interfaces
- `GraphLink`: edges in the knowledge graph with the same lifecycle as records
- `CaseDocument`: a stored file (S3); linked to the graph through DOCUMENT records
- `Chunk`: vector search unit owned by either a CaseDocument or a CaseRecord

### `caseWorkspace.ts` — view model and re-exports
Defines: `WorkspaceViewType`, `VIEW_RECORD_TYPE` (view → RecordType map), `RECORD_TYPE_VIEW` (reverse), `WORKSPACE_MENU_GROUPS` (sidebar grouping). Also re-exports `CaseStatus`, `ClientRole`, `DocumentCategory`, `RepresentationPracticeArea`, `RepresentationRole`, `CaseIntake`, and `CaseIntakeDocument` for backward compatibility with the intake wizard.

### `caseRecordPresentation.ts` — display labels and badge styles
All UI strings and Tailwind classes keyed by domain enums: `RECORD_STATUS_LABELS`, `RECORD_STATUS_CLASSES`, `RECORD_SUBSTATUS_LABELS`, `SUPPORT_STATUS_LABELS`, `REVIEW_SEVERITY_LABELS` / `REVIEW_SEVERITY_ICON_CLASSES` (the agent-attached needs-review axis), `RECORD_PARTY_CLASSES`, `RECORD_TYPE_LABELS`, `LINK_TYPE_LABELS`, `LINK_TYPE_INBOUND_LABELS`, `VIEW_LABELS`, `VIEW_DESCRIPTIONS`, `SINGULAR_VIEW_LABELS`, `recordPartyLabel()`.

### Demo dataset
`client-app/src/demo/caseWorkspaceDemo.ts` contains the full Faxon Commons v. Sweeney demo (Matthew's real housing case): `demoCase`, `demoCaseContext`, `demoRecords`, `demoLinks`, `demoDocuments`, `demoActivity`, `demoAgentThread`, `demoAgentInstructions`, plus constants `DEMO_CASE_ID`, `DEMO_WORKSPACE_ID`, `demoUserId`. (All hardcoded demo bundles live under `client-app/src/demo/`, resolved by `getCaseDemo` in `caseDemos.ts`.)

### Persistence model
`packages/database/prisma/schema.prisma` defines the case-related models (ManagedCase, CaseDocumentIndex, CaseRecordIndex, CaseViewIndex, CaseStateManifest, LlmUsageEvent) but they remain commented out. The active schema handles Users, Workspaces, WorkspaceMemberships, and WorkspaceInvitations. When un-commenting, reconcile Prisma field names with the frontend types above — Prisma uses SCREAMING_SNAKE_CASE enum values and snake_case column names; the frontend types use the same enum values (also SCREAMING_SNAKE_CASE for status/type fields), so the mapping is straightforward.

## Core Product Principles

1. Structured records are first-class.
   Documents matter, but they should feed a structured case model. A PDF summary should become useful because it can attach to facts, issues, arguments, testimony, precedent, and timelines.

2. Human review is mandatory for agent-created case knowledge.
   Agent-created records and links should begin as proposals. Users should accept, reject, edit, or supersede them before they become trusted case material.

3. Every case object should be traceable.
   Important claims, facts, and strategy suggestions should point back to evidence, documents, notes, testimony, or prior records when possible.

4. The graph matters.
   lawstruct-ai should preserve relationships between records. Updating or superseding one record should make affected links and derived views visible for review instead of silently hiding the consequences. This is realized by the needs-review axis: a change that affects whether a downstream record is still true, well-supported, or legally useful surfaces as a `reviewNeeded` flag on that record (see the Needs Review section), rather than quietly invalidating it.

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
accepted -> demoted to proposed when an endpoint slips back (see effectiveLinkStatus)
```

### Needs Review (the agent-attached review axis)

"Review needed" is a **first-class, explicit axis on a record** (`reviewNeeded`),
not a derived signal. The review agent attaches it — with a `severity`
(low/medium/high), a human `reason`, optional `detail`, the `sourceRecordId` that
triggered it, and an optional `blocking` flag — and is the single author of the
flag. The guardrail for *when* to flag: only when something upstream changed that
affects whether the record is still **true, well-supported, or legally useful**,
not for routine graph churn.

How it propagates across the graph: a PROPOSED record carries a `proposalImpact`
list describing which existing records accepting it would affect (effect + why),
shown **before** the accept decision. On accept, the system flags each impacted
target with `reviewNeeded` (today simulated by `applyProposalImpact`; the agent
will own it). A `blocking` review flag is a hard gate — a dependent proposal
cannot be accepted until the blocker is resolved (`Mark reviewed`).

Both PROPOSED and ACCEPTED records can be flagged. Flagged records surface in the
Overview "Needs Attention" queue and in the Review view's "Needs review" section
(accepted records now appear in review too, not only proposals). In dense views
the flag reads as a severity-tinted warning **triangle** (replacing the settings
cog on a card), never a text pill. See `agents/record-linking-agent.md` for the
rendering/derivation contract.

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
- Resolve a record's needs-review flag once it has been re-checked (`Mark reviewed`).
- See a proposal's downstream impact before accepting, and clear a blocking review
  flag before accepting a proposal that depends on it.
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

Use these conceptual meanings when designing UI, schema fields, or agent prompts. All types share the `CaseRecord` base and add a discriminant plus type-specific fields.

Level 0 — meta / orthogonal:
- Case summary: agent-synthesized overview of the full case; one per case; not filtered through normal record views.
- Person: party, witness, attorney, or other person referenced across the case. Linked via INVOLVES edges.

Level 1 — strategic frame:
- Objectives: desired outcomes, priorities, settlement goals, and risk-aware case objectives. Substatuses: ACTIVE, AT_RISK, ACHIEVED, ABANDONED.
- Claims: affirmative claims, counterclaims, defenses, and allegations by either side. Substatuses: ASSERTED, ANTICIPATED, WITHDRAWN, DISMISSED.
- Posture: current procedural and litigation posture. Substatuses: CURRENT, STALE.

Level 2 — legal and analytical:
- Theories: integrated legal/factual theories that frame how claims, facts, and arguments fit together. Substatuses: ADOPTED, EXPLORING, BACKUP, ABANDONED.
- Issues: discrete legal, factual, procedural, or strategic questions the case must answer. Substatuses: OPEN, RESERVED, RESOLVED.
- Arguments: positions in support of claims and theories, grounded in facts and sources. Substatuses: DRAFT, NEEDS_SUPPORT, TRIAL_READY.
- Tasks: actionable work items with status, priority, and due dates. Substatuses: OPEN, IN_PROGRESS, BLOCKED, DONE.

Level 3 — evidentiary grounding:
- Facts: discrete factual assertions with dispute posture and source support. Substatuses: UNDISPUTED, DISPUTED, NEEDS_SOURCE_REVIEW, CONTEXT.
- Timeline: chronological case events with date confidence. Substatuses: CONFIRMED, APPROXIMATE, DISPUTED, DATE_CONFLICT.
- Testimony: witness testimony (anticipated or actual). Substatuses: ANTICIPATED, PREPARED, GIVEN, IMPEACHMENT.
- Legal precedent: cited authority with citation, jurisdiction, and court. Substatuses: NEEDS_CITE_CHECK, GOOD_LAW, DISTINGUISHED, QUESTIONED, OVERRULED.
- Notes: open-ended notes, questions, and observations. Substatuses: GENERAL, PINNED, OPEN_QUESTION, RESOLVED.

Level 4 — source bridge:
- Document: a record representing content extracted from a source file (CaseDocument). One file can produce many document records. Document records link to the records they ground via EVIDENCES (canonical direction: DOCUMENT EVIDENCES FACT); the inverse "Evidenced by" label is derived in the UI.

Each record type should share the `CaseRecord` base contract and add typed fields only where they improve UX or agent reasoning. Type-specific fields are stored in `typedMeta` (JSON) in the database.

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
- `case_agent.md` or `agent.md`: agent instructions, case workspace conventions, tool permissions, and current strategy constraints.

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

The current `cdk-app/ecs_containers/langgraph-service` is a demo. When making it lawstruct-ai-specific, keep the service boundary explicit:

- Inputs should include workspace id, case id, actor user id, operation name, relevant records/documents, and prompt/context.
- Outputs should be structured proposals ready to persist through backend mutations.
- Usage should create `LlmUsageEvent` rows for audit/billing.

## Frontend Experience

The frontend should present the case workspace as an operational legal dashboard, not a marketing page.

Current relevant UI:

- `/workspaces/new`: new workspace creation.
- `/workspaces/:id`: workspace dashboard — members, invitations, workspace actions.
- `/workspaces/:workspaceId/cases/new`: case intake wizard (multi-step form).
- `/workspaces/:workspaceId/cases/:caseId`: the main case workspace shell (file: `workspaces.$workspaceId_.cases.$caseId.tsx`). Currently fully functional with demo data from `src/demo/caseWorkspaceDemo.ts`.
- `ActiveWorkspaceMenu.tsx`: left menu with groups — agent/overview/review, Strategy, Analysis, Grounding, Sources.
- `agents/frontend-style-parity-agent.md`: visual style guide for app UI.

The desired `/workspaces/:workspaceId/cases/:caseId` experience:

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

- Prisma's `CaseStatus` enum (OPEN/CLOSED/ARCHIVED) and the frontend's `CaseStatus` type (procedural stage: pre_filing, filed, discovery, etc.) are different concepts sharing a name. When un-commenting case models, rename one — Prisma's operational lifecycle enum could become `CaseActiveStatus` to match `caseDomain.ts`.
- The Prisma case record model uses JSON for `typedMeta` (type-specific fields). As usage stabilizes, promote the most-filtered substatus fields to real columns.
- Verify that Prisma `CaseRecordType` enum values map cleanly to the frontend `RecordType` type — both use SCREAMING_SNAKE_CASE; confirm alignment before writing the GraphQL layer.

## MVP Direction

A practical MVP should prove the loop from intake to structured records to human review.

Recommended MVP slice:

1. ✅ Authenticated user can create or select a workspace.
2. ✅ User can complete case intake and submit a `CaseIntake` form (intake wizard exists; case creation is pending backend wiring).
3. The system creates an initial case workspace state from intake (Prisma models must be un-commented first).
4. Initial records are stored as proposed `CaseRecordIndex` entries, grouped by record type.
5. `/workspaces/:workspaceId/cases/:caseId` loads real case data and shows the workspace menu (UI shell + demo data exists; backend wiring is the blocker).
6. ✅ All record-type views are implemented in the demo UI shell — facts, issues, arguments, timeline, documents, and all others.
7. User can manually create a record (UI flow needed).
8. User can accept/reject/edit/supersede a proposed record (review queue UI exists in demo; mutations needed).
9. User can upload a document and see a document index row.
10. Agent can summarize the document or intake and propose records/links.
11. A case summary or record-type markdown view can be generated and displayed.

The demo UI shell already demonstrates the full workspace experience. The next priority is wiring the real backend: un-comment Prisma models, add GraphQL mutations for case/record CRUD, and replace demo data with live queries.

## Implementation Checklist

Before changing code:

1. Identify whether the change is product model, persistence, API, frontend, agent workflow, storage, or infrastructure.
2. Read the nearest existing files instead of assuming patterns.
3. If the change touches the typed contract, follow `agents/typed-contract-propagation-agent.md`.
4. If the change adds app UI, follow `agents/frontend-style-parity-agent.md`.
5. Keep user-created changes in the worktree intact.

For new lawstruct-ai domain work:

1. Start with the persistence and access model.
2. Add GraphQL fields/mutations with membership checks.
3. Add frontend operations and React Query hooks.
4. Build compact UI views with loading/error/empty/review states.
5. Add agent workflows only after the target records and proposal mutations exist.
6. Verify with codegen and a client build when feasible.

## Review Checklist

When reviewing lawstruct-ai work, ask:

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
