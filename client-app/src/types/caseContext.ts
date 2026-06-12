import type {
  ClientRole,
  RepresentationPracticeArea,
  RepresentationRole,
} from "./caseDomain";

// Case-level metadata that frames the entire knowledge graph.
// Derived from CaseIntake and kept in sync as the case evolves.
// One CaseContext per case; updated in place (version-incremented) rather than replaced.
export interface CaseContext {
  id: string;
  workspaceId: string;
  caseId: string;
  sourceIntakeId?: string; // intake that originally generated this context
  version: number;

  caseName: string;
  caseNumberOrDocket?: string;
  jurisdictionOrCourt: string;
  practiceArea: RepresentationPracticeArea;

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
