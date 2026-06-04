import { randomBytes } from "node:crypto";
import type PrismaTypes from "@repo/database/generated/pothos";
import {
  InvitationStatus,
  MembershipRole,
  MembershipStatus,
  WorkspaceStatus,
} from "@repo/database/generated/prisma/enums";
import { z } from "zod";
import type { GraphQLContext } from "../graphql-context";
import { builder } from "./builder";
import { badUserInput, forbidden, notFound } from "./errors";

type UserShape = PrismaTypes["User"]["Shape"];
type WorkspaceShape = PrismaTypes["Workspace"]["Shape"];
type WorkspaceMembershipShape = PrismaTypes["WorkspaceMembership"]["Shape"];
type WorkspaceInvitationShape = PrismaTypes["WorkspaceInvitation"]["Shape"];

const WorkspaceStatusEnum = builder.enumType(WorkspaceStatus, {
  name: "WorkspaceStatus",
});
const MembershipRoleEnum = builder.enumType(MembershipRole, {
  name: "MembershipRole",
});
const MembershipStatusEnum = builder.enumType(MembershipStatus, {
  name: "MembershipStatus",
});
const InvitationStatusEnum = builder.enumType(InvitationStatus, {
  name: "InvitationStatus",
});

const WorkspaceInviteInputSchema = z
  .object({
    email: z.string().trim().email().transform((email) => email.toLowerCase()),
    role: z.enum([
      MembershipRole.ADMIN,
      MembershipRole.CONTRIBUTOR,
      MembershipRole.READONLY,
    ]),
  })
  .strict();

const CreateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .nullable()
      .transform((value) => (value ? value : null)),
    invitations: z.array(WorkspaceInviteInputSchema).max(50).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const emails = new Set<string>();

    for (const invitation of value.invitations ?? []) {
      if (emails.has(invitation.email)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate invitation email",
          path: ["invitations"],
        });
      }

      emails.add(invitation.email);
    }
  });

const WorkspaceInvitationInput = builder.inputType(
  "CreateWorkspaceInvitationInput",
  {
    fields: (t) => ({
      email: t.string({ required: true }),
      role: t.field({ type: MembershipRoleEnum, required: true }),
    }),
  },
);

const CreateWorkspaceInput = builder.inputType("CreateWorkspaceInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    invitations: t.field({
      type: [WorkspaceInvitationInput],
      required: false,
    }),
  }),
});

const InviteWorkspaceMemberInput = builder.inputType(
  "InviteWorkspaceMemberInput",
  {
    fields: (t) => ({
      workspaceId: t.id({ required: true }),
      email: t.string({ required: true }),
      role: t.field({ type: MembershipRoleEnum, required: true }),
    }),
  },
);

const UserSummary = builder.objectRef<UserShape>("WorkspaceUser").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    displayName: t.exposeString("displayName", { nullable: true }),
    firstName: t.exposeString("firstName"),
    lastName: t.exposeString("lastName"),
    profilePicture: t.exposeString("profilePicture", { nullable: true }),
  }),
});

const WorkspaceMembership = builder
  .objectRef<WorkspaceMembershipShape>("WorkspaceMembership")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      workspaceId: t.exposeID("workspaceId"),
      userId: t.exposeID("userId"),
      role: t.field({
        type: MembershipRoleEnum,
        resolve: (membership) => membership.role,
      }),
      membershipStatus: t.field({
        type: MembershipStatusEnum,
        resolve: (membership) => membership.membershipStatus,
      }),
      joinedAt: t.string({
        resolve: (membership) => membership.joinedAt.toISOString(),
      }),
      updatedAt: t.string({
        resolve: (membership) => membership.updatedAt.toISOString(),
      }),
      user: t.field({
        type: UserSummary,
        resolve: async (membership, _args, context) => {
          const user = await context.prisma.user.findUnique({
            where: {
              id: membership.userId,
            },
          });

          if (!user) {
            throw notFound("Workspace member user not found");
          }

          return user;
        },
      }),
    }),
  });

const WorkspaceInvitation = builder
  .objectRef<WorkspaceInvitationShape>("WorkspaceInvitation")
  .implement({
    fields: (t) => ({
      id: t.exposeID("id"),
      workspaceId: t.exposeID("workspaceId"),
      invitedByUserId: t.exposeID("invitedByUserId", { nullable: true }),
      email: t.exposeString("email"),
      role: t.field({
        type: MembershipRoleEnum,
        resolve: (invitation) => invitation.role,
      }),
      status: t.field({
        type: InvitationStatusEnum,
        resolve: (invitation) => invitation.status,
      }),
      expiresAt: t.string({
        resolve: (invitation) => invitation.expiresAt.toISOString(),
      }),
      createdAt: t.string({
        resolve: (invitation) => invitation.createdAt.toISOString(),
      }),
      updatedAt: t.string({
        resolve: (invitation) => invitation.updatedAt.toISOString(),
      }),
      invitedBy: t.field({
        type: UserSummary,
        nullable: true,
        resolve: async (invitation, _args, context) => {
          if (!invitation.invitedByUserId) {
            return null;
          }

          return context.prisma.user.findUnique({
            where: {
              id: invitation.invitedByUserId,
            },
          });
        },
      }),
    }),
  });

