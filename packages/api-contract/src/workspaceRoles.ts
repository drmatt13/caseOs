// ─────────────────────────────────────────────────────────────────────────────
// Workspace authorization — the single source of truth for "who can do what".
// ─────────────────────────────────────────────────────────────────────────────
//
// This module is browser-safe (no Prisma / Node imports) so BOTH the client-app
// UI gates and the graphql-api Lambda resolvers import the same capability
// matrix. Gating the UI and enforcing the server from one table guarantees they
// can never drift into an inconsistent security model.
//
// The role string values intentionally mirror the Prisma `MembershipRole` enum
// values (OWNER / ADMIN / REVIEWER / CONTRIBUTOR / READONLY) — they are the
// contract. Keep them in sync with packages/database/prisma/schema.prisma.

// Ordered most-privileged → least-privileged. Order is meaningful for any
// "at least this role" comparisons and for rendering role pickers/legends.
export const WORKSPACE_ROLES = [
  "OWNER",
  "ADMIN",
  "REVIEWER",
  "CONTRIBUTOR",
  "READONLY",
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

// Roles a member may be invited with / assigned. OWNER is never assignable —
// it is conferred only by creating the workspace.
export const ASSIGNABLE_WORKSPACE_ROLES = [
  "ADMIN",
  "REVIEWER",
  "CONTRIBUTOR",
  "READONLY",
] as const;

export type AssignableWorkspaceRole = (typeof ASSIGNABLE_WORKSPACE_ROLES)[number];

export type WorkspaceCapability =
  // Workspace administration
  | "manageWorkspace"
  | "inviteMembers"
  | "removeMembers"
  | "createCase"
  // Case-record actions
  | "createProposal"
  | "acceptProposal"
  | "answerQuestion"
  | "setTaskStatus"
  | "markReviewed";

// The authoritative capability matrix. OWNER and ADMIN can do everything
// (including creating cases); a REVIEWER can act on records (accept proposals,
// answer question records, set task statuses, resolve review flags) but not
// administer the workspace or create cases; a CONTRIBUTOR may only propose;
// READONLY may only view.
export const ROLE_CAPABILITIES: Record<WorkspaceRole, readonly WorkspaceCapability[]> = {
  OWNER: [
    "manageWorkspace",
    "inviteMembers",
    "removeMembers",
    "createCase",
    "createProposal",
    "acceptProposal",
    "answerQuestion",
    "setTaskStatus",
    "markReviewed",
  ],
  ADMIN: [
    "manageWorkspace",
    "inviteMembers",
    "removeMembers",
    "createCase",
    "createProposal",
    "acceptProposal",
    "answerQuestion",
    "setTaskStatus",
    "markReviewed",
  ],
  REVIEWER: [
    "createProposal",
    "acceptProposal",
    "answerQuestion",
    "setTaskStatus",
    "markReviewed",
  ],
  CONTRIBUTOR: ["createProposal"],
  READONLY: [],
};

/** Returns true if `role` is granted `capability`. The one authorization check. */
export function can(
  role: WorkspaceRole | null | undefined,
  capability: WorkspaceCapability,
): boolean {
  if (!role) {
    return false;
  }

  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/** Convenience predicate for the common "can administer this workspace" gate. */
export function canManageWorkspace(
  role: WorkspaceRole | null | undefined,
): boolean {
  return can(role, "manageWorkspace");
}
