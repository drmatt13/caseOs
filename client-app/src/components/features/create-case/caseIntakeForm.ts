import type {
  CaseIntake,
  CaseIntakeClaim,
  CaseIntakeEvent,
  CaseIntakeEventKind,
  CaseIntakePerson,
  CaseIntakeTask,
  CaseStatus,
  ClientRole,
  CourtSystem,
  DatePrecision,
  IntakePerspective,
  PersonRole,
  RecordParty,
  RepresentationPracticeArea,
  RepresentationRole,
  UsStateCode,
} from "#/types/caseWorkspace";
import type { RecordType } from "#/types/caseRecords";
import { DATE_PRECISION_SELECT_OPTIONS } from "#/lib/datePrecision";
import { US_STATES } from "#/lib/usJurisdictions";

export type CaseIntakeWizardState = {
  step: number;
  caseId?: string;
  caseIntake: CaseIntake;
};

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export const CASE_INTAKE_TOTAL_STEPS = 8;

// Title-cases an enum value. Lower-cases first so it handles both lower_snake
// (civil_litigation) and UPPER_SNAKE (EXPERT_WITNESS) enums uniformly.
const formatOptionLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildOptions = <T extends string>(
  values: readonly T[],
): SelectOption<T>[] =>
  values.map((value) => ({
    value,
    label: formatOptionLabel(value),
  }));

// Stable-enough id for repeater rows (people / events / claims). Avoids relying
// on crypto.randomUUID so it works the same in the browser and in tests.
export const createIntakeItemId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const representationPracticeAreaOptions = buildOptions([
  "civil_litigation",
  "criminal",
  "family",
  "corporate",
  "personal_injury",
  "employment",
  "landlord_tenant",
  "probate_and_estate",
  "real_estate",
  "immigration",
  "bankruptcy",
  "juvenile",
  "appeals",
  "administrative",
  "intellectual_property",
  "tax",
  "other",
] as const satisfies readonly RepresentationPracticeArea[]);

export const clientRoleOptions = buildOptions([
  "plaintiff",
  "defendant",
  "petitioner",
  "respondent",
  "appellant",
  "appellee",
  "claimant",
  "counterclaimant",
  "counterdefendant",
  "third_party_plaintiff",
  "third_party_defendant",
  "interested_party",
  "other",
] as const satisfies readonly ClientRole[]);

// Attorney-only: "pro_se" is intentionally absent — a self-represented litigant
// is captured by the intake perspective toggle, not by this counsel-role dropdown.
export const representationRoleOptions = buildOptions([
  "lead_counsel",
  "co_counsel",
  "local_counsel",
  "outside_counsel",
  "in_house_counsel",
  "appellate_counsel",
  "defense_counsel",
  "prosecutor",
  "guardian_ad_litem",
  "other",
] as const satisfies readonly RepresentationRole[]);

export const caseStatusOptions = buildOptions([
  "pre_filing",
  "filed",
  "discovery",
  "motion_stage",
  "settlement_negotiations",
  "trial_preparation",
  "trial",
  "post_trial",
  "appeal",
] as const satisfies readonly CaseStatus[]);

// Court-system + state anchors ────────────────────────────────────────────────

// Structured complement to the free-text court name. "other" covers the tribal,
// administrative, arbitral, and foreign forums the prose field still spells out.
export const courtSystemOptions: SelectOption<CourtSystem>[] = [
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "other", label: "Other" },
];

// Same enum values, plain-language labels for a self-represented litigant.
const courtSystemProSeOptions: SelectOption<CourtSystem>[] = [
  { value: "federal", label: "Federal court" },
  { value: "state", label: "State court" },
  { value: "other", label: "Not sure / another court" },
];

export const getCourtSystemOptions = (
  perspective: IntakePerspective,
): SelectOption<CourtSystem>[] =>
  perspective === "self" ? courtSystemProSeOptions : courtSystemOptions;

// US states / DC shown when courtSystem is "state". Built from the shared lib
// list so corpus-selection features reuse one source of truth.
export const usStateOptions: SelectOption<UsStateCode>[] = US_STATES.map(
  ({ value, label }) => ({ value, label }),
);