const Workspace = builder.objectRef<WorkspaceShape>("Workspace").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    ownerUserId: t.exposeID("ownerUserId"),
    status: t.field({
      type: WorkspaceStatusEnum,
      resolve: (workspace) => workspace.status,
    }),
    createdAt: t.string({
      resolve: (workspace) => workspace.createdAt.toISOString(),
    }),
    updatedAt: t.string({
      resolve: (workspace) => workspace.updatedAt.toISOString(),
    }),
    currentUserMembership: t.field({
      type: WorkspaceMembership,
      resolve: async (workspace, _args, context) => {
        const membership = await getCurrentUserWorkspaceMembership(
          context,
          workspace.id,
        );

        if (!membership) {
          throw forbidden("You are not a member of this workspace");
        }

        return membership;
      },
    }),
    memberships: t.field({
      type: [WorkspaceMembership],
      resolve: async (workspace, _args, context) => {
        await requireCurrentUserWorkspaceMembership(context, workspace.id);

        return context.prisma.workspaceMembership.findMany({
          where: {
            workspaceId: workspace.id,
            membershipStatus: MembershipStatus.ACTIVE,
          },
          orderBy: {
            joinedAt: "asc",
          },
        });
      },
    }),
    invitations: t.field({
      type: [WorkspaceInvitation],
      resolve: async (workspace, _args, context) => {
        await requireCurrentUserWorkspaceMembership(context, workspace.id);

        return context.prisma.workspaceInvitation.findMany({
          where: {
            workspaceId: workspace.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      },
    }),
  }),
});

const CreateWorkspacePayload = builder
  .objectRef<{ success: boolean; workspace: WorkspaceShape }>(
    "CreateWorkspacePayload",
  )
  .implement({
    fields: (t) => ({
      success: t.exposeBoolean("success"),
      workspace: t.field({
        type: Workspace,
        resolve: (payload) => payload.workspace,
      }),
    }),
  });

const InviteWorkspaceMemberPayload = builder
  .objectRef<{ success: boolean; invitation: WorkspaceInvitationShape }>(
    "InviteWorkspaceMemberPayload",
  )
  .implement({
    fields: (t) => ({
      success: t.exposeBoolean("success"),
      invitation: t.field({
        type: WorkspaceInvitation,
        resolve: (payload) => payload.invitation,
      }),
    }),
  });

async function getCurrentUser(context: GraphQLContext): Promise<UserShape> {
  const user = await context.prisma.user.findUnique({
    where: {
      cognitoSub: context.session.payload.sub,
    },
  });

  if (!user) {
    throw notFound("User not found");
  }

  return user;
}

async function getCurrentUserWorkspaceMembership(
  context: GraphQLContext,
  workspaceId: string,
): Promise<WorkspaceMembershipShape | null> {
  const user = await getCurrentUser(context);

  return context.prisma.workspaceMembership.findFirst({
    where: {
      workspaceId,
      userId: user.id,
      membershipStatus: MembershipStatus.ACTIVE,
    },
  });
}

async function requireCurrentUserWorkspaceMembership(
  context: GraphQLContext,
  workspaceId: string,
): Promise<WorkspaceMembershipShape> {
  const membership = await getCurrentUserWorkspaceMembership(
    context,
    workspaceId,
  );

  if (!membership) {
    throw forbidden("You are not a member of this workspace");
  }

  return membership;
}

async function requireCurrentUserWorkspaceAdminMembership(
  context: GraphQLContext,
  workspaceId: string,
): Promise<WorkspaceMembershipShape> {
  const membership = await requireCurrentUserWorkspaceMembership(
    context,
    workspaceId,
  );

  if (
    membership.role !== MembershipRole.OWNER &&
    membership.role !== MembershipRole.ADMIN
  ) {
    throw forbidden("You do not have permission to invite workspace members");
  }

  return membership;
}

function createInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

