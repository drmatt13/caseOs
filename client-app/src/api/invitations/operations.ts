import { graphql } from "#/api/generated";
import type {
  AcceptWorkspaceInvitationMutation,
  DeclineWorkspaceInvitationMutation,
  InviteWorkspaceMemberInput,
  InviteWorkspaceMemberMutation,
  MyWorkspaceInvitationsQuery,
  RevokeWorkspaceInvitationMutation,
} from "#/api/generated/graphql";
import { executeGraphQL } from "#/api/graphql/client";
import {
  normalizeMyInvitations,
  type MyInvitation,
  type AcceptInvitationResult,
} from "./model";

export type { MyInvitation };

const MyWorkspaceInvitationsDocument = graphql(`
  query MyWorkspaceInvitations {
    myWorkspaceInvitations {
      id
      role
      expiresAt
      createdAt
      invitedBy {
        firstName
        lastName
        email
      }
      workspace {
        id
        name
      }
    }
  }
`);

const InviteWorkspaceMemberDocument = graphql(`
  mutation InviteWorkspaceMember($data: InviteWorkspaceMemberInput!) {
    inviteWorkspaceMember(data: $data) {
      success
      invitation {
        id
        email
        role
        status
      }
    }
  }
`);

const AcceptWorkspaceInvitationDocument = graphql(`
  mutation AcceptWorkspaceInvitation($invitationId: ID!) {
    acceptWorkspaceInvitation(invitationId: $invitationId) {
      success
      workspace {
        id
        name
      }
    }
  }
`);

const DeclineWorkspaceInvitationDocument = graphql(`
  mutation DeclineWorkspaceInvitation($invitationId: ID!) {
    declineWorkspaceInvitation(invitationId: $invitationId) {
      success
    }
  }
`);

const RevokeWorkspaceInvitationDocument = graphql(`
  mutation RevokeWorkspaceInvitation($invitationId: ID!) {
    revokeWorkspaceInvitation(invitationId: $invitationId) {
      success
    }
  }
`);

export async function getMyInvitations(): Promise<MyInvitation[]> {
  const data: MyWorkspaceInvitationsQuery = await executeGraphQL(
    MyWorkspaceInvitationsDocument,
  );

  return normalizeMyInvitations(data.myWorkspaceInvitations);
}

export async function inviteWorkspaceMember(
  data: InviteWorkspaceMemberInput,
): Promise<void> {
  const result: InviteWorkspaceMemberMutation = await executeGraphQL(
    InviteWorkspaceMemberDocument,
    { data },
  );

  if (!result.inviteWorkspaceMember?.success) {
    throw new Error("Invitation was not sent");
  }
}

export async function acceptInvitation(
  invitationId: string,
): Promise<AcceptInvitationResult> {
  const result: AcceptWorkspaceInvitationMutation = await executeGraphQL(
    AcceptWorkspaceInvitationDocument,
    { invitationId },
  );

  const workspace = result.acceptWorkspaceInvitation?.workspace;

  if (!result.acceptWorkspaceInvitation?.success || !workspace?.id) {
    throw new Error("Invitation could not be accepted");
  }

  return { workspaceId: workspace.id, workspaceName: workspace.name ?? "" };
}

export async function declineInvitation(invitationId: string): Promise<void> {
  const result: DeclineWorkspaceInvitationMutation = await executeGraphQL(
    DeclineWorkspaceInvitationDocument,
    { invitationId },
  );

  if (!result.declineWorkspaceInvitation?.success) {
    throw new Error("Invitation could not be declined");
  }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const result: RevokeWorkspaceInvitationMutation = await executeGraphQL(
    RevokeWorkspaceInvitationDocument,
    { invitationId },
  );

  if (!result.revokeWorkspaceInvitation?.success) {
    throw new Error("Invitation could not be revoked");
  }
}
