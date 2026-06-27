import type {
  CaseStatus,
  ClientRole,
  CourtSystem,
  DocumentCategory,
  DocumentProcessingStatus,
  IntakePerspective,
  PersonRole,
  RepresentationPracticeArea,
  RepresentationRole,
} from "./caseDomain";
import type { DatePrecision, RecordParty } from "./caseRecords";
import type { UsStateCode } from "#/lib/usJurisdictions";

// Re-export so intake-adjacent code can import from one place
export type {
  CaseStatus,
  ClientRole,
  CourtSystem,
  DocumentCategory,
  DocumentProcessingStatus,
  IntakePerspective,
  PersonRole,
  RepresentationPracticeArea,
  RepresentationRole,
  DatePrecision,
  RecordParty,
  UsStateCode,
};

export interface CaseIntakeDocument {
  documentId?: string;
  fileName: string;
  category: DocumentCategory;
  userDescription?: string;
  // The single most valuable document field: it tells the agent WHY the file is
  // in the case, which is what lets it author an EVIDENCES link instead of
  // guessing what the document grounds.
  whyThisMatters?: string;
  llmSummary?: string;
  status?: DocumentProcessingStatus;
  createdBy?: "human" | "agent";
  uploadedAt?: string; // ISO 8601
  uploadedByUserId?: string;
}

// A person / entity in the matter.
//
// This is the single highest-value structured input in the whole intake:
// capturing `side` here means the agent never has to INFER which party a person
// belongs to. Party attribution is the costliest thing to get wrong, because
// `party` (ours/opposing/neutral) is a first-class axis on every downstream
// record and drives the entire label + tone system — a person mis-attributed at
// intake poisons every record that involves them.
//
// Reuses the graph's own `PersonRole` and `RecordParty` so intake and the
// knowledge graph share one contract. Seeds a PERSON record (+ a TESTIMONY
// record when `anticipatedTestimony` is present).
export interface CaseIntakePerson {
  id: string;
  name: string;
  roles: PersonRole[];
  side: RecordParty; // "ours" | "opposing" | "neutral"
  organization?: string;
  // Replaces the old free-text `whoMattersMostRightNow` field: flag the handful
  // of people who deserve the team's attention right now.
  isKeyPlayer?: boolean;
  notes?: string; // what they know / why they matter
  anticipatedTestimony?: string; // seeds a TESTIMONY record when present
}

// Kinds run roughly chronologically through a matter — underlying events, then
// litigation milestones, then the discovery/evidence layer the user most often
// needs to pin. The agent maps `kind` onto a TIMELINE_EVENT's free-text
// `category`; it is signal, not a stored record field.
export type CaseIntakeEventKind =
  | "incident"
  | "communication"
  | "notice"
  | "filing"
  | "hearing"
  | "ruling"
  | "discovery_request"
  | "document_production"
  | "deposition"
  | "disclosure"
  | "evidence"
  | "deadline"
  | "settlement"
  | "other";

// An OPTIONAL precision anchor on the timeline. The prose `narrativeOfEvents` is
// the workhorse the agent mines for TIMELINE_EVENT / FACT records; these anchors
// just let the human pin the handful of dates that have to be exact. Reuses the
// graph's `DatePrecision` so a fuzzy "month"-only date or a dated window
// round-trips cleanly into a TIMELINE_EVENT.
export interface CaseIntakeEvent {
  id: string;
  label: string;
  date?: string; // ISO 8601; optional — fuzzy / undated events are allowed
  datePrecision?: DatePrecision; // defaults to "day"
  endDate?: string; // ISO 8601; present ⇒ the event spans a window
  kind?: CaseIntakeEventKind;
  notes?: string;
}

// An OPTIONAL structured task / deadline. Tasks are the action layer of intake —
// "what needs doing, by when" — kept separate from the timeline (what already
// happened). `title` is the anchor; an empty row is dropped. `isTimeSensitive`
// is the urgency flag (it used to live on timeline events, where it conflated
// chronology with priority). Seeds a TASK record (high priority when flagged).
export interface CaseIntakeTask {
  id: string;
  title: string; // anchor
  detail?: string; // what / why
  dueDate?: string; // ISO 8601
  datePrecision?: DatePrecision; // defaults to "day"
  isTimeSensitive?: boolean;
}

