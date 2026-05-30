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

export type RepresentationRole =
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

export type DocumentCategory =
  | "evidence"
  | "research"
  | "client_statement"
  | "witness_statement"
  | "transcript"
  | "other";

export type DocumentStatus = "uploaded" | "processed" | "error";

export interface CaseIntake {
  id: string;

  caseName: string;
  intakeProvidedBy: string;
  representationPracticeArea: RepresentationPracticeArea; // e.g. "Civil Litigation"
  representationRole: RepresentationRole; // e.g. "Lead Counsel"
  clientRole: ClientRole; // e.g. "Plaintiff"
  jurisdictionOrCourt: string;

  whatIsTheDisputeAbout: string;
  whatClaimsOrAllegationsAreInvolved: string;
  caseNumber?: string;
  currentCaseStatus: string;

  keyEventsSoFar: string;
  importantFilingsDeadlinesAndIncidents: string;
  anythingUrgentRightNow: string;

  yourObjective: string;
  otherSidesLikelyObjective: string;
  desiredOutcome: string;
  biggestCurrentRisk: string;

  parties: string;
  attorneys: string;
  witnessesAndAnticipatedTestimony: string;
  whoMattersMostRightNow: string;

  documents: {
    [documentId: string]: {
      category: DocumentCategory;
      fileName: string;
      documentId: string;
      userDescription?: string;
      whyThisMatters?: string;
      llmSummary?: string;
      status?: DocumentStatus;

      createdBy: "human" | "agent";
      uploadedAt: string; // ISO string recommended
      user_id?: string; // ID of the user who uploaded the document

      version?: number; // for tracking updates to the document
    };
  };
}
