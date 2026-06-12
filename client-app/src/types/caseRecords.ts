// source-grounded case knowledge graph

export type PersonRole =
  | "PLAINTIFF"
  | "DEFENDANT"
  | "PETITIONER"
  | "RESPONDENT"
  | "WITNESS"
  | "EXPERT_WITNESS"
  | "FACT_WITNESS"
  | "ATTORNEY"
  | "PARALEGAL"
  | "JUDGE"
  | "MAGISTRATE"
  | "MEDIATOR"
  | "ARBITRATOR"
  | "CLIENT"
  | "PROPERTY_MANAGER"
  | "LANDLORD"
  | "TENANT"
  | "EMPLOYER"
  | "EMPLOYEE"
  | "CONTRACTOR"
  | "PHYSICIAN"
  | "THERAPIST"
  | "CASE_WORKER"
  | "POLICE_OFFICER"
  | "INVESTIGATOR"
  | "GOVERNMENT_OFFICIAL"
  | "AGENCY_REPRESENTATIVE"
  | "CORPORATE_REPRESENTATIVE"
  | "THIRD_PARTY"
  | "UNKNOWN";

export interface CasePerson {
  id: string;
  name: string;
}

export type PersonCaseRole =
  | "PLAINTIFF"
  | "DEFENDANT"
  | "WITNESS"
  | "ATTORNEY"
  | "JUDGE"
  | "THIRD_PARTY";

// ^ EXPERIMENTAL

export type RecordStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "REJECTED"
  | "SUPERSESSION_PENDING"
  | "SUPERSEDED";

export type RecordLinkType =
  | "DEPENDS_ON" // higher record relies on lower record
  | "EVIDENCED_BY" // record is grounded by source/document
  | "CONTRADICTED_BY"
  | "EXPLAINED_BY"
  | "CONTEXTUALIZED_BY"
  | "CITES"
  | "DERIVED_FROM"
  | "SUPERSEDES"
  | "DUPLICATES"
  | "RELATED_TO";

export type SupportStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED"
  | "SUPPORT_NOT_REQUIRED"
  | "SUPPORT_UNKNOWN";

export type RecordType =
  | "CASE_SUMMARY"
  | "ARGUMENT"
  | "CLAIM"
  | "NOTE"
  | "FACT"
  | "ISSUE"
  | "LEGAL_PRECEDENT"
  | "OBJECTIVE"
  | "POSTURE"
  | "TASK"
  | "TESTIMONY"
  | "THEORY"
  | "TIMELINE_EVENT"
  | "DOCUMENT";

export const RECORD_LEVEL: Record<RecordType, number> = {
  CASE_SUMMARY: 0,

  // What are we trying to accomplish?
  OBJECTIVE: 1,
  POSTURE: 1,
  CLAIM: 1,

  // How are we framing and pursuing it?
  THEORY: 2,
  ISSUE: 2,
  ARGUMENT: 2,
  TASK: 2,

  // What supports it?
  FACT: 3,
  TIMELINE_EVENT: 3,
  TESTIMONY: 3,
  LEGAL_PRECEDENT: 3,
  NOTE: 3,

  DOCUMENT: 4,
};

export interface Document {
  id: string;
  workspaceId: string;
  caseId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseRecord {
  id: string;
  workspaceId: string;
  caseId: string;
  approvedBy?: string;
  type: RecordType;
  content: string;
  status: RecordStatus;
  supportStatus?: SupportStatus;
  supersededBy?: string; // record ID of the newer record that supersedes this one
  supersedes?: string[]; // record IDs of older records that this record supersedes
  createdAt: string;
  updatedAt: string;
}

export interface GraphLink {
  id: string;
  workspaceId: string;
  caseId: string;

  fromNodeType: RecordType;
  fromNodeId: string;

  toNodeType: RecordType;
  toNodeId: string;

  type: RecordLinkType;

  confidence?: number;
  explanation?: string;

  createdAt: string;
  updatedAt: string;
}

export type ChunkOwnerType = "DOCUMENT" | "CASE_RECORD";

export interface Chunk {
  id: string;
  workspaceId: string;
  caseId: string;
  ownerType: ChunkOwnerType;
  ownerId: string; // record ID or document ID that this chunk belongs to
  fileName: string; // the document or record that this chunk belongs to
  pageNumber?: number; // for document chunks, the page number this chunk belongs to
  content: string;
  vectorKey: string;
  createdAt: string;
  updatedAt: string;
}
