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
  displayName?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  profilePicture?: string | null | undefined;
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { currentUser: { idToken: string | null, user: { id: string | null, email: string | null, billingEmail: string | null, displayName: string | null, firstName: string | null, lastName: string | null, hasHadActiveSubscription: boolean | null, profilePicture: string | null, updatedAt: string | null, userName: string | null, accountTier: AccountTier | null, accountStatus: AccountStatus | null, subscriptionStatus: SubscriptionStatus | null } | null } | null };

export type UpdateCurrentUserMutationVariables = Exact<{
  data: UpdateCurrentUserInput;
}>;


export type UpdateCurrentUserMutation = { updateCurrentUser: { success: boolean | null, user: { id: string | null, email: string | null, billingEmail: string | null, displayName: string | null, firstName: string | null, lastName: string | null, hasHadActiveSubscription: boolean | null, profilePicture: string | null, updatedAt: string | null, userName: string | null, accountTier: AccountTier | null, accountStatus: AccountStatus | null, subscriptionStatus: SubscriptionStatus | null } | null } | null };


export const GetCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"idToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"billingEmail"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"hasHadActiveSubscription"}},{"kind":"Field","name":{"kind":"Name","value":"profilePicture"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"accountTier"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}}]}}]}}]}}]} as unknown as DocumentNode<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export const UpdateCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCurrentUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCurrentUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrentUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"billingEmail"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"hasHadActiveSubscription"}},{"kind":"Field","name":{"kind":"Name","value":"profilePicture"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"accountTier"}},{"kind":"Field","name":{"kind":"Name","value":"accountStatus"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptionStatus"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCurrentUserMutation, UpdateCurrentUserMutationVariables>;