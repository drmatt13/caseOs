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
  | "CASE_SUMMARY"    // synthesized case overview (agent-generated)
  | "PERSON"          // a party, witness, or attorney; referenced across all levels

  // Level 1 – strategic frame
  | "OBJECTIVE"       // what we're trying to accomplish
  | "POSTURE"         // current litigation posture
  | "CLAIM"           // claims or allegations in the case

  // Level 2 – legal & analytical layer
  | "THEORY"          // legal/factual theory of the case
  | "ISSUE"           // discrete legal or factual issue
  | "ARGUMENT"        // argument in support of a claim or theory
  | "TASK"            // action item

  // Level 3 – evidentiary grounding
  | "FACT"            // a discrete fact
  | "TIMELINE_EVENT"  // a dated event in the case timeline
  | "TESTIMONY"       // witness testimony (anticipated or actual)
  | "LEGAL_PRECEDENT" // case law, statute, or regulation
  | "NOTE"            // open-ended note or question

  // Level 4 – source grounding layer (bridges raw files and the graph)
  | "DOCUMENT";       // record representing content extracted from a source file

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

// Lifecycle of a single record:
//   PROPOSED → ACCEPTED (user approves)
//   PROPOSED → REJECTED (user rejects)
//   ACCEPTED → PENDING_REPLACEMENT (a proposed replacement exists)
//   PENDING_REPLACEMENT → REPLACED (replacement approved; old record retired)
//
// Replacement is many-to-many, not just 1:1 — see `replacesIds` /
// `replacedByIds` on CaseRecord. One record can split into several (1→N) and
// several can merge into one (N→1).
export type RecordStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "REJECTED"
  | "PENDING_REPLACEMENT"
  | "REPLACED";

export type LinkStatus = "PROPOSED" | "ACCEPTED" | "REJECTED";

export type SupportStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED"
  | "SUPPORT_NOT_REQUIRED"
  | "SUPPORT_UNKNOWN";

// Which side of the matter a record concerns. Resolved to display labels
// (e.g. "Defense" / "Plaintiffs") using CaseContext.representation.clientRole.
export type RecordParty = "ours" | "opposing" | "neutral";

export type RecordPriority = "low" | "medium" | "high";

// ─────────────────────────────────────────────────────────────────────────────
// Per-type substatus (replaces free-text "typeStatus")
// Each record type carries a small, typed working state in addition to the
// shared PROPOSED/ACCEPTED lifecycle.
// ─────────────────────────────────────────────────────────────────────────────

export type ObjectiveSubstatus = "ACTIVE" | "AT_RISK" | "ACHIEVED" | "ABANDONED";
export type PostureSubstatus = "CURRENT" | "STALE";
export type ClaimSubstatus = "ASSERTED" | "ANTICIPATED" | "WITHDRAWN" | "DISMISSED";
export type TheorySubstatus = "ADOPTED" | "EXPLORING" | "BACKUP" | "ABANDONED";
export type IssueSubstatus = "OPEN" | "RESERVED" | "RESOLVED";
export type ArgumentSubstatus = "DRAFT" | "NEEDS_SUPPORT" | "TRIAL_READY";
export type TaskSubstatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type FactSubstatus =
  | "UNDISPUTED"
  | "DISPUTED"
  | "NEEDS_SOURCE_REVIEW"
  | "CONTEXT";
export type TimelineEventSubstatus =
  | "CONFIRMED"
  | "APPROXIMATE"
  | "DISPUTED"
  | "DATE_CONFLICT";
export type TestimonySubstatus =
  | "ANTICIPATED"
  | "PREPARED"
  | "GIVEN"
  | "IMPEACHMENT";
export type PrecedentSubstatus =
  | "NEEDS_CITE_CHECK"
  | "GOOD_LAW"
  | "DISTINGUISHED"
  | "QUESTIONED"
  | "OVERRULED";
export type NoteSubstatus = "GENERAL" | "PINNED" | "OPEN_QUESTION" | "RESOLVED";

export type RecordSubstatus =
  | ObjectiveSubstatus
  | PostureSubstatus
  | ClaimSubstatus
  | TheorySubstatus
  | IssueSubstatus
  | ArgumentSubstatus
  | TaskSubstatus
  | FactSubstatus
  | TimelineEventSubstatus
  | TestimonySubstatus
  | PrecedentSubstatus
  | NoteSubstatus;

