// Source-grounded case knowledge graph.
// All records begin as PROPOSED (agent-generated) and must be explicitly
// ACCEPTED by a user before they are considered authoritative.
// Records and links both support versioning via replacement.

import type { CaseContext } from "./caseContext";
import type {
  DocumentCategory,
  DocumentProcessingStatus,
  PersonRole,
} from "./caseDomain";

export type { PersonRole };

// ─────────────────────────────────────────────────────────────────────────────
// Record taxonomy
// ─────────────────────────────────────────────────────────────────────────────

export type RecordType =
  // Level 0 – meta / orthogonal
  | "CASE_SUMMARY" // synthesized case brief (agent-generated)
  | "PERSON" // a party, witness, or attorney; referenced across all levels

  // Level 1 – strategic frame
  | "OBJECTIVE" // what we're trying to accomplish
  | "POSTURE" // current litigation posture
  | "CLAIM" // claims or allegations in the case

  // Level 2 – legal & analytical layer
  | "THEORY" // legal/factual theory of the case
  | "ISSUE" // discrete legal or factual issue
  | "QUESTION" // open analytical/strategic question to resolve with an answer
  | "ARGUMENT" // argument in support of a claim or theory
  | "TASK" // action item

  // Level 3 – evidentiary grounding
  | "FACT" // a discrete fact
  | "TIMELINE_EVENT" // a dated event in the case timeline
  | "TESTIMONY" // witness testimony (anticipated or actual)
  | "LEGAL_PRECEDENT" // case law, statute, or regulation
  | "NOTE" // open-ended note or question

  // Level 4 – source grounding layer (bridges raw files and the graph)
  | "DOCUMENT"; // record representing content extracted from a source file

// Natural information flow: high level depends on lower levels.
// PERSON (0) and CASE_SUMMARY (0) sit outside the main directional hierarchy.
export const RECORD_LEVEL: Record<RecordType, number> = {
  CASE_SUMMARY: 0,
  PERSON: 0,

  OBJECTIVE: 1,
  POSTURE: 1,
  CLAIM: 1,

  THEORY: 2,
  ISSUE: 2,
  QUESTION: 2,
  ARGUMENT: 2,
  TASK: 2,

  FACT: 3,
  TIMELINE_EVENT: 3,
  TESTIMONY: 3,
  LEGAL_PRECEDENT: 3,
  NOTE: 3,

  DOCUMENT: 4,
};

// ─────────────────────────────────────────────────────────────────────────────
// Status types
// ─────────────────────────────────────────────────────────────────────────────

// A record sits on TWO orthogonal axes, deliberately kept separate:
//
//   1. LIFECYCLE POSITION (this type) — mutually exclusive and monotonic:
//        PROPOSED → ACCEPTED (user approves)
//        PROPOSED → deleted (user discards the proposal before it enters the graph)
//        ACCEPTED → PENDING_REPLACEMENT (a proposed replacement exists)
//        PENDING_REPLACEMENT → REPLACED (replacement approved; old record retired)
//
//   2. FROZEN DISPOSITION (the `rejectedAt` / `rejectionReason` fields below) — a
//      reversible human action that turns a record into a traversal boundary
//      while keeping it as reference. Agents may encounter the record through a
//      link and read its rejection reason as context, but should not continue
//      traversal through it as an authoritative node. It is orthogonal to
//      lifecycle: a record can be frozen while ACCEPTED ("retire this live
//      record"), and a frozen record can still be REPLACED (regenerating a "fix"
//      keeps `rejectionReason`, so the trail of why it was rejected survives).
//      Frozen records are never deleted — they can be cited when proposing other
//      records, and can be restored.
//      "Rejected" is a derived display state (frozen + not replaced); it is NOT a
//      lifecycle position. See `recordIsFrozen` / `recordDisplayStatus`.
//
// Replacement is many-to-many, not just 1:1 — see `replacesIds` /
// `replacedByIds` on CaseRecord. One record can split into several (1→N) and
// several can merge into one (N→1).
export type RecordStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "PENDING_REPLACEMENT"
  | "REPLACED";

