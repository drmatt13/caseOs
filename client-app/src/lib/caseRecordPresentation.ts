// Display labels, descriptions, and badge styling for the case knowledge
// graph. Keyed by the real domain enums so the UI never renders arbitrary
// strings.

import type { ClientRole } from "#/types/caseDomain";
import type {
  RecordLinkType,
  RecordStatus,
  RecordSubstatus,
  RecordType,
  RecordParty,
  SupportStatus,
} from "#/types/caseRecords";
import type { WorkspaceViewType } from "#/types/caseWorkspace";

// ─────────────────────────────────────────────────────────────────────────────
// Record lifecycle status
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  PROPOSED: "Proposed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  SUPERSESSION_PENDING: "Supersession proposed",
  SUPERSEDED: "Superseded",
};

// Badge styling (the small status pill).
export const RECORD_STATUS_CLASSES: Record<RecordStatus, string> = {
  ACCEPTED: "border-green-300 bg-green-100 text-green-800",
  PROPOSED: "border-blue-300 bg-blue-100 text-blue-800",
  REJECTED: "border-red-300 bg-red-100 text-red-800",
  SUPERSESSION_PENDING: "border-amber-300 bg-amber-100 text-amber-900",
  SUPERSEDED: "border-black/15 bg-black/[0.06] text-black/55",
};

// Card surface tint keyed by status so a record's lifecycle reads at a glance:
//   proposed → light blue, supersession proposed → yellow, superseded → gray,
//   accepted / rejected → the default translucent white surface.
export const RECORD_STATUS_CARD_CLASSES: Record<RecordStatus, string> = {
  ACCEPTED: "border-black/15 bg-white/70",
  PROPOSED: "border-blue-200 bg-blue-50",
  REJECTED: "border-red-100 bg-red-50/50",
  SUPERSESSION_PENDING: "border-amber-200 bg-amber-50",
  SUPERSEDED: "border-black/10 bg-black/[0.04]",
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-type substatus
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_SUBSTATUS_LABELS: Record<RecordSubstatus, string> = {
  // Objective
  ACTIVE: "Active",
  AT_RISK: "At risk",
  ACHIEVED: "Achieved",
  ABANDONED: "Abandoned",
  // Posture
  CURRENT: "Current",
  STALE: "Stale",
  // Claim
  ASSERTED: "Asserted",
  ANTICIPATED: "Anticipated",
  WITHDRAWN: "Withdrawn",
  DISMISSED: "Dismissed",
  // Theory
  ADOPTED: "Adopted",
  EXPLORING: "Exploring",
  BACKUP: "Backup",
  // Issue / Task
  OPEN: "Open",
  RESERVED: "Reserved",
  RESOLVED: "Resolved",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
  // Argument
  DRAFT: "Draft",
  NEEDS_SUPPORT: "Needs support",
  TRIAL_READY: "Trial ready",
  // Fact / Timeline
  UNDISPUTED: "Undisputed",
  DISPUTED: "Disputed",
  NEEDS_SOURCE_REVIEW: "Needs source review",
  CONTEXT: "Context",
  CONFIRMED: "Confirmed",
  APPROXIMATE: "Approximate",
  DATE_CONFLICT: "Date conflict",
  // Testimony
  PREPARED: "Prepared",
  GIVEN: "Given",
  IMPEACHMENT: "Impeachment",
  // Precedent
  NEEDS_CITE_CHECK: "Needs cite check",
  GOOD_LAW: "Good law",
  DISTINGUISHED: "Distinguished",
  QUESTIONED: "Questioned",
  OVERRULED: "Overruled",
  // Note
  GENERAL: "General",
  PINNED: "Pinned",
  OPEN_QUESTION: "Open question",
};

// Substatuses that signal the record needs attention before trial use.
export const ATTENTION_SUBSTATUSES: RecordSubstatus[] = [
  "AT_RISK",
  "STALE",
  "NEEDS_SUPPORT",
  "NEEDS_SOURCE_REVIEW",
  "NEEDS_CITE_CHECK",
  "DATE_CONFLICT",
  "BLOCKED",
  "OPEN_QUESTION",
  "DISPUTED",
];

// ─────────────────────────────────────────────────────────────────────────────
// Support status
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  SUPPORTED: "Supported",
  PARTIALLY_SUPPORTED: "Partially supported",
  UNSUPPORTED: "Unsupported",
  SUPPORT_NOT_REQUIRED: "Support not required",
  SUPPORT_UNKNOWN: "Support unknown",
};

// ─────────────────────────────────────────────────────────────────────────────
// Party
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_PARTY_CLASSES: Record<RecordParty, string> = {
  ours: "border-sky-200 bg-sky-100 text-sky-800",
  opposing: "border-rose-200 bg-rose-100 text-rose-800",
  neutral: "border-black/15 bg-white/85 text-black/65",
};

const OUR_SIDE_LABELS: Partial<Record<ClientRole, string>> = {
  plaintiff: "Plaintiff",
  defendant: "Defense",
  petitioner: "Petitioner",
  respondent: "Respondent",
  appellant: "Appellant",
  appellee: "Appellee",
};

