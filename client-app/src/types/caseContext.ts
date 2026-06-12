import type {
  ClientRole,
  RepresentationPracticeArea,
  RepresentationRole,
} from "./caseIntake";

export interface CaseContext {
  id: string;
  workspaceId: string;
  caseId: string;
  sourceIntakeId?: string;
  version: number;

  caseName: string;
  caseNumberOrDocket?: string;
  jurisdictionOrCourt: string;
  representationPracticeArea: RepresentationPracticeArea;

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