export type LinkStatus = "PROPOSED" | "ACCEPTED" | "REJECTED";
export type LinkStrength = "WEAK" | "MODERATE" | "STRONG";

// Evidentiary grounding — a first-class axis on assertion-bearing records
// (FACT, TIMELINE_EVENT, TESTIMONY, CLAIM, ARGUMENT, THEORY, ISSUE) and PERSON
// records. The agent reasons over this directly ("find evidence for every
// UNSUPPORTED argument"). CONFLICTED captures "evidence cuts both ways";
// UNKNOWN means not yet verified.
export type SupportStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED"
  | "CONFLICTED"
  | "SUPPORT_NOT_REQUIRED"
  | "UNKNOWN";

// Which side of the matter a record concerns. Resolved to display labels
// (e.g. "Defense" / "Plaintiffs") using CaseContext.representation.clientRole.
export type RecordParty = "ours" | "opposing" | "neutral";

export type RecordPriority = "low" | "medium" | "high";

// ─────────────────────────────────────────────────────────────────────────────
// Needs Review — an explicit, AGENT-ATTACHED axis (not derived).
//
// Distinct from the other axes on a record: lifecycle (`status`), evidentiary
// grounding (`supportStatus`), and domain phase (`substatus`) are properties the
// agent *infers* about a record. Review state is a property the review agent
// *decides and attaches* — a deliberate "a human should re-check this, and here's
// why." The agent flags a record ONLY when something upstream changed that
// affects whether the record is still TRUE, still WELL-SUPPORTED, or still
// LEGALLY USEFUL — not for routine graph churn. Absent ⇒ no review needed.
// Stored on the record (alongside `typedMeta` server-side), never recomputed by
// the UI: the agent is the single author of the flag, and it can selectively
// propagate one along the graph (e.g. flag a fact because the document that
// evidenced it was retired).
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewSeverity = "low" | "medium" | "high";

export interface ReviewNeeded {
  severity: ReviewSeverity;
  // Short human-readable reason; the triangle tooltip and the review-queue /
  // inspector title (e.g. "Discovery chronology disputed").
  reason: string;
  // Optional longer explanation, surfaced in the inspector and the queue detail.
  detail?: string;
  // Optional upstream cause — the record whose change triggered this flag. Lets
  // the agent record "why" and the UI offer a jump-to link. Optional so a
  // standalone flag needs no graph context.
  sourceRecordId?: string;
  // True ⇒ this flag BLOCKS acceptance of proposals that depend on it: the
  // dependent proposal cannot be accepted until this flag is cleared. Used for
  // "accepting proposal A would change records proposal B relies on — resolve A
  // first." Absent/false ⇒ an advisory flag that does not block anything.
  blocking?: boolean;
}

