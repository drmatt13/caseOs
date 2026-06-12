// Client-side workspace view model.
// Record/document/link data types live in caseRecords.ts.
// Shared domain enums live in caseDomain.ts.

import type { RecordType } from "./caseRecords";

// Backward-compatible re-exports (intake wizard + test data import from here)
export type {
  CaseStatus,
  ClientRole,
  DocumentCategory,
  RepresentationPracticeArea,
  RepresentationRole,
} from "./caseDomain";
export type { CaseIntake, CaseIntakeDocument } from "./caseIntake";

// ─────────────────────────────────────────────────────────────────────────────
// Workspace views
// ─────────────────────────────────────────────────────────────────────────────

export type WorkspaceViewType =
  // Workspace-level views
  | "agent"      // case agent chat
  | "overview"   // case summary + activity
  | "review"     // proposed records awaiting user approval
  // Record-type views (each maps to one RecordType)
  | "objectives"
  | "claims"
  | "posture"
  | "theories"
  | "issues"
  | "arguments"
  | "tasks"
  | "facts"
  | "timeline"
  | "testimony"
  | "precedent"
  | "notes"
  | "documents"
  | "people";

// Views that render a filtered list of one record type
export const VIEW_RECORD_TYPE = {
  objectives: "OBJECTIVE",
  claims: "CLAIM",
  posture: "POSTURE",
  theories: "THEORY",
  issues: "ISSUE",
  arguments: "ARGUMENT",
  tasks: "TASK",
  facts: "FACT",
  timeline: "TIMELINE_EVENT",
  testimony: "TESTIMONY",
  precedent: "LEGAL_PRECEDENT",
  notes: "NOTE",
  documents: "DOCUMENT",
  people: "PERSON",
} as const satisfies Partial<Record<WorkspaceViewType, RecordType>>;

export type RecordViewType = keyof typeof VIEW_RECORD_TYPE;

// Reverse map: which view shows a given record type
export const RECORD_TYPE_VIEW: Record<RecordType, WorkspaceViewType> = {
  CASE_SUMMARY: "overview",
  OBJECTIVE: "objectives",
  CLAIM: "claims",
  POSTURE: "posture",
  THEORY: "theories",
  ISSUE: "issues",
  ARGUMENT: "arguments",
  TASK: "tasks",
  FACT: "facts",
  TIMELINE_EVENT: "timeline",
  TESTIMONY: "testimony",
  LEGAL_PRECEDENT: "precedent",
  NOTE: "notes",
  DOCUMENT: "documents",
  PERSON: "people",
};

// Sidebar grouping, ordered top-down to mirror RECORD_LEVEL flow:
// strategy → analysis → grounding → sources.
export const WORKSPACE_MENU_GROUPS: Array<{
  label?: string;
  views: WorkspaceViewType[];
}> = [
  { views: ["agent", "overview", "review"] },
  { label: "Strategy", views: ["objectives", "claims", "posture"] },
  { label: "Analysis", views: ["theories", "issues", "arguments", "tasks"] },
  {
    label: "Grounding",
    views: ["facts", "timeline", "testimony", "precedent", "notes"],
  },
  { label: "Sources", views: ["documents", "people"] },
];
