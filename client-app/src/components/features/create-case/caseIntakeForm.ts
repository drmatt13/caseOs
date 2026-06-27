import type {
  CaseIntake,
  CaseIntakeClaim,
  CaseIntakeEvent,
  CaseIntakeEventKind,
  CaseIntakePerson,
  CaseStatus,
  ClientRole,
  DatePrecision,
  IntakePerspective,
  PersonRole,
  RecordParty,
  RepresentationPracticeArea,
  RepresentationRole,
} from "#/types/caseWorkspace";
import type { RecordType } from "#/types/caseRecords";
import { DATE_PRECISION_SELECT_OPTIONS } from "#/lib/datePrecision";

export type CaseIntakeWizardState = {
  step: number;
  caseId?: string;
  caseIntake: CaseIntake;
};

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

export const CASE_INTAKE_TOTAL_STEPS = 7;

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
  "filing",
  "deadline",
  "communication",
  "ruling",
  "discovery",
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
    biggestRisk: ["ISSUE", "QUESTION"],
    currentCaseStatus: ["POSTURE"],
    people: ["PERSON", "TESTIMONY"],
    peopleNarrative: ["PERSON"],
    narrativeOfEvents: ["TIMELINE_EVENT", "FACT"],
    keyEvents: ["TIMELINE_EVENT"],
    urgentDeadlines: ["TASK", "TIMELINE_EVENT"],
    knownAuthorities: ["LEGAL_PRECEDENT"],
    focusFirst: ["TASK"],
    additionalContext: ["NOTE"],
    documents: ["DOCUMENT"],
  };

// ─────────────────────────────────────────────────────────────────────────────
// Anchor predicates + pruning.
//
// The structured repeaters (claims / key dates / people) are *optional anchors*
// layered on top of the prose narratives — a user can "Add" a row and leave it
// blank. A row "counts" only once its identifying anchor is present; anchorless
// rows are pruned before the intake reaches the agent so it never seeds a record
// from an empty row. The forms negate these same predicates to show the
// "finish-or-it-won't-be-saved" hint.
// ─────────────────────────────────────────────────────────────────────────────

export const claimHasAnchor = (claim: CaseIntakeClaim) =>
  claim.label.trim().length > 0;

export const eventHasAnchor = (event: CaseIntakeEvent) =>
  event.label.trim().length > 0 || Boolean(event.date);

export const personHasAnchor = (person: CaseIntakePerson) =>
  person.name.trim().length > 0;

// Returns a copy of the intake with anchorless repeater rows removed. Run on
// step advance and again before generation so the agent only ever sees rows
// the user actually filled in.
export const pruneCaseIntake = (intake: CaseIntake): CaseIntake => ({
  ...intake,
  claims: (intake.claims ?? []).filter(claimHasAnchor),
  keyEvents: (intake.keyEvents ?? []).filter(eventHasAnchor),
  people: intake.people.filter(personHasAnchor),
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
  biggestRisk: "",
  people: [],
  peopleNarrative: "",
  narrativeOfEvents: "",
  keyEvents: [],
  urgentDeadlines: "",
  knownAuthorities: "",
  focusFirst: "",
  additionalContext: "",
  documents: {},
};
