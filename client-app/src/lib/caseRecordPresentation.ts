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
import { BLANK_SURFACE, PARTY_TONES, TONES } from "#/lib/tones";

// ─────────────────────────────────────────────────────────────────────────────
// Record lifecycle status
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  PROPOSED: "Proposed",
  ACCEPTED: "Accepted",
  PENDING_REPLACEMENT: "Pending Replacement",
  REPLACED: "Replaced",
};

// Badge styling (the small status pill). Each status maps to a semantic tone;
// see lib/tones.ts for the actual color recipe.
export const RECORD_STATUS_CLASSES: Record<RecordStatus, string> = {
  ACCEPTED: TONES.positive.badge,
  PROPOSED: TONES.info.badge,
  PENDING_REPLACEMENT: TONES.caution.badge,
  REPLACED: TONES.neutral.badge,
};

// Card surface tint keyed by status so a record's lifecycle reads at a glance:
//   proposed → info wash, pending replacement → caution wash, replaced → gray,
//   accepted → blank glass (no tint; being the source of truth is its own
//   signal). The frozen/"Rejected" wash lives on the display map below, since
//   frozen is a disposition derived on top of the lifecycle, not a status here.
export const RECORD_STATUS_CARD_CLASSES: Record<RecordStatus, string> = {
  ACCEPTED: BLANK_SURFACE,
  PROPOSED: TONES.info.surface,
  PENDING_REPLACEMENT: TONES.caution.surface,
  REPLACED: TONES.neutral.surface,
};

// Chip-shell wash keyed by DISPLAY status, with per-status hover deepening. A
// clickable RecordChip gets a lighter, interactive variant of the card surface
// above: accepted/replaced read as plain glass, the rest carry their tone wash
// plus a hover state. Keyed by display status so frozen records (and rejected
// edges) get the critical wash; PROPOSED_REPLACEMENT reuses the proposed wash.
export const RECORD_CHIP_STATUS_CLASSES: Record<
  RecordStatus | "REJECTED",
  string