// Semantic edge types in the knowledge graph.
// Direction: fromRecord → type → toRecord
//
// Links are stored in a single CANONICAL direction. The inverse relationship is
// never stored as its own type; the UI derives the inverse label when a record
// is viewed as the target (e.g. DOCUMENT EVIDENCES FACT displays as "Evidences"
// on the document and "Evidenced by" on the fact). See
// caseRecordPresentation.LINK_TYPE_LABEL_PAIRS for the label mapping.
export type RecordLinkType =
  | "DEPENDS_ON"         // fromRecord relies on toRecord (follows RECORD_LEVEL flow)
  | "SUPPORTS"           // fromRecord strengthens / supports toRecord
  | "EVIDENCES"          // fromRecord provides evidence for toRecord (usually from a DOCUMENT record)
  | "CONTRADICTS"        // fromRecord directly conflicts with toRecord
  | "ATTACKS"            // fromRecord undermines credibility/reliability/validity of toRecord
  | "EXPLAINS"           // fromRecord clarifies or explains toRecord
  | "CONTEXTUALIZES"     // fromRecord provides surrounding context for toRecord
  | "CITES"              // fromRecord explicitly cites toRecord (e.g. a LEGAL_PRECEDENT)
  | "DERIVED_FROM"       // fromRecord was synthesized from toRecord
  | "REQUIRES"           // fromRecord requires toRecord before it is valid or actionable
  | "LEADS_TO"           // fromRecord causes or leads to toRecord
  | "INVOLVES"           // fromRecord involves toRecord (always a PERSON record)
  | "DUPLICATES"         // fromRecord is a potential duplicate of toRecord (flag for review)
  | "RELATED_TO";        // fallback relationship when no specific type applies

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

  status: RecordStatus;
  // Typed per record type; narrowed in each typed interface below.
  substatus?: RecordSubstatus;
  supportStatus?: SupportStatus;

  // Versioning – follows the replacement lifecycle. Both directions are
  // many-valued so the graph can model splits and merges, not just 1:1 edits:
  //   • split  (1→N): one source has several entries in `replacedByIds`
  //   • merge  (N→1): one successor has several entries in `replacesIds`
  // The two arrays are inverse views of the same predecessor→successor edges.
  version: number;
  replacedByIds?: string[]; // IDs of the record(s) that replace this one
  replacesIds?: string[];   // IDs of older record(s) this one replaces

  // Authorship & approval
  createdBy: "human" | "agent";
  createdByUserId?: string;
  approvedByUserId?: string;
  approvedAt?: string;

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
  substatus: PostureSubstatus;
}

export interface ClaimRecord extends CaseRecord {
  type: "CLAIM";
  substatus: ClaimSubstatus;
  claimType?: "affirmative" | "counterclaim" | "cross" | "third_party" | "defense";
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

export interface FactRecord extends CaseRecord {
  type: "FACT";
  substatus: FactSubstatus;
}

export interface TimelineEventRecord extends CaseRecord {
  type: "TIMELINE_EVENT";
  substatus: TimelineEventSubstatus;
  eventDate: string; // ISO 8601 date
}

export interface TestimonyRecord extends CaseRecord {
  type: "TESTIMONY";
  substatus: TestimonySubstatus;
  witnessPersonRecordId?: string; // ID of the linked PERSON record
}

export interface LegalPrecedentRecord extends CaseRecord {
  type: "LEGAL_PRECEDENT";
  substatus: PrecedentSubstatus;
  citation?: string;    // e.g. "410 U.S. 113 (1973)"
  jurisdiction?: string;
  court?: string;
}

export interface NoteRecord extends CaseRecord {
  type: "NOTE";
  substatus: NoteSubstatus;
}

// PERSON – special record type.
// Can be linked from any other record via an INVOLVES GraphLink.
// content = free-text description/notes about this person.
export interface PersonRecord extends CaseRecord {
  type: "PERSON";
  substatus?: undefined;
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
  documentId: string;               // FK → CaseDocument.id (the actual stored file)
  fileName: string;                 // display label of the source file
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

  confidence?: number; // 0–1, agent confidence in this connection
  explanation?: string;

  createdBy: "human" | "agent";
  createdByUserId?: string;
  approvedByUserId?: string;
  approvedAt?: string;

  createdAt: string;
  updatedAt: string;
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
  ownerId: string;     // CaseDocument.id or CaseRecord.id
  fileName: string;    // display label for the source (file name or record label)
  pageNumber?: number; // for document chunks
  content: string;
  vectorKey: string;   // reference key in the external vector store
  createdAt: string;
  updatedAt: string;
}