// People-repeater option sets ────────────────────────────────────────────────

// Which side of the matter a person is on. The single highest-value field in the
// people repeater — captured, never inferred.
export const recordPartyOptions: SelectOption<RecordParty>[] = [
  { value: "ours", label: "Our side" },
  { value: "opposing", label: "Opposing" },
  { value: "neutral", label: "Neutral" },
];

// Ordered parties → witnesses → counsel/court → other, so the common picks sit
// near the top of the dropdown.
export const personRoleOptions = buildOptions([
  "PLAINTIFF",
  "DEFENDANT",
  "PETITIONER",
  "RESPONDENT",
  "CLIENT",
  "WITNESS",
  "FACT_WITNESS",
  "EXPERT_WITNESS",
  "ATTORNEY",
  "PARALEGAL",
  "JUDGE",
  "MAGISTRATE",
  "MEDIATOR",
  "ARBITRATOR",
  "LANDLORD",
  "TENANT",
  "PROPERTY_MANAGER",
  "EMPLOYER",
  "EMPLOYEE",
  "CONTRACTOR",
  "PHYSICIAN",
  "THERAPIST",
  "CASE_WORKER",
  "POLICE_OFFICER",
  "INVESTIGATOR",
  "GOVERNMENT_OFFICIAL",
  "AGENCY_REPRESENTATIVE",
  "CORPORATE_REPRESENTATIVE",
  "THIRD_PARTY",
  "UNKNOWN",
] as const satisfies readonly PersonRole[]);

// Timeline-anchor option sets ─────────────────────────────────────────────────

export const eventKindOptions = buildOptions([
  "incident",
  "communication",
  "notice",
  "filing",
  "hearing",
  "ruling",
  "discovery_request",
  "document_production",
  "deposition",
  "disclosure",
  "evidence",
  "deadline",
  "settlement",
  "other",
] as const satisfies readonly CaseIntakeEventKind[]);

// Precision options for the timeline key-date anchors. Re-exported from the
// single source of truth (#/lib/datePrecision) so intake, the workspace record
// editor, and the date display all offer the same ordered set — coarse
// "year"/"month" pins through exact "hour"/"minute"/"second" timestamps.
export const datePrecisionOptions: SelectOption<DatePrecision>[] =
  DATE_PRECISION_SELECT_OPTIONS;

// Claim-anchor option set ─────────────────────────────────────────────────────

export const claimKindOptions: SelectOption<
  NonNullable<CaseIntakeClaim["kind"]>
