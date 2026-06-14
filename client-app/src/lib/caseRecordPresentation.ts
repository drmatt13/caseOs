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
  PENDING_REPLACEMENT: "Pending Replacement",
  REPLACED: "Replaced",
};

// Badge styling (the small status pill).
export const RECORD_STATUS_CLASSES: Record<RecordStatus, string> = {
  ACCEPTED: "border-green-300 bg-green-100 text-green-800",
  PROPOSED: "border-blue-300 bg-blue-100 text-blue-800",
  REJECTED: "border-red-300 bg-red-100 text-red-800",
  PENDING_REPLACEMENT: "border-amber-300 bg-amber-100 text-amber-900",
  REPLACED: "border-black/15 bg-black/[0.06] text-black/55",
};

// Card surface tint keyed by status so a record's lifecycle reads at a glance:
//   proposed → light blue, pending replacement → yellow, replaced → gray,
//   accepted / rejected → the default translucent white surface.
export const RECORD_STATUS_CARD_CLASSES: Record<RecordStatus, string> = {
  ACCEPTED: "border-black/15 bg-white/70",
  PROPOSED: "border-blue-200 bg-blue-50",
  REJECTED: "border-red-100 bg-red-50/50",
  PENDING_REPLACEMENT: "border-amber-200 bg-amber-50",
  REPLACED: "border-black/10 bg-black/[0.04]",
};

// ─────────────────────────────────────────────────────────────────────────────
// Display status (presentation only)
// ─────────────────────────────────────────────────────────────────────────────

// A PROPOSED record that would replace an existing one reads as its own
// "Proposed Replacement" state — one identity, no compound "replaces" tag on
// a blue proposal. This is purely cosmetic: the underlying lifecycle is still
// PROPOSED, so counts, filters, and the review/accept path never see it.
//
// Accepted is the authoritative default and wears NO badge — its absence is the
// signal (handled in StatusBadge / RecordChip), which frees green to mark an
// *elevated* proposal. The Proposed Replacement identity is split across two
// channels: a green badge (the elevated-proposal signal) over a purple record
// surface (its own card tint), so it never reads as a plain blue proposal.
//   • Proposed             → blue badge   / blue surface
//   • Proposed Replacement → green badge  / purple surface
//   • Pending Replacement → amber badge  / amber surface
export type RecordDisplayStatus = RecordStatus | "PROPOSED_REPLACEMENT";

export const RECORD_DISPLAY_STATUS_LABELS: Record<RecordDisplayStatus, string> =
  {
    ...RECORD_STATUS_LABELS,
    PROPOSED_REPLACEMENT: "Proposed Replacement",
  };

// Badge palette. ACCEPTED keeps a class for type completeness but renders no
// badge, so green is unambiguous as the "elevated proposal" color.
export const RECORD_DISPLAY_STATUS_CLASSES: Record<
  RecordDisplayStatus,
  string
> = {
  ...RECORD_STATUS_CLASSES,
  PROPOSED_REPLACEMENT: "border-amber-300 bg-amber-100 text-amber-900",
};

// Card surface tint. Proposed Replacement gets a purple surface beneath its
// green badge — the two channels together make it unmistakable.
export const RECORD_DISPLAY_STATUS_CARD_CLASSES: Record<
  RecordDisplayStatus,
  string
> = {
  ...RECORD_STATUS_CARD_CLASSES,
  PROPOSED_REPLACEMENT: "border-violet-200 bg-indigo-50",
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

// Links are stored in a single canonical direction (fromRecord → type →
// toRecord). Each type has a forward label (shown on the source record) and an
// inverse label (shown on the target record). The inverse is never stored as
// its own link type — it is derived here. This is the single source of truth
// for relationship phrasing.
export const LINK_TYPE_LABEL_PAIRS: Record<
  RecordLinkType,
  { forward: string; inverse: string }
> = {
  DEPENDS_ON: { forward: "Depends on", inverse: "Dependency of" },
  SUPPORTS: { forward: "Supports", inverse: "Supported by" },
  EVIDENCES: { forward: "Evidences", inverse: "Evidenced by" },
  CONTRADICTS: { forward: "Contradicts", inverse: "Contradicted by" },
  ATTACKS: { forward: "Attacks", inverse: "Attacked by" },
  EXPLAINS: { forward: "Explains", inverse: "Explained by" },
  CONTEXTUALIZES: { forward: "Contextualizes", inverse: "Contextualized by" },
  CITES: { forward: "Cites", inverse: "Cited by" },
  DERIVED_FROM: { forward: "Derived from", inverse: "Source for" },
  REQUIRES: { forward: "Requires", inverse: "Required by" },
  LEADS_TO: { forward: "Leads to", inverse: "Led by" },
  INVOLVES: { forward: "Involves", inverse: "Involved in" },
  DUPLICATES: { forward: "Duplicates", inverse: "Duplicated by" },
  RELATED_TO: { forward: "Related to", inverse: "Related to" },
};

// Returns the label for a link as seen from one endpoint:
//   "outbound" → viewing the source record (forward phrasing)
//   "inbound"  → viewing the target record (inverse phrasing)
export function linkTypeLabel(
  type: RecordLinkType,
  direction: "outbound" | "inbound",
): string {
  const pair = LINK_TYPE_LABEL_PAIRS[type];
  return direction === "outbound" ? pair.forward : pair.inverse;
}

// Outbound phrasing: shown on the source record ("<record> evidences <target>").
export const LINK_TYPE_LABELS: Record<RecordLinkType, string> =
  Object.fromEntries(
    (Object.keys(LINK_TYPE_LABEL_PAIRS) as RecordLinkType[]).map((type) => [
      type,
      LINK_TYPE_LABEL_PAIRS[type].forward,
    ]),
  ) as Record<RecordLinkType, string>;

// Inbound phrasing: shown on the target record ("<source> evidences <record>").
export const LINK_TYPE_INBOUND_LABELS: Record<RecordLinkType, string> =
  Object.fromEntries(
    (Object.keys(LINK_TYPE_LABEL_PAIRS) as RecordLinkType[]).map((type) => [
      type,
      LINK_TYPE_LABEL_PAIRS[type].inverse,
    ]),
  ) as Record<RecordLinkType, string>;

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
    "Agent-proposed records and replacement proposals awaiting your approval. Nothing becomes authoritative until you accept it.",
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
