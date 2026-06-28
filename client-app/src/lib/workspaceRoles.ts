// Presentation metadata for workspace roles — labels, tones, and the
// human-readable capability descriptions shown in role pickers/legends. The
// security model (which role can do what) lives in @repo/api-contract; this
// module is only about how roles are *named and described* in the UI, keyed by
// the generated `MembershipRole` enum so there's one labels table for the app.
import { ASSIGNABLE_WORKSPACE_ROLES } from "@repo/api-contract";
import type { MembershipRole } from "#/api/generated/graphql";
import type { ToneName } from "#/lib/tones";

export type WorkspaceRoleMeta = {
  value: MembershipRole;
  label: string;
  tone: ToneName;
  shortDescription: string;
  capabilityBullets: string[];
};

export const WORKSPACE_ROLE_META: Record<MembershipRole, WorkspaceRoleMeta> = {
  OWNER: {
    value: "OWNER",
    label: "Owner",
    tone: "special",
    shortDescription: "Full control of the workspace and billing.",
    capabilityBullets: [
      "Manage workspace settings and members",
      "Everything Admins and Reviewers can do",
    ],
  },
  ADMIN: {
    value: "ADMIN",
    label: "Admin",
    tone: "positive",
    shortDescription: "Manage members and act on every case record.",
    capabilityBullets: [
      "Invite and remove members",
      "Propose, accept, and reject records",
      "Answer questions and set task statuses",
    ],
  },
  REVIEWER: {
    value: "REVIEWER",
    label: "Reviewer",
    tone: "info",
    shortDescription: "Propose and accept records; resolve questions and tasks.",
    capabilityBullets: [
      "Propose new case records",
      "Accept or reject proposals",
      "Answer question records and set task statuses",
    ],
  },
  CONTRIBUTOR: {
    value: "CONTRIBUTOR",
    label: "Contributor",
    tone: "caution",
    shortDescription: "Propose records for a Reviewer to accept.",
    capabilityBullets: [
      "Propose new case records",
      "Cannot accept proposals or change records",
    ],
  },
  READONLY: {
    value: "READONLY",
    label: "Read Only",
    tone: "neutral",
    shortDescription: "View the workspace without making changes.",
    capabilityBullets: ["View cases and records", "Cannot make changes"],
  },
};

export const workspaceRoleLabel = (role: MembershipRole): string =>
  WORKSPACE_ROLE_META[role].label;

// Roles that may be assigned when inviting (OWNER excluded), in privilege order.
export const ASSIGNABLE_ROLE_META: WorkspaceRoleMeta[] =
  ASSIGNABLE_WORKSPACE_ROLES.map((role) => WORKSPACE_ROLE_META[role]);

export const workspaceRoleOptions: Array<{
  label: string;
  value: MembershipRole;
}> = ASSIGNABLE_ROLE_META.map((meta) => ({
  label: meta.label,
  value: meta.value,
}));
