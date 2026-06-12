import type {
  CaseStatus,
  ClientRole,
  DocumentCategory,
  DocumentProcessingStatus,
  RepresentationPracticeArea,
  RepresentationRole,
} from "./caseDomain";

// Re-export so intake-adjacent code can import from one place
export type {
  CaseStatus,
  ClientRole,
  DocumentCategory,
  DocumentProcessingStatus,
  RepresentationPracticeArea,
  RepresentationRole,
};

export interface CaseIntakeDocument {
  documentId?: string;
  fileName: string;
  category: DocumentCategory;
  userDescription?: string;
  whyThisMatters?: string;
  llmSummary?: string;
  status?: DocumentProcessingStatus;
  createdBy?: "human" | "agent";
  uploadedAt?: string; // ISO 8601
  uploadedByUserId?: string;
}

// Raw intake form captured at case creation.
// Processed by the agent into an initial batch of PROPOSED records and a
// CaseContext, then kept as a permanent audit record.
// workspaceId/caseId are optional because the form is drafted before the
// case row exists; they are stamped on submission.
export interface CaseIntake {
  id: string;
  workspaceId?: string;
  caseId?: string;

  // ── Case basics ──────────────────────────────────────────────────────────
  caseName: string;
  intakeProvidedBy: string;
  representationPracticeArea: RepresentationPracticeArea;
  representationRole: RepresentationRole;
  clientRole: ClientRole;
  representedPartyName?: string;
  jurisdictionOrCourt: string;

  // ── Dispute ──────────────────────────────────────────────────────────────
  whatIsTheDisputeAbout: string;
  whatClaimsOrAllegationsAreInvolved: string;
  caseNumber?: string;
  currentCaseStatus: CaseStatus;

  // ── Timeline & urgency ───────────────────────────────────────────────────
  keyEventsSoFar: string;
  importantFilingsDeadlinesAndIncidents: string;
  anythingUrgentRightNow: string;

  // ── Goals & risks ────────────────────────────────────────────────────────
  yourObjective: string;
  otherSidesLikelyObjective: string;
  desiredOutcome: string;
  biggestCurrentRisk: string;

  // ── People ───────────────────────────────────────────────────────────────
  parties: string;
  attorneys: string;
  witnessesAndAnticipatedTestimony: string;
  whoMattersMostRightNow: string;

  // ── Documents uploaded during intake ────────────────────────────────────
  // These become CaseDocument rows + DOCUMENT records after processing
  documents: {
    [documentId: string]: CaseIntakeDocument;
  };

  createdAt?: string;
  updatedAt?: string;
}