builder.queryField("workspaces", (t) =>
  t.field({
    type: [Workspace],
    resolve: async (_parent, _args, context) => {
      const user = await getCurrentUser(context);

      return context.prisma.workspace.findMany({
        where: {
          memberships: {
            some: {
              userId: user.id,
              membershipStatus: MembershipStatus.ACTIVE,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    },
  }),
);

builder.queryField("workspace", (t) =>
  t.field({
    type: Workspace,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, context) => {
      const user = await getCurrentUser(context);

      return context.prisma.workspace.findFirst({
        where: {
          id: String(args.id),
          memberships: {
            some: {
              userId: user.id,
              membershipStatus: MembershipStatus.ACTIVE,
            },
          },
        },
      });
    },
  }),
);

builder.queryField("workspaceInvitations", (t) =>
  t.field({
    type: [WorkspaceInvitation],
    args: {
      workspaceId: t.arg.id({ required: false }),
      status: t.arg({ type: InvitationStatusEnum, required: false }),
    },
    resolve: async (_parent, args, context) => {
      const user = await getCurrentUser(context);
      const workspaceId = args.workspaceId ? String(args.workspaceId) : null;

      if (workspaceId) {
        await requireCurrentUserWorkspaceMembership(context, workspaceId);
      }

      return context.prisma.workspaceInvitation.findMany({
        where: {
          workspaceId: workspaceId ?? undefined,
          status: args.status ?? undefined,
          workspace: {
            memberships: {
              some: {
                userId: user.id,
                membershipStatus: MembershipStatus.ACTIVE,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  }),
);

builder.mutationField("createWorkspace", (t) =>
  t.field({
    type: CreateWorkspacePayload,
    args: {
      data: t.arg({ type: CreateWorkspaceInput, required: true }),
    },
    resolve: async (_parent, args, context) => {
      const parsedData = CreateWorkspaceSchema.safeParse(args.data);

      if (!parsedData.success) {
        throw badUserInput("Invalid workspace creation payload");
      }

      const user = await getCurrentUser(context);
      const invitations = parsedData.data.invitations ?? [];
      const creatorEmail = user.email.toLowerCase();

      if (invitations.some((invitation) => invitation.email === creatorEmail)) {
        throw badUserInput("You cannot invite yourself to a workspace");
      }

      const workspace = await context.prisma.$transaction(async (tx) => {
        const createdWorkspace = await tx.workspace.create({
          data: {
            name: parsedData.data.name,
            description: parsedData.data.description,
            ownerUserId: user.id,
            memberships: {
              create: {
                userId: user.id,
                role: MembershipRole.OWNER,
                membershipStatus: MembershipStatus.ACTIVE,
              },
            },
          },
        });

        if (invitations.length > 0) {
          await tx.workspaceInvitation.createMany({
            data: invitations.map((invitation) => ({
              workspaceId: createdWorkspace.id,
              invitedByUserId: user.id,
              email: invitation.email,
              role: invitation.role,
              invitationToken: createInvitationToken(),
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            })),
          });
        }

        return createdWorkspace;
      });

      return {
        success: true,
        workspace,
      };
    },
  }),
);

builder.mutationField("inviteWorkspaceMember", (t) =>
  t.field({
    type: InviteWorkspaceMemberPayload,
    args: {
      data: t.arg({ type: InviteWorkspaceMemberInput, required: true }),
    },
    resolve: async (_parent, args, context) => {
      const parsedData = WorkspaceInviteInputSchema.extend({
        workspaceId: z.string().uuid(),
      }).safeParse({
        workspaceId: String(args.data.workspaceId),
        email: args.data.email,
        role: args.data.role,
      });

      if (!parsedData.success) {
        throw badUserInput("Invalid workspace invitation payload");
      }

      const user = await getCurrentUser(context);
      await requireCurrentUserWorkspaceAdminMembership(
        context,
        parsedData.data.workspaceId,
      );

      if (parsedData.data.email === user.email.toLowerCase()) {
        throw badUserInput("You cannot invite yourself to a workspace");
      }

      const existingMember = await context.prisma.workspaceMembership.findFirst({
        where: {
          workspaceId: parsedData.data.workspaceId,
          user: {
            email: parsedData.data.email,
          },
          membershipStatus: MembershipStatus.ACTIVE,
        },
      });

      if (existingMember) {
        throw badUserInput("This user is already a workspace member");
      }

      const existingPendingInvitation =
        await context.prisma.workspaceInvitation.findFirst({
          where: {
            workspaceId: parsedData.data.workspaceId,
            email: parsedData.data.email,
            status: InvitationStatus.PENDING,
          },
        });

      if (existingPendingInvitation) {
        throw badUserInput("This email already has a pending invitation");
      }

      const invitation = await context.prisma.workspaceInvitation.create({
        data: {
          workspaceId: parsedData.data.workspaceId,
          invitedByUserId: user.id,
          email: parsedData.data.email,
          role: parsedData.data.role,
          invitationToken: createInvitationToken(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      return {
        success: true,
        invitation,
      };
    },
  }),
);
