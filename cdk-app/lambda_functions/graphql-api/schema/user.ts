import type PrismaTypes from "@repo/database/generated/pothos";
import {
  AccountStatus,
  AccountTier,
  SubscriptionStatus,
} from "@repo/database/generated/prisma/enums";
import { z } from "zod";
import { builder } from "./builder";
import { badUserInput, notFound } from "./errors";

type UserShape = PrismaTypes["User"]["Shape"];

const AccountTierEnum = builder.enumType(AccountTier, {
  name: "AccountTier",
});
const AccountStatusEnum = builder.enumType(AccountStatus, {
  name: "AccountStatus",
});
const SubscriptionStatusEnum = builder.enumType(SubscriptionStatus, {
  name: "SubscriptionStatus",
});

const UpdateCurrentUserSchema = z
  .object({
    billingEmail: z.string().trim().email().optional().nullable(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z
      .string()
      .optional()
      .nullable()
      .refine(
        (value) => value == null || value.trim().length >= 3,
        "Display name must be at least 3 characters",
      ),
    profilePicture: z.string().optional().nullable(),
  })
  .strict();

const UserProfile = builder.objectRef<UserShape>("UserProfile").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    displayName: t.exposeString("displayName", { nullable: true }),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    profilePicture: t.exposeString("profilePicture", { nullable: true }),
    userName: t.exposeString("userName", { nullable: true }),
  }),
});

const CurrentUser = builder.objectRef<UserShape>("CurrentUser").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    billingEmail: t.exposeString("billingEmail", { nullable: true }),
    displayName: t.exposeString("displayName", { nullable: true }),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    hasHadActiveSubscription: t.exposeBoolean("hasHadActiveSubscription"),
    profilePicture: t.exposeString("profilePicture", { nullable: true }),
    updatedAt: t.string({
      resolve: (user) => user.updatedAt.toISOString(),
    }),
    userName: t.exposeString("userName", { nullable: true }),
    accountTier: t.field({
      type: AccountTierEnum,
      resolve: (user) => user.accountTier,
    }),
    accountStatus: t.field({
      type: AccountStatusEnum,
      resolve: (user) => user.accountStatus,
    }),
    subscriptionStatus: t.field({
      type: SubscriptionStatusEnum,
      resolve: (user) => user.subscriptionStatus,
    }),
  }),
});

const CurrentUserPayload = builder
  .objectRef<{ user: UserShape; idToken: string }>("CurrentUserPayload")
  .implement({
    fields: (t) => ({
      user: t.field({
        type: CurrentUser,
        resolve: (payload) => payload.user,
      }),
      idToken: t.exposeString("idToken"),
    }),
  });

const UpdateCurrentUserPayload = builder
  .objectRef<{ success: boolean; user: UserShape }>("UpdateCurrentUserPayload")
  .implement({
    fields: (t) => ({
      success: t.exposeBoolean("success"),
      user: t.field({
        type: CurrentUser,
        resolve: (payload) => payload.user,
      }),
    }),
  });

const UpdateCurrentUserInput = builder.inputType("UpdateCurrentUserInput", {
  fields: (t) => ({
    billingEmail: t.string({ required: false }),
    firstName: t.string({ required: false }),
    lastName: t.string({ required: false }),
    displayName: t.string({ required: false }),
    profilePicture: t.string({ required: false }),
  }),
});

builder.queryField("currentUser", (t) =>
  t.field({
    type: CurrentUserPayload,
    resolve: async (_parent, _args, context) => {
      const user = await context.prisma.user.findUnique({
        where: {
          cognitoSub: context.session.payload.sub,
        },
      });

      if (!user) {
        throw notFound("User not found");
      }

      return {
        user,
        idToken: context.session.idToken,
      };
    },
  }),
);

builder.queryField("userById", (t) =>
  t.field({
    type: UserProfile,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, context) => {
      const user = await context.prisma.user.findUnique({
        where: {
          id: String(args.id),
        },
      });

      if (!user) {
        throw notFound("User not found");
      }

      return user;
    },
  }),
);

builder.mutationField("updateCurrentUser", (t) =>
  t.field({
    type: UpdateCurrentUserPayload,
    args: {
      data: t.arg({ type: UpdateCurrentUserInput, required: true }),
    },
    resolve: async (_parent, args, context) => {
      const parsedData = UpdateCurrentUserSchema.safeParse(args.data);

      if (!parsedData.success) {
        throw badUserInput("Invalid user update payload");
      }

      if (Object.keys(parsedData.data).length === 0) {
        throw badUserInput("No user fields to update");
      }

      try {
        const user = await context.prisma.user.update({
          where: {
            cognitoSub: context.session.payload.sub,
          },
          data: parsedData.data,
        });

        return {
          success: true,
          user,
        };
      } catch {
        throw notFound("User not found");
      }
    },
  }),
);
