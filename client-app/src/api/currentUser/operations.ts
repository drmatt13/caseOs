import { graphql } from "#/api/generated";
import type {
  UpdateCurrentUserMutation,
  UpdateCurrentUserMutationVariables,
} from "#/api/generated/graphql";
import { executeGraphQL } from "#/api/graphql/client";
import {
  normalizeCurrentUser,
  type CurrentUser,
  type GetCurrentUserResult,
} from "./model";

type UpdateCurrentUserPayload = NonNullable<
  UpdateCurrentUserMutation["updateCurrentUser"]
>;

export type UpdateUserPayload = UpdateCurrentUserMutationVariables["data"];
export type UpdateUserResult = Omit<UpdateCurrentUserPayload, "user"> & {
  success: true;
  user: CurrentUser;
};

// Typed GraphQL documents for this feature's operations.
const GetCurrentUserDocument = graphql(`
  query GetCurrentUser {
    currentUser {
      idToken
      user {
        id
        email
        billingEmail
        firstName
        lastName
        hasHadActiveSubscription
        profilePicture
        updatedAt
        accountTier
        accountStatus
        subscriptionStatus
      }
    }
  }
`);

const UpdateCurrentUserDocument = graphql(`
  mutation UpdateCurrentUser($data: UpdateCurrentUserInput!) {
    updateCurrentUser(data: $data) {
      success
      user {
        id
        email
        billingEmail
        firstName
        lastName
        hasHadActiveSubscription
        profilePicture
        updatedAt
        accountTier
        accountStatus
        subscriptionStatus
      }
    }
  }
`);

// API operations consumed by hooks and other feature callers.
export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  const data = await executeGraphQL(GetCurrentUserDocument);

  if (!data.currentUser?.user) {
    throw new Error("Current user was not returned");
  }

  return {
    ...data,
    currentUser: {
      ...data.currentUser,
      user: normalizeCurrentUser(data.currentUser.user),
    },
  };
}

export async function updateUser(
  payload: UpdateUserPayload,
): Promise<UpdateUserResult> {
  const data = await executeGraphQL(UpdateCurrentUserDocument, {
    data: payload,
  });

  if (!data.updateCurrentUser?.success || !data.updateCurrentUser.user) {
    throw new Error("Current user was not updated");
  }

  return {
    ...data.updateCurrentUser,
    success: true,
    user: normalizeCurrentUser(data.updateCurrentUser.user),
  };
}
