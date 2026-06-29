/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetCurrentUser {\n    currentUser {\n      idToken\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n": typeof types.GetCurrentUserDocument,
    "\n  mutation UpdateCurrentUser($data: UpdateCurrentUserInput!) {\n    updateCurrentUser(data: $data) {\n      success\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n": typeof types.UpdateCurrentUserDocument,
    "\n  query MyWorkspaceInvitations {\n    myWorkspaceInvitations {\n      id\n      role\n      expiresAt\n      createdAt\n      invitedBy {\n        firstName\n        lastName\n        email\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": typeof types.MyWorkspaceInvitationsDocument,
    "\n  mutation InviteWorkspaceMember($data: InviteWorkspaceMemberInput!) {\n    inviteWorkspaceMember(data: $data) {\n      success\n      invitation {\n        id\n        email\n        role\n        status\n      }\n    }\n  }\n": typeof types.InviteWorkspaceMemberDocument,
    "\n  mutation AcceptWorkspaceInvitation($invitationId: ID!) {\n    acceptWorkspaceInvitation(invitationId: $invitationId) {\n      success\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": typeof types.AcceptWorkspaceInvitationDocument,
    "\n  mutation DeclineWorkspaceInvitation($invitationId: ID!) {\n    declineWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n": typeof types.DeclineWorkspaceInvitationDocument,
    "\n  mutation RevokeWorkspaceInvitation($invitationId: ID!) {\n    revokeWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n": typeof types.RevokeWorkspaceInvitationDocument,
    "\n  query ListWorkspaces {\n    workspaces {\n      id\n      name\n      updatedAt\n    }\n  }\n": typeof types.ListWorkspacesDocument,
    "\n  query GetWorkspace($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      description\n      currentUserMembership {\n        id\n        role\n        membershipStatus\n      }\n      memberships {\n        id\n        role\n        membershipStatus\n        joinedAt\n        updatedAt\n        user {\n          firstName\n          email\n          id\n          lastName\n          profilePicture\n        }\n      }\n      invitations {\n        id\n        email\n        role\n        status\n        createdAt\n      }\n    }\n  }\n": typeof types.GetWorkspaceDocument,
    "\n  mutation CreateWorkspace($data: CreateWorkspaceInput!) {\n    createWorkspace(data: $data) {\n      success\n      workspace {\n        id\n        name\n        description\n        ownerUserId\n        status\n        createdAt\n        updatedAt\n        currentUserMembership {\n          id\n          role\n          membershipStatus\n        }\n        invitations {\n          id\n          email\n          role\n          status\n        }\n      }\n    }\n  }\n": typeof types.CreateWorkspaceDocument,
};
const documents: Documents = {
    "\n  query GetCurrentUser {\n    currentUser {\n      idToken\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n": types.GetCurrentUserDocument,
    "\n  mutation UpdateCurrentUser($data: UpdateCurrentUserInput!) {\n    updateCurrentUser(data: $data) {\n      success\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n": types.UpdateCurrentUserDocument,
    "\n  query MyWorkspaceInvitations {\n    myWorkspaceInvitations {\n      id\n      role\n      expiresAt\n      createdAt\n      invitedBy {\n        firstName\n        lastName\n        email\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": types.MyWorkspaceInvitationsDocument,
    "\n  mutation InviteWorkspaceMember($data: InviteWorkspaceMemberInput!) {\n    inviteWorkspaceMember(data: $data) {\n      success\n      invitation {\n        id\n        email\n        role\n        status\n      }\n    }\n  }\n": types.InviteWorkspaceMemberDocument,
    "\n  mutation AcceptWorkspaceInvitation($invitationId: ID!) {\n    acceptWorkspaceInvitation(invitationId: $invitationId) {\n      success\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": types.AcceptWorkspaceInvitationDocument,
    "\n  mutation DeclineWorkspaceInvitation($invitationId: ID!) {\n    declineWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n": types.DeclineWorkspaceInvitationDocument,
    "\n  mutation RevokeWorkspaceInvitation($invitationId: ID!) {\n    revokeWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n": types.RevokeWorkspaceInvitationDocument,
    "\n  query ListWorkspaces {\n    workspaces {\n      id\n      name\n      updatedAt\n    }\n  }\n": types.ListWorkspacesDocument,
    "\n  query GetWorkspace($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      description\n      currentUserMembership {\n        id\n        role\n        membershipStatus\n      }\n      memberships {\n        id\n        role\n        membershipStatus\n        joinedAt\n        updatedAt\n        user {\n          firstName\n          email\n          id\n          lastName\n          profilePicture\n        }\n      }\n      invitations {\n        id\n        email\n        role\n        status\n        createdAt\n      }\n    }\n  }\n": types.GetWorkspaceDocument,
    "\n  mutation CreateWorkspace($data: CreateWorkspaceInput!) {\n    createWorkspace(data: $data) {\n      success\n      workspace {\n        id\n        name\n        description\n        ownerUserId\n        status\n        createdAt\n        updatedAt\n        currentUserMembership {\n          id\n          role\n          membershipStatus\n        }\n        invitations {\n          id\n          email\n          role\n          status\n        }\n      }\n    }\n  }\n": types.CreateWorkspaceDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetCurrentUser {\n    currentUser {\n      idToken\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetCurrentUser {\n    currentUser {\n      idToken\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCurrentUser($data: UpdateCurrentUserInput!) {\n    updateCurrentUser(data: $data) {\n      success\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCurrentUser($data: UpdateCurrentUserInput!) {\n    updateCurrentUser(data: $data) {\n      success\n      user {\n        id\n        email\n        billingEmail\n        firstName\n        lastName\n        hasHadActiveSubscription\n        profilePicture\n        updatedAt\n        accountTier\n        accountStatus\n        subscriptionStatus\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyWorkspaceInvitations {\n    myWorkspaceInvitations {\n      id\n      role\n      expiresAt\n      createdAt\n      invitedBy {\n        firstName\n        lastName\n        email\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query MyWorkspaceInvitations {\n    myWorkspaceInvitations {\n      id\n      role\n      expiresAt\n      createdAt\n      invitedBy {\n        firstName\n        lastName\n        email\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InviteWorkspaceMember($data: InviteWorkspaceMemberInput!) {\n    inviteWorkspaceMember(data: $data) {\n      success\n      invitation {\n        id\n        email\n        role\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation InviteWorkspaceMember($data: InviteWorkspaceMemberInput!) {\n    inviteWorkspaceMember(data: $data) {\n      success\n      invitation {\n        id\n        email\n        role\n        status\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AcceptWorkspaceInvitation($invitationId: ID!) {\n    acceptWorkspaceInvitation(invitationId: $invitationId) {\n      success\n      workspace {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AcceptWorkspaceInvitation($invitationId: ID!) {\n    acceptWorkspaceInvitation(invitationId: $invitationId) {\n      success\n      workspace {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeclineWorkspaceInvitation($invitationId: ID!) {\n    declineWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation DeclineWorkspaceInvitation($invitationId: ID!) {\n    declineWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RevokeWorkspaceInvitation($invitationId: ID!) {\n    revokeWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation RevokeWorkspaceInvitation($invitationId: ID!) {\n    revokeWorkspaceInvitation(invitationId: $invitationId) {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListWorkspaces {\n    workspaces {\n      id\n      name\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query ListWorkspaces {\n    workspaces {\n      id\n      name\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetWorkspace($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      description\n      currentUserMembership {\n        id\n        role\n        membershipStatus\n      }\n      memberships {\n        id\n        role\n        membershipStatus\n        joinedAt\n        updatedAt\n        user {\n          firstName\n          email\n          id\n          lastName\n          profilePicture\n        }\n      }\n      invitations {\n        id\n        email\n        role\n        status\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetWorkspace($id: ID!) {\n    workspace(id: $id) {\n      id\n      name\n      description\n      currentUserMembership {\n        id\n        role\n        membershipStatus\n      }\n      memberships {\n        id\n        role\n        membershipStatus\n        joinedAt\n        updatedAt\n        user {\n          firstName\n          email\n          id\n          lastName\n          profilePicture\n        }\n      }\n      invitations {\n        id\n        email\n        role\n        status\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateWorkspace($data: CreateWorkspaceInput!) {\n    createWorkspace(data: $data) {\n      success\n      workspace {\n        id\n        name\n        description\n        ownerUserId\n        status\n        createdAt\n        updatedAt\n        currentUserMembership {\n          id\n          role\n          membershipStatus\n        }\n        invitations {\n          id\n          email\n          role\n          status\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateWorkspace($data: CreateWorkspaceInput!) {\n    createWorkspace(data: $data) {\n      success\n      workspace {\n        id\n        name\n        description\n        ownerUserId\n        status\n        createdAt\n        updatedAt\n        currentUserMembership {\n          id\n          role\n          membershipStatus\n        }\n        invitations {\n          id\n          email\n          role\n          status\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;