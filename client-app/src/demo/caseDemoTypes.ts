// Shared types for the hardcoded demo workspaces. A `CaseDemo` is a single
// self-contained bundle of everything one demo case needs: its display
// metadata, CaseContext, source documents, typed records, graph links, and the
// UI-only activity / agent-thread data. The case route resolves one bundle by
// caseId (see caseDemos.ts) and renders entirely from it, so adding a new demo
// case is just authoring another CaseDemo — no route changes required.

import type { CaseContext } from "#/types/caseContext";
import type {
  CaseDocument,
  GraphLink,
  TypedCaseRecord,
} from "#/types/caseRecords";

// Workspace-level display metrics for the overview dashboard.
export type DemoCaseMeta = {
  id: string;
  title: string;
  court: string;
  caseNumber: string;
  client: string;
  health: number;
  trialReadiness: number;
  unresolvedGaps: number;
};

export type DemoActivity = {
  id: string;
  actor: string;
  action: string;
  time: string;
  tone: "info" | "success" | "warning";
};

export type DemoAgentMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  // Record IDs the agent cited; rendered as clickable chips.
  citedRecordIds?: string[];
  time: string;
};

export interface CaseDemo {
  workspaceId: string;
  caseId: string;
  userId: string;
  meta: DemoCaseMeta;
  caseContext: CaseContext;
  documents: CaseDocument[];
  records: TypedCaseRecord[];
  links: GraphLink[];
  activity: DemoActivity[];
  agentThread: DemoAgentMessage[];
  agentInstructions: string[];
}