> = {
  ACCEPTED: "border-black/15 bg-white/80 hover:border-black/25 hover:bg-white",
  PROPOSED: `${TONES.info.surface} hover:border-sky-700/30 hover:bg-sky-50/60`,
  REJECTED: `${TONES.critical.surface} hover:border-red-700/30 hover:bg-red-50/60`,
  PENDING_REPLACEMENT: `${TONES.caution.surface} hover:border-amber-600/35 hover:bg-amber-50/70`,
  REPLACED:
    // "border-black/12 bg-black/[0.04] hover:border-black/20 hover:bg-black/[0.06]",
    "border-black/15 bg-white/80 hover:border-black/25 hover:bg-white",
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
// signal (handled in StatusBadge / RecordChip). Proposed Replacement gets the
// `special` tone (violet) for BOTH its badge and its card surface, so the two
// channels share one hue and reinforce a single identity — distinct from a
// plain Proposed (info/blue) and from Pending Replacement (caution/amber).
//   • Proposed             → info badge    / info surface     (blue)
//   • Proposed Replacement → special badge / special surface  (violet)
//   • Pending Replacement  → caution badge / caution surface  (amber)
//   • Rejected (frozen)    → critical badge / critical surface (red)
//
// REJECTED is likewise display-only: it is the "frozen" disposition surfaced as a
// single render state (see recordDisplayStatus / recordIsFrozen). The lifecycle
// underneath is still ACCEPTED/PROPOSED — the frozen record just reads as red.
export type RecordDisplayStatus =
  | RecordStatus
  | "PROPOSED_REPLACEMENT"
  | "REJECTED";

export const RECORD_DISPLAY_STATUS_LABELS: Record<RecordDisplayStatus, string> =
  {
    ...RECORD_STATUS_LABELS,
    PROPOSED_REPLACEMENT: "Proposed Replacement",
    REJECTED: "Rejected",
  };

// Badge palette. ACCEPTED keeps a class for type completeness but renders no
// badge (see StatusBadge).
export const RECORD_DISPLAY_STATUS_CLASSES: Record<
  RecordDisplayStatus,
  string
> = {
  ...RECORD_STATUS_CLASSES,
  PROPOSED_REPLACEMENT: TONES.special.badge,
  REJECTED: TONES.critical.badge,
};

// Card surface tint. Proposed Replacement's surface shares the `special` hue
// with its badge, so badge and card read as one object.
export const RECORD_DISPLAY_STATUS_CARD_CLASSES: Record<
  RecordDisplayStatus,
  string
> = {
  ...RECORD_STATUS_CARD_CLASSES,
  PROPOSED_REPLACEMENT: TONES.special.surface,
  REJECTED: TONES.critical.surface,
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-type substatus — the record's domain lifecycle ("phase"). Lifecycle-only:
// evidentiary state is `supportStatus`; "needs attention" is derived.
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_SUBSTATUS_LABELS: Record<RecordSubstatus, string> = {
  // Objective
  ACTIVE: "Active",
  AT_RISK: "At risk",
  ACHIEVED: "Achieved",
  ABANDONED: "Abandoned",
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
  DONE: "Done",
  // Argument
  DRAFT: "Draft",
  TRIAL_READY: "Trial ready",
  // Testimony
  PREPARED: "Prepared",
  GIVEN: "Given",
  // Precedent treatment
  GOOD_LAW: "Good law",
  DISTINGUISHED: "Distinguished",
  QUESTIONED: "Questioned",
  OVERRULED: "Overruled",
  // Note
  OPEN_QUESTION: "Open question",
};

// Phase badge tone. Most phases are neutral; a few terminal "good" states read
// positive. Attention-worthy phases (AT_RISK, QUESTIONED, OVERRULED,
// OPEN_QUESTION) read caution — though in dense views those are surfaced by the
// derived attention pill (see recordAttention) rather than the phase pill.
const POSITIVE_PHASES: RecordSubstatus[] = [
  "ACHIEVED",
  "DONE",
  "TRIAL_READY",
  "ADOPTED",
  "GOOD_LAW",
  "RESOLVED",
  "GIVEN",
];
const CAUTION_PHASES: RecordSubstatus[] = [
  "AT_RISK",
  "QUESTIONED",
  "OVERRULED",
  "OPEN_QUESTION",
];

export const RECORD_SUBSTATUS_CLASSES: Record<RecordSubstatus, string> =
  Object.fromEntries(
    (Object.keys(RECORD_SUBSTATUS_LABELS) as RecordSubstatus[]).map((sub) => [
      sub,
      POSITIVE_PHASES.includes(sub)
        ? TONES.positive.badge
        : CAUTION_PHASES.includes(sub)
          ? TONES.caution.badge
          : TONES.neutral.badge,
    ]),
  ) as Record<RecordSubstatus, string>;

// ─────────────────────────────────────────────────────────────────────────────
// Support status (evidentiary grounding)
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  SUPPORTED: "Supported",
  PARTIALLY_SUPPORTED: "Partially supported",
  UNSUPPORTED: "Unsupported",
  CONFLICTED: "Conflicted",
  SUPPORT_NOT_REQUIRED: "Support not required",
  UNKNOWN: "Unverified",
};

export const SUPPORT_STATUS_CLASSES: Record<SupportStatus, string> = {
  SUPPORTED: TONES.positive.badge,
  PARTIALLY_SUPPORTED: TONES.info.badge,
  UNSUPPORTED: TONES.caution.badge,
  CONFLICTED: TONES.caution.badge,
  SUPPORT_NOT_REQUIRED: TONES.neutral.badge,
  UNKNOWN: TONES.caution.badge,
};

// ─────────────────────────────────────────────────────────────────────────────
// Party
// ─────────────────────────────────────────────────────────────────────────────

export const RECORD_PARTY_CLASSES: Record<RecordParty, string> = {
  ours: PARTY_TONES.ours.badge,
  opposing: PARTY_TONES.opposing.badge,
  neutral: PARTY_TONES.neutral.badge,
};

// Party as an ambient left-edge accent on cards (instead of a full word-pill).
// Neutral / no party gets no stripe — only "ours" vs "opposing" earn an accent.
export const RECORD_PARTY_ACCENT_CLASSES: Record<RecordParty, string> = {
  ours: "border-l-2 border-l-sky-600/50",
  opposing: "border-l-2 border-l-rose-600/50",
  neutral: "",
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
  defendant: "Plaintiff",
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

// Symmetric relationships read the same from either endpoint (A relates to B ⇔
// B relates to A). They carry no direction: the UI hides the direction toggle
// and renders a ↔ arrow. Today only RELATED_TO qualifies; add others here.
export const SYMMETRIC_LINK_TYPES: ReadonlySet<RecordLinkType> = new Set([
  "RELATED_TO",
]);

export function isSymmetricLink(type: RecordLinkType): boolean {
  return SYMMETRIC_LINK_TYPES.has(type);
}

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
    "Chronological case events with date precision and links to facts and filings.",
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
