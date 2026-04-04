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

export type CaseStatus =
  | "pre_filing"
  | "filed"
  | "discovery"
  | "motion_stage"
  | "settlement_negotiations"
  | "trial"
  | "post_trial"
  | "appeal";

export type DocumentStatus = "uploaded" | "processed" | "error";

export type DocumentCategory =
  | "evidence"
  | "research"
  | "client_statement"
  | "witness_statement"
  | "transcript"
  | "other";

export type StateObjectTypes =
  | "arguments"
  | "case_notes"
  | "facts"
  | "issues"
  | "legal_precedent"
  | "objectives"
  | "posture"
  | "tasks"
  | "testimony"
  | "timeline";

export type ReferenceTargets = StateObjectTypes | "documents";

export type LinkStatus = "proposed" | "accepted" | "rejected";
export type RecordStatus = "proposed" | "accepted" | "rejected" | "superseded";

export type WorkspaceReferenceMap = {
  [StateObjectType in ReferenceTargets]?: {
    id: string;
    linkStatus?: LinkStatus;
  }[];
};

export type WorkspaceReferencedByMap = {
  [StateObjectType in StateObjectTypes]?: string[];
};

export interface Document {
  category: DocumentCategory;
  fileName: string;
  documentId?: string;
  userDescription?: string;
  whyThisMatters?: string;
  llmSummary?: string;
  status?: DocumentStatus;

  createdBy?: "human" | "agent";
  uploadedAt?: string;
  user_id?: string; // ID of the user who uploaded the document

  version?: number; // for tracking updates to the document

  relevantDate?: string; // ISO string recommended
  dateConfidence?: "exact" | "approximate" | "unknown";
  referencedBy?: WorkspaceReferencedByMap;
}

export interface CaseIntake {
  id: string; // unique identifier for the case intake, e.g. a UUID

  // Case Basics
  caseName: string; // e.g. "Smith v. Jones"
  intakeProvidedBy: string; // e.g. "John Doe, Esq." or "Jane Smith, Client"
  representationPracticeArea: RepresentationPracticeArea; // e.g. "Civil Litigation"
  representationRole: RepresentationRole; // e.g. "Lead Counsel"
  clientRole: ClientRole; // e.g. "Plaintiff"
  jurisdictionOrCourt: string; // e.g. "Superior Court of California, County of Los Angeles"

  // Dispute Details
  whatIsTheDisputeAbout: string; // Describe the nature of the dispute, conflict, or legal issue at hand.
  whatClaimsOrAllegationsAreInvolved: string; // Describe the specific claims or allegations involved in the case.
  caseNumber?: string; // e.g. "2023-CV-12345"
  currentCaseStatus: CaseStatus; // e.g. "Discovery"

  // Timeline and Urgency
  keyEventsSoFar: string; // List the key events that have occurred in the case so far, such as filings, hearings, or significant developments.
  importantFilingsDeadlinesAndIncidents: string; // Court filings, deadlines, hearings, or incidents that are upcoming or have recently occurred.
  anythingUrgentRightNow: string; // Upcoming deadlines, pending motions, time-sensitive matters...

  // Goals, Objectives, and Risks
  yourObjective: string; // What are you trying to archieve in this case? Describe your main goals and objectives.
  otherSidesLikelyObjective: string; // What do you think the other side's main goals and objectives are in this case?
  desiredOutcome: string; // What would be the ideal resolution or outcome for your client in this case?
  biggestCurrentRisk: string; // What concerns you the most about this case?

  // People, parties, and witnesses
  parties: string; // List the parties involved in the case. e.g. "John Smith (Plaintiff), Jane Doe (Defendant)"
  attorneys: string; // List the attorneys involved in the case. e.g. "John Doe, Esq. (Lead Counsel for Plaintiff), Jane Smith, Esq. (Defense Counsel for Defendant)"
  witnessesAndAnticipatedTestimony: string; // List the witnesses and their anticipated testimony. e.g. "Alice Johnson (Eyewitness to the incident), Bob Lee (Expert witness on industry standards)"
  whoMattersMostRightNow: string; // Identify the key individuals or entities that are most important at this stage of the case. e.g. "The judge assigned to the case, the opposing counsel, and the key witness whose testimony is expected to be crucial in the upcoming hearing."

