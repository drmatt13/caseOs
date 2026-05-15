import type { AccountTier, GetCurrentUserQuery } from "#/api/generated/graphql";
import { addProfilePictureCacheVersion } from "#/lib/profilePicture";

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

export function normalizeCurrentUser(user: RawCurrentUser): CurrentUser {
  const updatedAt = user.updatedAt ?? new Date().toISOString();

  return {
    ...user,
    accountTier: user.accountTier ?? "FREE",
    hasHadActiveSubscription: user.hasHadActiveSubscription ?? false,
    updatedAt,
    profilePicture: addProfilePictureCacheVersion(
      user.profilePicture,
      updatedAt,
    ),
  };
}
