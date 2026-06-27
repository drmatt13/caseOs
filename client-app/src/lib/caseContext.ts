import type { CaseStatus } from "#/types/caseDomain";
import type { CaseContext, CaseIdentifier } from "#/types/caseContext";

const CASE_STAGE_LABELS: Record<CaseStatus, string> = {
  pre_filing: "Pre-filing",
  filed: "Filed",
  discovery: "Discovery",
  motion_stage: "Motion stage",
  settlement_negotiations: "Settlement negotiations",
  trial_preparation: "Trial preparation",
  trial: "Trial",
  post_trial: "Post-trial",
  appeal: "Appeal",
};

export function primaryCaseIdentifier(
  context: CaseContext,
): CaseIdentifier | undefined {
  return (
    context.identifiers.find((identifier) => identifier.isPrimary) ??
    context.identifiers[0]
  );
}

export function caseDisplayName(context: CaseContext): string {
  return context.caption?.trim() || context.caseName;
}

export function caseIdentifierDisplayLabel(context: CaseContext): string {
  const primaryIdentifier = primaryCaseIdentifier(context);
  if (primaryIdentifier) return primaryIdentifier.value;
  return context.proceduralStage === "pre_filing" ? "Pre-filing" : "No docket";
}

export function caseForumLabel(context: CaseContext): string {
  const primaryIdentifier = primaryCaseIdentifier(context);
  return (
    context.jurisdictionOrCourt?.trim() ||
    primaryIdentifier?.issuingBody?.trim() ||
    "Forum not set"
  );
}

export function caseStageLabel(stage: CaseStatus): string {
  return CASE_STAGE_LABELS[stage];
}