>[] = [
  { value: "affirmative", label: "Affirmative claim" },
  { value: "counterclaim", label: "Counterclaim" },
  { value: "cross", label: "Cross-claim" },
  { value: "third_party", label: "Third-party claim" },
  { value: "defense", label: "Defense" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Perspective-aware option resolvers (attorney vs. pro se).
//
// The data contract is identical — same enum *values* — but a self-represented
// litigant gets plain-language *labels* and a trimmed set (advanced cross /
// third-party claims are hidden). Forms pick a variant from
// `caseIntake.intakePerspective`; nothing downstream changes.
// ─────────────────────────────────────────────────────────────────────────────

const caseStatusProSeOptions: SelectOption<CaseStatus>[] = [
  { value: "pre_filing", label: "Haven't filed yet" },
  { value: "filed", label: "Filed and served" },
  { value: "discovery", label: "Exchanging evidence" },
  { value: "motion_stage", label: "Waiting on a motion or hearing" },
  { value: "settlement_negotiations", label: "Trying to settle" },
  { value: "trial_preparation", label: "Getting ready for trial" },
  { value: "trial", label: "In trial" },
  { value: "post_trial", label: "After trial" },
  { value: "appeal", label: "On appeal" },
];

export const getCaseStatusOptions = (
  perspective: IntakePerspective,
): SelectOption<CaseStatus>[] =>
  perspective === "self" ? caseStatusProSeOptions : caseStatusOptions;

const claimKindProSeOptions: SelectOption<
  NonNullable<CaseIntakeClaim["kind"]>
>[] = [
  { value: "affirmative", label: "Something I'm claiming" },
  { value: "counterclaim", label: "A claim against me" },
  { value: "defense", label: "A defense I'm raising" },
];

export const getClaimKindOptions = (
  perspective: IntakePerspective,
): SelectOption<NonNullable<CaseIntakeClaim["kind"]>>[] =>
  perspective === "self" ? claimKindProSeOptions : claimKindOptions;

// Pro-se plain-language stance → ClientRole. Lets a self-represented litigant
// answer "did you start this case, or are you responding to it?" without the
// plaintiff/defendant vocabulary, while still writing a correct ClientRole enum.
export type ProSeStance = "started" | "responding" | "unsure";

export const proSeStanceOptions: SelectOption<ProSeStance>[] = [
  { value: "started", label: "I started this case" },
  { value: "responding", label: "I'm responding to it" },
  { value: "unsure", label: "I'm not sure yet" },
];

export const proSeStanceToClientRole: Record<ProSeStance, ClientRole> = {
  started: "plaintiff",
  responding: "defendant",
  unsure: "other",
};

export const clientRoleToProSeStance = (role: ClientRole): ProSeStance =>
  role === "plaintiff"
    ? "started"
    : role === "defendant"
      ? "responding"
      : "unsure";

// ─────────────────────────────────────────────────────────────────────────────
// Field → record-type seed map.
//
// The connective tissue between the form and the knowledge graph: each intake
// field declares which RecordType(s) it is expected to seed. The extraction
// agent consumes this to know what to generate from each field, and it makes
// coverage gaps visible (every RecordType the workspace renders should be seeded
// by something here, or be explicitly the agent's job to derive).
// ─────────────────────────────────────────────────────────────────────────────
export const INTAKE_FIELD_SEEDS: Partial<Record<keyof CaseIntake, RecordType[]>> =
  {
    whatIsTheDisputeAbout: ["CASE_SUMMARY", "FACT", "THEORY"],
    claimsAndDefenses: ["CLAIM"],
    claims: ["CLAIM"],
    objective: ["OBJECTIVE"],
    desiredOutcome: ["OBJECTIVE"],
    opposingObjective: ["OBJECTIVE", "THEORY"],
    theoryOfTheCase: ["THEORY"],
    keyDisputedIssues: ["ISSUE"],
    openQuestions: ["QUESTION"],
    biggestRisk: ["ISSUE", "QUESTION"],
    currentCaseStatus: ["POSTURE"],
    people: ["PERSON", "TESTIMONY"],
    peopleNarrative: ["PERSON"],
    narrativeOfEvents: ["TIMELINE_EVENT", "FACT"],
    keyEvents: ["TIMELINE_EVENT"],
    tasks: ["TASK"],
    urgentDeadlines: ["TASK", "TIMELINE_EVENT"],
    knownAuthorities: ["LEGAL_PRECEDENT"],
    focusFirst: ["TASK"],
    additionalContext: ["NOTE"],
    documents: ["DOCUMENT"],
  };

// ─────────────────────────────────────────────────────────────────────────────
// Anchor / dirty / invalid predicates + pruning.
//
// The structured repeaters (claims / key dates / people / tasks) are *optional
// anchors* layered on top of the prose narratives — a user can "Add" a row and
// leave it blank. Three states per row:
//   • empty   — no content at all → silently dropped on advance (no nag).
//   • valid   — its identifying anchor is present → seeds a record.
//   • invalid — has *some* content but is missing its anchor (a partial the user
//               clearly meant to keep) → flagged red on blur and blocks Next
//               until finished or removed.
// "dirty" = the row has any meaningful content (ignoring defaulted selects).
// invalid = dirty && !hasAnchor.
// ─────────────────────────────────────────────────────────────────────────────

const isFilled = (value?: string) => Boolean(value && value.trim().length > 0);

export const claimHasAnchor = (claim: CaseIntakeClaim) =>
  isFilled(claim.label);

// A pinned "exact date" earns its place only when it says BOTH what happened and
// when. A label with no date defeats the purpose of this section (undated events
// belong in the prose narrative the agent mines), and a bare date with no
// description can't seed a meaningful TIMELINE_EVENT.
export const eventHasAnchor = (event: CaseIntakeEvent) =>
  isFilled(event.label) && Boolean(event.date);

export const personHasAnchor = (person: CaseIntakePerson) =>
  isFilled(person.name);

export const taskHasAnchor = (task: CaseIntakeTask) => isFilled(task.title);

export const claimRowIsDirty = (claim: CaseIntakeClaim) =>
  isFilled(claim.label) || isFilled(claim.description);

export const eventRowIsDirty = (event: CaseIntakeEvent) =>
  isFilled(event.label) ||
  Boolean(event.date) ||
  Boolean(event.endDate) ||
  isFilled(event.notes);

export const personRowIsDirty = (person: CaseIntakePerson) =>
  isFilled(person.name) ||
  isFilled(person.organization) ||
  isFilled(person.notes) ||
  isFilled(person.anticipatedTestimony) ||
  (person.roles[0] ?? "UNKNOWN") !== "UNKNOWN" ||
  person.side !== "neutral" ||
  Boolean(person.isKeyPlayer);

export const taskRowIsDirty = (task: CaseIntakeTask) =>
  isFilled(task.title) ||
  isFilled(task.detail) ||
  Boolean(task.dueDate) ||
  Boolean(task.isTimeSensitive);

// A row is invalid when the user has started it but left out the one field that
// identifies it. These drive the red blur-flag and the Next-button gate.
export const claimRowIsInvalid = (claim: CaseIntakeClaim) =>
  claimRowIsDirty(claim) && !claimHasAnchor(claim);

export const eventRowIsInvalid = (event: CaseIntakeEvent) =>
  eventRowIsDirty(event) && !eventHasAnchor(event);

export const personRowIsInvalid = (person: CaseIntakePerson) =>
  personRowIsDirty(person) && !personHasAnchor(person);

export const taskRowIsInvalid = (task: CaseIntakeTask) =>
  taskRowIsDirty(task) && !taskHasAnchor(task);

// Does the given wizard step contain any partial-but-anchorless row? Used by the
// route to gate the Next button. Step numbers match the renderStep() switch.
export const stepHasInvalidRows = (step: number, intake: CaseIntake): boolean => {
  switch (step) {
    case 2:
      return (intake.claims ?? []).some(claimRowIsInvalid);
    case 3:
      return (intake.keyEvents ?? []).some(eventRowIsInvalid);
    case 4:
      return (intake.tasks ?? []).some(taskRowIsInvalid);
    case 6:
      return intake.people.some(personRowIsInvalid);
    default:
      return false;
  }
};

// Returns a copy of the intake with anchorless repeater rows removed. Run on
// step advance and again before generation so the agent only ever sees rows
// the user actually filled in.
export const pruneCaseIntake = (intake: CaseIntake): CaseIntake => ({
  ...intake,
  claims: (intake.claims ?? []).filter(claimHasAnchor),
  keyEvents: (intake.keyEvents ?? []).filter(eventHasAnchor),
  people: intake.people.filter(personHasAnchor),
  tasks: (intake.tasks ?? []).filter(taskHasAnchor),
});

export const initialCaseIntake: CaseIntake = {
  id: "",
  intakePerspective: "attorney",
  caseName: "",
  intakeProvidedBy: "",
  representationPracticeArea: "civil_litigation",
  representationRole: "lead_counsel",
  clientRole: "plaintiff",
  representedPartyName: "",
  jurisdictionOrCourt: "",
  whatIsTheDisputeAbout: "",
  claimsAndDefenses: "",
  claims: [],
  caseNumber: "",
  currentCaseStatus: "pre_filing",
  objective: "",
  desiredOutcome: "",
  opposingObjective: "",
  theoryOfTheCase: "",
  keyDisputedIssues: "",
  openQuestions: "",
  biggestRisk: "",
  people: [],
  peopleNarrative: "",
  narrativeOfEvents: "",
  keyEvents: [],
  tasks: [],
  urgentDeadlines: "",
  knownAuthorities: "",
  focusFirst: "",
  additionalContext: "",
  documents: {},
};