const OPPOSING_SIDE_LABELS: Partial<Record<ClientRole, string>> = {
  plaintiff: "Defense",
  defendant: "Plaintiffs",
  petitioner: "Respondent",
  respondent: "Petitioner",
  appellant: "Appellee",
  appellee: "Appellant",
};

// Resolves an abstract record party to a case-specific display label
// using the client's role from CaseContext.
export function recordPartyLabel(
  party: RecordParty,
  clientRole?: ClientRole,
): string {
  if (party === "neutral") return "Neutral";
  if (!clientRole) return party === "ours" ? "Our side" : "Opposing side";
  return party === "ours"
    ? (OUR_SIDE_LABELS[clientRole] ?? "Our side")
    : (OPPOSING_SIDE_LABELS[clientRole] ?? "Opposing side");
}

// ─────────────────────────────────────────────────────────────────────────────
// Record types
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  CASE_SUMMARY: "Case summary",
  PERSON: "Person",
  OBJECTIVE: "Objective",
  POSTURE: "Posture",
  CLAIM: "Claim",
  THEORY: "Theory",
  ISSUE: "Issue",
  ARGUMENT: "Argument",
  TASK: "Task",
  FACT: "Fact",
  TIMELINE_EVENT: "Timeline event",
  TESTIMONY: "Testimony",
  LEGAL_PRECEDENT: "Precedent",
  NOTE: "Note",
  DOCUMENT: "Document record",
};

// ─────────────────────────────────────────────────────────────────────────────
// Graph links
// ─────────────────────────────────────────────────────────────────────────────

// Outbound phrasing: "<record> depends on <target>"
export const LINK_TYPE_LABELS: Record<RecordLinkType, string> = {
  DEPENDS_ON: "Depends on",
  EVIDENCED_BY: "Evidenced by",
  CONTRADICTED_BY: "Contradicted by",
  EXPLAINED_BY: "Explained by",
  CONTEXTUALIZED_BY: "Context from",
  CITES: "Cites",
  DERIVED_FROM: "Derived from",
  INVOLVES: "Involves",
  DUPLICATES: "Possible duplicate of",
  RELATED_TO: "Related to",
};

// Inbound phrasing: "<source> depends on <record>" → shown on the record as:
export const LINK_TYPE_INBOUND_LABELS: Record<RecordLinkType, string> = {
  DEPENDS_ON: "Supports",
  EVIDENCED_BY: "Evidence for",
  CONTRADICTED_BY: "Contradicts",
  EXPLAINED_BY: "Explains",
  CONTEXTUALIZED_BY: "Context for",
  CITES: "Cited by",
  DERIVED_FROM: "Source of",
  INVOLVES: "Involved in",
  DUPLICATES: "Possibly duplicated by",
  RELATED_TO: "Related to",
};

// ─────────────────────────────────────────────────────────────────────────────
// Workspace views
// ─────────────────────────────────────────────────────────────────────────────

export const VIEW_LABELS: Record<WorkspaceViewType, string> = {
  agent: "Case Agent",
  overview: "Overview",
  review: "Review Queue",
  objectives: "Objectives",
  claims: "Claims",
  posture: "Posture",
  theories: "Theories",
  issues: "Issues",
  arguments: "Arguments",
  tasks: "Tasks",
  facts: "Facts",
  timeline: "Timeline",
  testimony: "Testimony",
  precedent: "Precedent",
  notes: "Notes",
  documents: "Documents",
  people: "People",
};

export const VIEW_DESCRIPTIONS: Partial<Record<WorkspaceViewType, string>> = {
  review:
    "Agent-proposed records and supersessions awaiting your approval. Nothing becomes authoritative until you accept it.",
  objectives:
    "What you are trying to accomplish — desired outcomes, priorities, and risk-aware goals.",
  claims:
    "Claims, counterclaims, and allegations asserted by either side of the case.",
  posture:
    "Where the case stands procedurally and what that means for the next phase of work.",
  theories:
    "Integrated theories of the case that frame how claims, facts, and arguments fit together.",
  issues:
    "The legal, factual, procedural, and strategic questions the case must answer.",
  arguments:
    "Arguments in support of claims and theories, each grounded in facts and sources.",
  tasks:
    "Accountable work items, blockers, and preparation steps derived from case strategy.",
  facts:
    "Discrete factual assertions with dispute posture, source support, and proof gaps.",
  timeline:
    "Chronological case events with date confidence and links to facts and filings.",
  testimony:
    "Witness modules — anticipated testimony, preparation guardrails, and cross-examination themes.",
  precedent:
    "Authorities with cite-check status, jurisdiction, and links to the issues they govern.",
  notes: "Working thoughts, questions, corrections, and strategy observations.",
  documents:
    "Source files and the document records extracted from them. Other records ground themselves here.",
  people:
    "Parties, witnesses, attorneys, and other people referenced across the case.",
};

export const SINGULAR_VIEW_LABELS: Partial<Record<WorkspaceViewType, string>> =
  {
    objectives: "objective",
    claims: "claim",
    posture: "posture update",
    theories: "theory",
    issues: "issue",
    arguments: "argument",
    tasks: "task",
    facts: "fact",
    timeline: "timeline event",
    testimony: "testimony module",
    precedent: "precedent",
    notes: "note",
    documents: "document record",
    people: "person",
  };
