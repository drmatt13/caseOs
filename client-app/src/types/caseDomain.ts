// Shared domain primitives used across case-related modules.
// Import from here rather than re-declaring in individual type files.

export type RepresentationPracticeArea =
  | "civil_litigation"
  | "criminal"
  | "family"
  | "corporate"
  | "personal_injury"
  | "employment"
  | "landlord_tenant"
  | "probate_and_estate"
  | "real_estate"
  | "immigration"
  | "bankruptcy"
  | "juvenile"
  | "appeals"
  | "administrative"
  | "intellectual_property"
  | "tax"
  | "other";

export type ClientRole =
  | "plaintiff"
  | "defendant"
  | "petitioner"
  | "respondent"
  | "appellant"
  | "appellee"
  | "claimant"
  | "counterclaimant"
  | "counterdefendant"
  | "third_party_plaintiff"
  | "third_party_defendant"
  | "interested_party"
  | "other";

// Who is setting up the case — drives a presentation + smart-default layer over
// the intake wizard (attorney vocabulary vs. plain-language pro-se vocabulary).
// The underlying CaseIntake contract is identical for both.
export type IntakePerspective = "attorney" | "self";

export type RepresentationRole =
  | "pro_se"
  | "lead_counsel"
  | "co_counsel"
  | "local_counsel"
  | "outside_counsel"
  | "in_house_counsel"
  | "appellate_counsel"
  | "defense_counsel"
  | "prosecutor"
  | "guardian_ad_litem"
  | "other";

export type CaseActiveStatus = "active" | "archived" | "closed";

// Procedural stage of the matter (distinct from CaseActiveStatus lifecycle)
export type CaseStatus =
  | "pre_filing"
  | "filed"
  | "discovery"
  | "motion_stage"
  | "settlement_negotiations"
  | "trial_preparation"
  | "trial"
  | "post_trial"
  | "appeal";

export type DocumentCategory =
  | "evidence"
  | "research"
  | "pleading"
  | "motion"
  | "order"
  | "contract"
  | "correspondence"
  | "client_statement"
  | "witness_statement"
  | "deposition"
  | "transcript"
  | "expert_report"
  | "financial"
  | "other";

export type DocumentProcessingStatus =
  | "uploaded"
  | "processing"
  | "processed"
  | "error";

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