// An OPTIONAL structured claim / defense. Prose `claimsAndDefenses` is primary;
// these anchors map 1:1 to CLAIM records, carrying the same `kind` as
// `ClaimRecord.claimType` and the `side` that decides whether it renders as ours
// (a counterclaim / defense) or the opposing party's affirmative claim.
export interface CaseIntakeClaim {
  id: string;
  label: string;
  side: RecordParty;
  // Mirrors ClaimRecord.claimType.
  kind?: "affirmative" | "counterclaim" | "cross" | "third_party" | "defense";
  description?: string;
}

// Raw intake form captured at case creation.
// Processed by the agent into an initial batch of PROPOSED records and a
// CaseContext, then kept as a permanent, immutable audit record.
//
// Three input modes, by design — the human chooses their depth:
//   1. Required structured spine   → becomes CaseContext verbatim; never guessed.
//   2. Narrative prose             → the low-friction workhorse the agent mines.
//   3. Optional structured anchors → high-precision pins (people, events, claims).
//
// Optionality is meaningful, not throwaway: a blank optional field is the
// agent's first task. Leave `biggestRisk` empty and the agent proposes one for
// review; leave `people` empty and it extracts them from the narrative.
//
// workspaceId/caseId are optional because the form is drafted before the case
// row exists; they are stamped on submission.
export interface CaseIntake {
  id: string;
  workspaceId?: string;
  caseId?: string;

  // ── Case basics (required → CaseContext) ─────────────────────────────────
  // Who is filling out intake — drives the attorney vs. plain-language pro-se
  // lens over the wizard, and signals the agent to scaffold/explain more for a
  // self-represented litigant. Presentation only; the contract below is shared.
  intakePerspective: IntakePerspective;
  caseName: string;
  intakeProvidedBy: string;
  representationPracticeArea: RepresentationPracticeArea;
  representationRole: RepresentationRole;
  clientRole: ClientRole;
  // Required: resolves "ours" → a concrete label ("Defense" / "Plaintiffs") for
  // the whole workspace. (Was defined-but-never-collected previously.)
  representedPartyName: string;
  jurisdictionOrCourt: string;
  // Structured complement to the free-text court name above. Optional like the
  // court name itself (not part of the step-1 gate): when present they give later
  // features (e.g. corpus selection) a stable signal without parsing the prose.
  // `jurisdictionState` is only meaningful when `courtSystem` is "state".
  courtSystem?: CourtSystem;
  jurisdictionState?: UsStateCode;

  // ── Dispute (required narrative + procedural spine) ──────────────────────
  whatIsTheDisputeAbout: string;
  claimsAndDefenses: string;
  claims?: CaseIntakeClaim[]; // optional structured anchors
  caseNumber?: string; // optional; normalized into CaseContext.identifiers
  currentCaseStatus: CaseStatus;

  // ── Strategy (objective required; the rest is agent-fillable when blank) ──
  objective: string;
  desiredOutcome?: string;
  opposingObjective?: string;
  theoryOfTheCase?: string; // seeds THEORY — "your story of why you win"
  keyDisputedIssues?: string; // seeds ISSUE
  openQuestions?: string; // seeds QUESTION — what you most want answered
  biggestRisk?: string;

  // ── People (structured-primary; prose fallback) ──────────────────────────
  people: CaseIntakePerson[];
  peopleNarrative?: string;

  // ── Timeline (prose-primary + optional anchors) ──────────────────────────
  narrativeOfEvents?: string;
  keyEvents?: CaseIntakeEvent[];

  // ── Tasks & deadlines (structured anchors + prose fallback) ──────────────
  tasks?: CaseIntakeTask[];
  urgentDeadlines?: string; // prose fallback the agent mines for more tasks/deadlines

  // ── Optional enrichment ──────────────────────────────────────────────────
  knownAuthorities?: string; // seeds LEGAL_PRECEDENT
  focusFirst?: string; // seeds the initial TASK priority for the agent
  additionalContext?: string; // catch-all → NOTE

  // ── Documents uploaded during intake ─────────────────────────────────────
  // These become CaseDocument rows + DOCUMENT records after processing.
  documents: {
    [documentId: string]: CaseIntakeDocument;
  };

  createdAt?: string;
  updatedAt?: string;
}
