// Frontend permission gates. The actual capability matrix lives in
// @repo/api-contract (workspaceRoles.ts) so the UI gates here and the
// graphql-api resolvers enforce the exact same rules — one security model, no
// drift. This module just re-exports those checks typed against the generated
// GraphQL `MembershipRole`.
import {
  can as canForRole,
  canManageWorkspace as canManageWorkspaceForRole,
  type WorkspaceCapability,
} from "@repo/api-contract";
import type { MembershipRole } from "#/api/generated/graphql";

export type { WorkspaceCapability };

export function can(
  role: MembershipRole | null | undefined,
  capability: WorkspaceCapability,
): boolean {
  return canForRole(role, capability);
}

export function canManageWorkspace(
  role: MembershipRole | null | undefined,
): boolean {
  return canManageWorkspaceForRole(role);
}

// A resolved capability bag for a role — convenient to compute once at a route
// boundary and thread into the case-workspace record components.
export type WorkspaceCapabilities = {
  manageWorkspace: boolean;
  inviteMembers: boolean;
  removeMembers: boolean;
  createCase: boolean;
  createProposal: boolean;
  acceptProposal: boolean;
  answerQuestion: boolean;
  setTaskStatus: boolean;
  markReviewed: boolean;
};

export function resolveCapabilities(
  role: MembershipRole | null | undefined,
): WorkspaceCapabilities {
  return {
    manageWorkspace: can(role, "manageWorkspace"),
    inviteMembers: can(role, "inviteMembers"),
    removeMembers: can(role, "removeMembers"),
    createCase: can(role, "createCase"),
    createProposal: can(role, "createProposal"),
    acceptProposal: can(role, "acceptProposal"),
    answerQuestion: can(role, "answerQuestion"),
    setTaskStatus: can(role, "setTaskStatus"),
    markReviewed: can(role, "markReviewed"),
  };
}
