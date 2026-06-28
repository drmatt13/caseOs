import type { MembershipRole } from "#/api/generated/graphql";

export const CREATE_WORKSPACE_TOTAL_STEPS = 3;

export interface WorkspaceInvite {
  email: string;
  role: MembershipRole;
}

export interface CreateWorkspaceForm {
  name: string;
  includeDescription: boolean;
  description: string;
  pendingInviteEmail: string;
  pendingInviteRole: MembershipRole;
  invites: WorkspaceInvite[];
}

export interface CreateWorkspaceWizardState {
  step: number;
  workspace: CreateWorkspaceForm;
}

export const initialCreateWorkspace: CreateWorkspaceForm = {
  name: "",
  includeDescription: false,
  description: "",
  pendingInviteEmail: "",
  pendingInviteRole: "CONTRIBUTOR",
  invites: [],
};