// What accepting a PROPOSAL would do to other records. The review agent computes
// this so the human can see the downstream consequences BEFORE accepting; on
// accept, each entry seeds a `reviewNeeded` flag on its target record (the agent
// re-checks those records because this proposal changed something they relied
// on). Only meaningful on PROPOSED records. Hardcoded in the demo for now.
export interface ProposalImpact {
  // The existing record this proposal would affect on acceptance.
  targetRecordId: string;
  // How it changes the target ("weakens support", "reopens the question").
  effect: string;
  // Why — the rationale surfaced to the human before they accept.
  reason: string;
  // Severity of the `reviewNeeded` flag this impact would create on the target.
  severity: ReviewSeverity;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-type substatus — the record's domain LIFECYCLE (its "phase").
//
// Intentionally lifecycle-only. Two things that used to live here have moved:
//   • evidentiary state  → `supportStatus` (SUPPORTED/CONFLICTED/UNKNOWN/…)
//   • "needs review"     → its own explicit `reviewNeeded` axis on CaseRecord,
//     set by the review agent (reason + severity), not packed into substatus.
// Records whose state is fully captured by support + lifecycle status carry no
// substatus at all (FACT, TIMELINE_EVENT, POSTURE, PERSON, DOCUMENT,
// CASE_SUMMARY).
// ─────────────────────────────────────────────────────────────────────────────

export type ObjectiveSubstatus =
  | "ACTIVE"
  | "AT_RISK"
  | "ACHIEVED"
  | "ABANDONED";
export type ClaimSubstatus =
  | "ASSERTED"
  | "ANTICIPATED"
  | "WITHDRAWN"
  | "DISMISSED";
export type TheorySubstatus = "ADOPTED" | "EXPLORING" | "BACKUP" | "ABANDONED";
export type IssueSubstatus = "OPEN" | "RESERVED" | "RESOLVED";
export type ArgumentSubstatus = "DRAFT" | "TRIAL_READY";
// Work phase only. "Blocked" is intentionally NOT here — an impediment is
// orthogonal to phase. When a task is blocked (e.g. an unmet REQUIRES
// prerequisite), the agent surfaces it through the `reviewNeeded` axis, not by
// inventing a phase for it.
export type TaskSubstatus = "OPEN" | "IN_PROGRESS" | "DONE";
// A question is either still open or resolved with a written answer. Being
// ANSWERED is inseparable from having an `answer` on the record (see
// QuestionRecord): you answer a question by writing the answer, which is the act
// that moves it to ANSWERED.
export type QuestionSubstatus = "UNANSWERED" | "ANSWERED";
export type TestimonySubstatus = "ANTICIPATED" | "PREPARED" | "GIVEN";
// Precedent treatment — the authority's standing in current law. (Whether the
// cite has been verified is the separate `citeChecked` flag on the record.)
export type PrecedentSubstatus =
  | "GOOD_LAW"
  | "DISTINGUISHED"
  | "QUESTIONED"
  | "OVERRULED";
export type NoteSubstatus = "OPEN_QUESTION" | "RESOLVED";

export type RecordSubstatus =
  | ObjectiveSubstatus
  | ClaimSubstatus
  | TheorySubstatus
  | IssueSubstatus
  | ArgumentSubstatus
  | TaskSubstatus
  | QuestionSubstatus
  | TestimonySubstatus
  | PrecedentSubstatus
  | NoteSubstatus;

// Granularity of a timeline event's date — controls how much of the timestamp
// is meaningful and therefore displayed. Ordered coarse → fine. "day" is the
// default; the sub-day precisions ("hour"/"minute"/"second") require a time
// component in `eventDate` (ISO 8601, e.g. "1994-06-12T22:25:00") and "hour"
// renders the hour only ("… 10 PM"). Coarser values ("year"/"month") read as an
// approximate date. The single source of truth for the ordered set, display
// formatting, and input behavior is `#/lib/datePrecision`.
export type DatePrecision =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second";

// Semantic edge types in the knowledge graph.
// Direction: fromRecord → type → toRecord
//
// Links are stored in a single CANONICAL direction. The inverse relationship is
// never stored as its own type; the UI derives the inverse label when a record
// is viewed as the target (e.g. DOCUMENT EVIDENCES FACT displays as "Evidences"
// on the document and "Evidenced by" on the fact). See
// caseRecordPresentation.LINK_TYPE_LABEL_PAIRS for the label mapping.
export type RecordLinkType =
  | "DEPENDS_ON" // fromRecord relies on toRecord (follows RECORD_LEVEL flow)
  | "SUPPORTS" // fromRecord strengthens / supports toRecord
  | "EVIDENCES" // fromRecord provides evidence for toRecord (usually from a DOCUMENT record)
  | "CONTRADICTS" // fromRecord directly conflicts with toRecord
  | "ATTACKS" // fromRecord undermines credibility/reliability/validity of toRecord
  | "EXPLAINS" // fromRecord clarifies or explains toRecord
  | "CONTEXTUALIZES" // fromRecord provides surrounding context for toRecord
  | "CITES" // fromRecord explicitly cites toRecord (e.g. a LEGAL_PRECEDENT)
  | "DERIVED_FROM" // fromRecord was synthesized from toRecord
  | "REQUIRES" // fromRecord requires toRecord before it is valid or actionable
  | "LEADS_TO" // fromRecord causes or leads to toRecord
  | "INVOLVES" // fromRecord involves toRecord (always a PERSON record)
  | "DUPLICATES" // fromRecord is a potential duplicate of toRecord (flag for review)
  | "RELATED_TO"; // fallback relationship when no specific type applies

// ─────────────────────────────────────────────────────────────────────────────
// Base record interface
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseRecord {
  id: string;
  workspaceId: string;
  caseId: string;
  type: RecordType;

  // Short display label; included in embeddings alongside content.
  title: string;
  // Full prose content; this is what gets chunked and embedded.
  content: string;
  // One-line description for cards and search results.
  summary?: string;
  // Free-form segmentation tag (e.g. "Habitability", "Discovery").
  category?: string;
  party?: RecordParty;
  priority?: RecordPriority;

  // Agent-attached "needs review" flag (reason + severity). Absent ⇒ no review
  // needed. See ReviewNeeded — explicit and stored, not derived from the other
  // axes.
  reviewNeeded?: ReviewNeeded;
  // What accepting THIS proposal would do to other records (only set on PROPOSED
  // records). See ProposalImpact.
  proposalImpact?: ProposalImpact[];

  status: RecordStatus;
  // Typed per record type; narrowed in each typed interface below.
  substatus?: RecordSubstatus;
  supportStatus?: SupportStatus;
  // Human/agent-readable rationale for why supportStatus is set the way it is:
  // the evidence, conflict, or gap behind the support assessment.
  supportStatusExplanation?: string;

  // Versioning – follows the replacement lifecycle. Both directions are
  // many-valued so the graph can model splits and merges, not just 1:1 edits:
  //   • split  (1→N): one source has several entries in `replacedByIds`
  //   • merge  (N→1): one successor has several entries in `replacesIds`
  // The two arrays are inverse views of the same predecessor→successor edges.
  version: number;
  replacedByIds?: string[]; // IDs of the record(s) that replace this one
  replacesIds?: string[]; // IDs of older record(s) this one replaces

  // Authorship & approval
  createdBy?: "human" | "agent";
  createdByUserId?: string;
  approvedByUserId?: string;
  approvedAt?: string;

  // Frozen disposition — orthogonal to `status` (see RecordStatus). `rejectedAt`
  // marks a record as frozen: a reference-only traversal boundary until restored.
  // Agents may use the record's incident link and rejection reason as context,
  // then stop instead of traversing through the rejected record. The reason lives
  // on the record (not the link), is required when a record is frozen so the
  // decision is auditable, and is retained even after a frozen record is
  // regenerated into a successor (it stays on the now-REPLACED record), so the
  // record of WHY it was rejected survives the fix.
  rejectionReason?: string;
  rejectedByUserId?: string;
  rejectedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed record extensions
// Each extends CaseRecord with a type discriminant and type-specific fields.
// Type-specific fields are stored in `typedMeta` (Json) in the database.
// ─────────────────────────────────────────────────────────────────────────────

export interface ObjectiveRecord extends CaseRecord {
  type: "OBJECTIVE";
  substatus: ObjectiveSubstatus;
}

export interface PostureRecord extends CaseRecord {
  type: "POSTURE";
  // Posture has no lifecycle phase of its own; staleness is derived from age.
  substatus?: undefined;
}

export interface ClaimRecord extends CaseRecord {
  type: "CLAIM";
  substatus: ClaimSubstatus;
  claimType?:
    | "affirmative"
    | "counterclaim"
    | "cross"
    | "third_party"
    | "defense";
}

export interface TheoryRecord extends CaseRecord {
  type: "THEORY";
  substatus: TheorySubstatus;
}

export interface IssueRecord extends CaseRecord {
  type: "ISSUE";
  substatus: IssueSubstatus;
  issueType?: "legal" | "factual" | "procedural" | "strategic";
}

export interface ArgumentRecord extends CaseRecord {
  type: "ARGUMENT";
  substatus: ArgumentSubstatus;
}

export interface TaskRecord extends CaseRecord {
  type: "TASK";
  substatus: TaskSubstatus;
  dueDate?: string; // ISO 8601
  assignedToUserId?: string;
}

// An open question the team needs to resolve — the analytical-layer counterpart
// to a task. `content` holds the question; `answer` holds its resolution. The
// two states are coupled: a question is ANSWERED iff `answer` is present and
// non-empty. Writing the answer is what marks it answered; clearing it reopens
// the question. (Stored in `typedMeta` server-side, like TaskRecord.dueDate.)
export interface QuestionRecord extends CaseRecord {
  type: "QUESTION";
  substatus: QuestionSubstatus;
  answer?: string; // present iff substatus === "ANSWERED"
}

export interface FactRecord extends CaseRecord {
  type: "FACT";
  // A fact's state is its evidentiary grounding (`supportStatus`), not a phase.
  substatus?: undefined;
  // True for background facts that frame the case but are not load-bearing
  // proof (was the old "CONTEXT" substatus).
  isContextual?: boolean;
}

export interface TimelineEventRecord extends CaseRecord {
  type: "TIMELINE_EVENT";
  substatus?: undefined;
  eventDate: string; // ISO 8601 date, optionally with time ("…T22:25:00")
  // Optional closing bound. When present, the event spans `eventDate` →
  // `eventEndDate` (a meeting that ran 2–4 PM, or an instant known only to fall
  // within a window like "between 5:00 and 5:30"). Absent ⇒ a single instant,
  // the original behavior. Must be ≥ `eventDate`. `datePrecision` governs how
  // *both* bounds render, so a minute-precision window reads "5:00 – 5:30 PM".
  eventEndDate?: string; // ISO 8601, optionally with time
  datePrecision?: DatePrecision; // defaults to "day"
}

export interface TestimonyRecord extends CaseRecord {
  type: "TESTIMONY";
  substatus: TestimonySubstatus;
  witnessPersonRecordId?: string; // ID of the linked PERSON record
}

export interface LegalPrecedentRecord extends CaseRecord {
  type: "LEGAL_PRECEDENT";
  // Treatment (standing in current law); absent until the authority is verified.
  substatus?: PrecedentSubstatus;
  // False while the citation still needs verification (was "NEEDS_CITE_CHECK").
  citeChecked?: boolean;
  citation?: string; // e.g. "410 U.S. 113 (1973)"
  jurisdiction?: string;
  court?: string;
}

export interface NoteRecord extends CaseRecord {
  type: "NOTE";
  // Most notes have no phase ("GENERAL" is simply the absence of one).
  substatus?: NoteSubstatus;
  // Pinning is orthogonal to status — a flag, not a phase (was "PINNED").
  pinned?: boolean;
}

// PERSON – special record type.
// Can be linked from any other record via an INVOLVES GraphLink.
// content = free-text description/notes about this person.
export interface PersonRecord extends CaseRecord {
  type: "PERSON";
  substatus?: undefined;
  // People can still be source-grounded: identity, role, affiliation, or
  // involvement may be supported, conflicted, or unverified.
  supportStatus?: SupportStatus;
  name: string;
  roles: PersonRole[];
  primaryRole?: PersonRole;
  aliases?: string[];
  organization?: string;
}

// DOCUMENT – special record type; bridges CaseDocument (raw file) and the graph.
// A single source file can have many DocumentRecords (e.g. one per key section
// of a 40-page PDF). DocumentRecords link to the records they ground via
// EVIDENCES (canonical direction: DOCUMENT EVIDENCES FACT).
// content = description / extracted summary of what this record captures.
export interface DocumentRecord extends CaseRecord {
  type: "DOCUMENT";
  substatus?: undefined;
  documentId: string; // FK → CaseDocument.id (the actual stored file)
  fileName: string; // display label of the source file
  pageRange?: { start: number; end: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Case summary
// ─────────────────────────────────────────────────────────────────────────────

export type CaseSummarySectionType =
  | "OVERVIEW"
  | "FACTS"
  | "CLAIMS"
  | "ISSUES"
  | "ARGUMENTS"
  | "TIMELINE"
  | "EVIDENCE"
  | "RISKS"
  | "NEXT_STEPS"
  | "OPEN_QUESTIONS"
  | "CUSTOM";

export interface CaseSummarySection {
  id: string;
  type: CaseSummarySectionType;
  title: string;
  content: string;
  recordIds?: string[]; // records that contributed to this section
  updatedAt: string;
}

export interface CaseSummaryData {
  // Full snapshot of CaseContext at generation time (intentionally denormalized
  // so the summary stays self-contained even if context later changes).
  caseContextSnapshot: CaseContext;
  overview: string;
  sections: CaseSummarySection[];
  generatedFromRecordIds: string[];
  generatedAt: string;
}

export interface CaseSummaryRecord extends CaseRecord {
  type: "CASE_SUMMARY";
  substatus?: undefined;
  summary?: string;
  summaryData: CaseSummaryData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union of all record types
// ─────────────────────────────────────────────────────────────────────────────

export type TypedCaseRecord =
  | CaseSummaryRecord
  | ObjectiveRecord
  | PostureRecord
  | ClaimRecord
  | TheoryRecord
  | IssueRecord
  | ArgumentRecord
  | TaskRecord
  | QuestionRecord
  | FactRecord
  | TimelineEventRecord
  | TestimonyRecord
  | LegalPrecedentRecord
  | NoteRecord
  | PersonRecord
  | DocumentRecord;

// ─────────────────────────────────────────────────────────────────────────────
// Graph links
// ─────────────────────────────────────────────────────────────────────────────

// Edges in the knowledge graph. Both the link itself and the record it connects
// follow the same PROPOSED → ACCEPTED lifecycle so that the graph
// evolves safely as new evidence arrives.
export interface GraphLink {
  id: string;
  workspaceId: string;
  caseId: string;

  fromRecordId: string;
  fromRecordType: RecordType;
  toRecordId: string;
  toRecordType: RecordType;

  type: RecordLinkType;
  status: LinkStatus;

  // Versioning – mirrors record replacement pattern
  replacedById?: string;
  replacesIds?: string[];

  // Qualitative strength of this relationship as authored/reviewed.
  strength: LinkStrength;
  // Required: every edge must state WHY the connection exists. This rationale is
  // the connective tissue agents traverse and the justification human operators
  // read in the record inspector — an unexplained edge is not allowed.
  explanation: string;
  // Why this edge was rejected (status === "REJECTED"). A rejected link stays in
  // the graph on purpose: the agent reads the reason and learns the path was
  // abandoned WITHOUT having to traverse it. Absent on non-rejected links.
  rejectionReason?: string;

  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Source documents (the actual stored files)
// ─────────────────────────────────────────────────────────────────────────────

// Represents a file uploaded to storage (S3 / equivalent).
// Linked to the knowledge graph through one or more DOCUMENT type CaseRecords.
// DocumentChunks (for vector search) are derived directly from the raw file content.
export interface CaseDocument {
  id: string;
  workspaceId: string;
  caseId: string;
  fileName: string;
  storageKey: string; // key in object storage (S3/R2/etc.)
  mimeType?: string;
  fileSizeBytes?: number;
  category: DocumentCategory;
  description?: string;
  processingStatus: DocumentProcessingStatus;
  pageCount?: number;
  uploadedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chunks (vector grounding layer)
// ─────────────────────────────────────────────────────────────────────────────

// ownerType = "DOCUMENT"     → ownerId is a CaseDocument.id
//             "CASE_RECORD"  → ownerId is a CaseRecord.id
//
// RAG flow:
//   1. Vector search across all chunks
//   2. For DOCUMENT chunks: resolve CaseDocument → linked DocumentRecords
//      → traverse outbound EVIDENCES links to find FACT/ARGUMENT/etc. records
//   3. For CASE_RECORD chunks: resolve the record directly
//   4. Traverse additional links as needed for depth

export type ChunkOwnerType = "DOCUMENT" | "CASE_RECORD";

export interface Chunk {
  id: string;
  workspaceId: string;
  caseId: string;
  ownerType: ChunkOwnerType;
  ownerId: string; // CaseDocument.id or CaseRecord.id
  fileName: string; // display label for the source (file name or record label)
  pageNumber?: number; // for document chunks
  content: string;
  vectorKey: string; // reference key in the external vector store
  createdAt: string;
  updatedAt: string;
}
