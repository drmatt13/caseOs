/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AccountStatus =
  | 'ACTIVE'
  | 'DISABLED';

export type AccountTier =
  | 'ENTERPRISE'
  | 'FREE'
  | 'PRO'
  | 'TRIAL';

export type CreateWorkspaceInput = {
  description?: string | null | undefined;
  invitations?: Array<CreateWorkspaceInvitationInput> | null | undefined;
  name: string;
};

export type CreateWorkspaceInvitationInput = {
  email: string;
  role: MembershipRole;
};

export type InvitationStatus =
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'PENDING'
  | 'REVOKED';

export type InviteWorkspaceMemberInput = {
  email: string;
  role: MembershipRole;
  workspaceId: string | number;
};

export type MembershipRole =
  | 'ADMIN'
  | 'CONTRIBUTOR'
  | 'OWNER'
  | 'READONLY'
  | 'REVIEWER';

export type MembershipStatus =
  | 'ACTIVE'
  | 'INVITED'
  | 'REMOVED';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'INACTIVE'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'PAST_DUE'
  | 'TRIALING'
  | 'UNPAID';

export type UpdateCurrentUserInput = {
  billingEmail?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  profilePicture?: string | null | undefined;
};

export type WorkspaceStatus =
  | 'ACTIVE'
  | 'ARCHIVED';

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { currentUser: { idToken: string | null, user: { id: string | null, email: string | null, billingEmail: string | null, firstName: string | null, lastName: string | null, hasHadActiveSubscription: boolean | null, profilePicture: string | null, updatedAt: string | null, accountTier: AccountTier | null, accountStatus: AccountStatus | null, subscriptionStatus: SubscriptionStatus | null } | null } | null };

export type UpdateCurrentUserMutationVariables = Exact<{
  data: UpdateCurrentUserInput;
}>;


export type UpdateCurrentUserMutation = { updateCurrentUser: { success: boolean | null, user: { id: string | null, email: string | null, billingEmail: string | null, firstName: string | null, lastName: string | null, hasHadActiveSubscription: boolean | null, profilePicture: string | null, updatedAt: string | null, accountTier: AccountTier | null, accountStatus: AccountStatus | null, subscriptionStatus: SubscriptionStatus | null } | null } | null };

export type MyWorkspaceInvitationsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyWorkspaceInvitationsQuery = { myWorkspaceInvitations: Array<{ id: string | null, role: MembershipRole | null, expiresAt: string | null, createdAt: string | null, invitedBy: { firstName: string | null, lastName: string | null, email: string | null } | null, workspace: { id: string | null, name: string | null } | null }> | null };

export type InviteWorkspaceMemberMutationVariables = Exact<{
  data: InviteWorkspaceMemberInput;
}>;


export type InviteWorkspaceMemberMutation = { inviteWorkspaceMember: { success: boolean | null, invitation: { id: string | null, email: string | null, role: MembershipRole | null, status: InvitationStatus | null } | null } | null };

export type AcceptWorkspaceInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type AcceptWorkspaceInvitationMutation = { acceptWorkspaceInvitation: { success: boolean | null, workspace: { id: string | null, name: string | null } | null } | null };

export type DeclineWorkspaceInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type DeclineWorkspaceInvitationMutation = { declineWorkspaceInvitation: { success: boolean | null } | null };

export type RevokeWorkspaceInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type RevokeWorkspaceInvitationMutation = { revokeWorkspaceInvitation: { success: boolean | null } | null };

export type ListWorkspacesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListWorkspacesQuery = { workspaces: Array<{ id: string | null, name: string | null, updatedAt: string | null }> | null };

export type GetWorkspaceQueryVariables = Exact<{
  id: string | number;
}>;


export type GetWorkspaceQuery = { workspace: { id: string | null, name: string | null, description: string | null, currentUserMembership: { id: string | null, role: MembershipRole | null, membershipStatus: MembershipStatus | null } | null, memberships: Array<{ id: string | null, role: MembershipRole | null, membershipStatus: MembershipStatus | null, joinedAt: string | null, updatedAt: string | null, user: { firstName: string | null, email: string | null, id: string | null, lastName: string | null, profilePicture: string | null } | null }> | null, invitations: Array<{ id: string | null, email: string | null, role: MembershipRole | null, status: InvitationStatus | null, createdAt: string | null }> | null } | null };

export type CreateWorkspaceMutationVariables = Exact<{
  data: CreateWorkspaceInput;
}>;


export type CreateWorkspaceMutation = { createWorkspace: { success: boolean | null, workspace: { id: string | null, name: string | null, description: string | null, ownerUserId: string | null, status: WorkspaceStatus | null, createdAt: string | null, updatedAt: string | null, currentUserMembership: { id: string | null, role: MembershipRole | null, membershipStatus: MembershipStatus | null } | null, invitations: Array<{ id: string | null, email: string | null, role: MembershipRole | null, status: InvitationStatus | null }> | null } | null } | null };


export const GetCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"idToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"billingEmail"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"hasHadActiveSubscription"}},{"kind":"Field","name":{"kind":"Name","value":"profilePicture"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountTier"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}}]}}]}}]}}]} as unknown as DocumentNode<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export const UpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"billingEmail"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"hasHadActiveSubscription"}},{"kind":"Field","name":{"kind":"Name","value":"profilePicture"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountTier"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCurrentUserMutation, UpdateCurrentUserMutationVariables>;
export const MyWorkspaceInvitationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyWorkspaceInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWorkspaceInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<MyWorkspaceInvitationsQuery, MyWorkspaceInvitationsQueryVariables>;
export const InviteWorkspaceMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteWorkspaceMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"InviteWorkspaceMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteWorkspaceMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"invitation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<InviteWorkspaceMemberMutation, InviteWorkspaceMemberMutationVariables>;
export const AcceptWorkspaceInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptWorkspaceInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptWorkspaceInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AcceptWorkspaceInvitationMutation, AcceptWorkspaceInvitationMutationVariables>;
export const DeclineWorkspaceInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineWorkspaceInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineWorkspaceInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeclineWorkspaceInvitationMutation, DeclineWorkspaceInvitationMutationVariables>;
export const RevokeWorkspaceInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RevokeWorkspaceInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revokeWorkspaceInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<RevokeWorkspaceInvitationMutation, RevokeWorkspaceInvitationMutationVariables>;
export const ListWorkspacesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListWorkspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspaces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ListWorkspacesQuery, ListWorkspacesQueryVariables>;
export const GetWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"currentUserMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"membershipStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"membershipStatus"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"profilePicture"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetWorkspaceQuery, GetWorkspaceQueryVariables>;
export const CreateWorkspaceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkspace"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkspaceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkspace"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"workspace"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"ownerUserId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"currentUserMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"membershipStatus"}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;