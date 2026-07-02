import { createContext } from "react";
import type { WorkspaceCapabilities } from "#/lib/permissions";

// The signed-in user's capabilities within the active workspace, provided once
// at the case route and consumed by the record action surfaces so propose /
// accept / answer / task-status controls render only for roles that may use
// them. Default grants nothing — a missing provider must never expose actions.
export const DEFAULT_WORKSPACE_CAPABILITIES: WorkspaceCapabilities = {
  manageWorkspace: false,
  inviteMembers: false,
  removeMembers: false,
  createCase: false,
  createProposal: false,
  acceptProposal: false,
  answerQuestion: false,
  setTaskStatus: false,
  markReviewed: false,
};

export const WorkspaceCapabilitiesContext = createContext<WorkspaceCapabilities>(
  DEFAULT_WORKSPACE_CAPABILITIES,
);
