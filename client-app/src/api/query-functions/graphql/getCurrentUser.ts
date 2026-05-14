import { graphql } from "#/api/generated";
import type { AccountTier, GetCurrentUserQuery } from "#/api/generated/graphql";
import { addProfilePictureCacheVersion } from "#/lib/profilePicture";
import { executeGraphQL } from "#/api/graphql/client";

type CurrentUserPayload = NonNullable<GetCurrentUserQuery["currentUser"]>;
type RawCurrentUser = NonNullable<CurrentUserPayload["user"]>;
export type CurrentUser = Omit<
  RawCurrentUser,
  "accountTier" | "hasHadActiveSubscription" | "updatedAt"
> & {
  accountTier: AccountTier;
  hasHadActiveSubscription: boolean;
  updatedAt: string;
};
export type GetCurrentUserResult = {
  currentUser: Omit<CurrentUserPayload, "user"> & {
    user: CurrentUser;
  };
};

const GetCurrentUserDocument = graphql(`
  query GetCurrentUser {
    currentUser {
      idToken
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

export function normalizeCurrentUser(user: RawCurrentUser): CurrentUser {
  const updatedAt = user.updatedAt ?? new Date().toISOString();

  return {
    ...user,
    accountTier: user.accountTier ?? "FREE",
    hasHadActiveSubscription: user.hasHadActiveSubscription ?? false,
    updatedAt,
    profilePicture: addProfilePictureCacheVersion(user.profilePicture, updatedAt),
  };
}
