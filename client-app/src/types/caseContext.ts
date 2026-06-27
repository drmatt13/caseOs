import type {
  CaseStatus,
  ClientRole,
  RepresentationPracticeArea,
  RepresentationRole,
} from "./caseDomain";

// Identifiers for the case across courts, agencies, arbitral forums, internal
// matter systems, and related proceedings. A case may have no public docket yet
// (pre-filing) or several identifiers at once (trial court + appeal + internal
// matter number), so docket number is modeled as a collection rather than a
// single scalar field.
export type CaseIdentifierKind =
  | "court_docket"
  | "agency_number"
  | "arbitration_number"
  | "appeal_docket"
  | "lower_court_docket"
  | "internal_matter_number"
  | "police_report_number"
  | "related_case_number"
  | "other";

export interface CaseIdentifier {
  id: string;
  kind: CaseIdentifierKind;
  value: string;
  label?: string;
  issuingBody?: string;
  jurisdiction?: string;
  isPrimary?: boolean;
  sourceIntakeId?: string;
  sourceDocumentId?: string;
  verifiedAt?: string;
  verifiedByUserId?: string;
}

// Case-level metadata that frames the entire knowledge graph: the singular case
// profile. Derived from CaseIntake and kept in sync as the case evolves. One
// CaseContext exists per case and is updated in place (version-incremented)
// rather than represented as a CaseRecord proposal.
export interface CaseContext {
  id: string;
  workspaceId: string;
  caseId: string;
  sourceIntakeId?: string; // intake that originally generated this context
  version: number;

  caseName: string;
  caption?: string;
  identifiers: CaseIdentifier[];
  jurisdictionOrCourt?: string;
  practiceArea: RepresentationPracticeArea;
  proceduralStage: CaseStatus;

  representation: {
    clientRole: ClientRole;
    representationRole: RepresentationRole;
    representedPartyName?: string;
  };

  objectives: {
    ours: string;
    theirs: string;
    desiredOutcome?: string;
    biggestCurrentRisk?: string;
  };

  claims: {
    dispute: string;
    claimsOrAllegations: string;
  };

  currentPosture?: string;

  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
}
