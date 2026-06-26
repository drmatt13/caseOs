import type {
  CaseIntake,
  CaseIntakeClaim,
  CaseIntakeEventKind,
  CaseStatus,
  ClientRole,
  DatePrecision,
  PersonRole,
  RecordParty,
  RepresentationPracticeArea,
  RepresentationRole,
} from "#/types/caseWorkspace";
import type { RecordType } from "#/types/caseRecords";

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

// Intake offers the human-meaningful precisions; the type itself allows finer
// (minute/second) values that the agent can set from a document.
export const datePrecisionOptions: SelectOption<DatePrecision>[] = [
  { value: "day", label: "Exact day" },
  { value: "month", label: "Month only" },
  { value: "year", label: "Year only" },
];

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

export const initialCaseIntake: CaseIntake = {
  id: "",
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