  // Documents and Evidence
  documents: {
    [documentId: string]: Document;
  };
}

export type WorkspaceRecordBase = {
  id: string;
  catagory?: string; // that way you can segment your records such as have different parallel records for different theories, lines of argument, or parties
  content: string;
  confidence?: number;
  createdBy?: "human" | "agent";
  user_id?: string; // ID of the user who created the record
  recordStatus?: RecordStatus;
  recordVisibility: "hidden" | "visible";
  lastUpdated: Date;
  lastUpdatedBy?: string; // ID of the user or agent that last updated the record
  references?: WorkspaceReferenceMap;
  referencedBy?: WorkspaceReferencedByMap;
  supersedes?: WorkspaceReferencedByMap; // references to records that this record supersedes
  supersededBy?: WorkspaceReferencedByMap; // references to records that supersede this record
};

export type ArgumentRecord = WorkspaceRecordBase & {
  argumentType?: "claim" | "defense" | "counterargument" | "theory" | "other";
};

export type CaseNoteRecord = WorkspaceRecordBase & {
  noteType?: "general" | "strategy" | "research" | "question" | "other";
};

export type FactRecord = WorkspaceRecordBase & {
  factType?: "background" | "disputed" | "undisputed" | "procedural" | "other";
};

export type IssueRecord = WorkspaceRecordBase & {
  issueType?: "legal" | "factual" | "procedural" | "strategic" | "other";
};

export type LegalPrecedentRecord = WorkspaceRecordBase & {
  jurisdiction?: string; // e.g. "California", "Federal"
  court?: string; // e.g. "Supreme Court", "9th Circuit"
  citation?: string; // e.g. "123 Cal.4th 456 (2020)"
  relevance?: string; // brief explanation of how this precedent is relevant to the current case
};

export type ObjectiveRecord = WorkspaceRecordBase & {
  priority?: "low" | "medium" | "high";
};

export type PostureRecord = WorkspaceRecordBase & {
  postureType?:
    | "procedural"
    | "litigation"
    | "discovery"
    | "settlement"
    | "appeal"
    | "other";
};

export type TaskRecord = WorkspaceRecordBase & {
  taskStatus?: "open" | "in_progress" | "blocked" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
};

export type TestimonyRecord = WorkspaceRecordBase & {
  witnessName?: string;
  testimonyType?: "anticipated" | "actual" | "impeachment" | "other";
};

export type TimelineRecord = WorkspaceRecordBase & {
  eventDate?: string;
  dateConfidence?: "exact" | "approximate" | "unknown";
};

export type WorkspaceRecordMap<T extends WorkspaceRecordBase> = {
  [id: string]: T;
};

export type WorkspaceState = {
  arguments: WorkspaceRecordMap<ArgumentRecord>;
  case_notes: WorkspaceRecordMap<CaseNoteRecord>;
  facts: WorkspaceRecordMap<FactRecord>;
  issues: WorkspaceRecordMap<IssueRecord>;
  legal_precedent: WorkspaceRecordMap<LegalPrecedentRecord>;
  objectives: WorkspaceRecordMap<ObjectiveRecord>;
  posture: WorkspaceRecordMap<PostureRecord>;
  tasks: WorkspaceRecordMap<TaskRecord>;
  testimony: WorkspaceRecordMap<TestimonyRecord>;
  timeline: WorkspaceRecordMap<TimelineRecord>;
};

export type ViewTypes = StateObjectTypes | "case_summary" | "documents_index";
export type WorkspaceViews = {
  [view in ViewTypes]: {
    content: string;
    lastUpdated: string;
  };
};

export interface CaseWorkspace {
  agent: string; //  "agent.md"
  state: WorkspaceState;
  views: WorkspaceViews;
  documents: {
    [documentId: string]: Document;
  };
}
