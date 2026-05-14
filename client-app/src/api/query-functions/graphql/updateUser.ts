import { graphql } from "#/api/generated";
import type {
  UpdateCurrentUserMutation,
  UpdateCurrentUserMutationVariables,
} from "#/api/generated/graphql";
import { executeGraphQL } from "#/api/graphql/client";
import { normalizeCurrentUser, type CurrentUser } from "./getCurrentUser";

type UpdateCurrentUserPayload = NonNullable<
  UpdateCurrentUserMutation["updateCurrentUser"]
>;

export type UpdateUserPayload = UpdateCurrentUserMutationVariables["data"];
export type UpdateUserResult = Omit<UpdateCurrentUserPayload, "user"> & {
  success: true;
  user: CurrentUser;
};

const UpdateCurrentUserDocument = graphql(`
  mutation UpdateCurrentUser($data: UpdateCurrentUserInput!) {
    updateCurrentUser(data: $data) {
      success
      user {
        id
        email
        billingEmail
        displayName
        firstName
        lastName
        hasHadActiveSubscription
        profilePicture
        updatedAt
        userName
        accountTier
        accountStatus
        subscriptionStatus
      }
    }
  }
`);

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
