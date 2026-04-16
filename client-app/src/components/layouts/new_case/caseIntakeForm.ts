import type {
  CaseIntake,
  CaseStatus,
  ClientRole,
  RepresentationPracticeArea,
  RepresentationRole,
} from "#/../../types/caseWorkspace";

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

const formatOptionLabel = (value: string) =>
  value
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
  "trial",
  "post_trial",
  "appeal",
] as const satisfies readonly CaseStatus[]);

export const initialCaseIntake: CaseIntake = {
  id: "",
  caseName: "",
  intakeProvidedBy: "",
  representationPracticeArea: "civil_litigation",
  representationRole: "lead_counsel",
  clientRole: "plaintiff",
  jurisdictionOrCourt: "",
  whatIsTheDisputeAbout: "",
  whatClaimsOrAllegationsAreInvolved: "",
  caseNumber: "",
  currentCaseStatus: "pre_filing",
  keyEventsSoFar: "",
  importantFilingsDeadlinesAndIncidents: "",
  anythingUrgentRightNow: "",
  yourObjective: "",
  otherSidesLikelyObjective: "",
  desiredOutcome: "",
  biggestCurrentRisk: "",
  parties: "",
  attorneys: "",
  witnessesAndAnticipatedTestimony: "",
  whoMattersMostRightNow: "",
  documents: {},
};
