export const CREATE_WORKSPACE_TOTAL_STEPS = 3;

export type WorkspaceRole = "Admin" | "Contributor" | "Read Only";

export interface WorkspaceInvite {
  email: string;
  role: WorkspaceRole;
}

export interface CreateWorkspaceForm {
  name: string;
  description: string;
  pendingInviteEmail: string;
  pendingInviteRole: WorkspaceRole;
  invites: WorkspaceInvite[];
}

export interface CreateWorkspaceWizardState {
  step: number;
  workspace: CreateWorkspaceForm;
}

export const workspaceRoleOptions: Array<{
  label: string;
  value: WorkspaceRole;
}> = [
  { label: "Admin", value: "Admin" },
  { label: "Contributor", value: "Contributor" },
  { label: "Read Only", value: "Read Only" },
];

export const initialCreateWorkspace: CreateWorkspaceForm = {
  name: "",
  description: "",
  pendingInviteEmail: "",
  pendingInviteRole: "Contributor",
  invites: [],
};
