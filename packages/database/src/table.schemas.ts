import { z } from "zod";

// IMPORTANT:
// z.nativeEnum(...) needs runtime enum values, so these must be normal imports.
import {
  Prisma,
  AccountTier,
  AccountStatus,
  WorkspaceStatus,
  MembershipRole,
  MembershipStatus,
  InvitationRole,
  InvitationStatus,
  CaseStatus,
  SubscriptionStatus,
  BillingInterval,
  ActorType,
  DocumentStatus,
  DocumentCategory,
  DateConfidence,
  CaseRecordType,
  RecordStatus,
  RecordVisibility,
  CaseViewType,
  ManifestKind,
  FileMimeFamily,
} from "./generated/prisma/browser";

// model types can stay type-only
import type {
  User,
  Workspace,
  WorkspaceMembership,
  WorkspaceInvitation,
  Case,
  CaseDocumentIndex,
  CaseRecordIndex,
  CaseViewIndex,
  CaseStateManifest,
  LlmUsageEvent,
  WorkspaceUsageMonthly,
  UserUsageMonthly,
  StripeEventLog,
  AccountTierLimit,
} from "./generated/prisma/browser";

// ---------- shared helpers ----------

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().trim().toLowerCase().email();
export const nonEmptyStringSchema = z.string().trim().min(1);
export const optionalNullableStringSchema = z
  .string()
  .trim()
  .nullable()
  .optional();

export const jsonSchema: z.ZodType<Prisma.JsonValue> = z.lazy(
  () =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(jsonSchema),
      z.record(jsonSchema),
    ]) as z.ZodType<Prisma.JsonValue>,
);

type PrismaDecimal = InstanceType<typeof Prisma.Decimal>;

export const prismaDecimalSchema = z.custom<PrismaDecimal>(
  (value): value is PrismaDecimal => {
    if (value == null || typeof value !== "object") return false;
    const candidate = value as { toString?: unknown; toNumber?: unknown };
    return (
      typeof candidate.toString === "function" &&
      typeof candidate.toNumber === "function"
    );
  },
);

export const dateSchema = z.coerce.date();

export const bigintLikeSchema = z.union([
  z.bigint(),
  z.number().int(),
  z.string().regex(/^-?\d+$/),
]);

export const decimalLikeSchema = z.union([
  z.number(),
  z.string().regex(/^-?\d+(\.\d+)?$/),
]);

// ---------- enum schemas ----------

export const accountTierSchema = z.nativeEnum(AccountTier);
export const accountStatusSchema = z.nativeEnum(AccountStatus);
export const workspaceStatusSchema = z.nativeEnum(WorkspaceStatus);
export const membershipRoleSchema = z.nativeEnum(MembershipRole);
export const membershipStatusSchema = z.nativeEnum(MembershipStatus);
export const invitationRoleSchema = z.nativeEnum(InvitationRole);
export const invitationStatusSchema = z.nativeEnum(InvitationStatus);
export const caseStatusSchema = z.nativeEnum(CaseStatus);
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);
export const billingIntervalSchema = z.nativeEnum(BillingInterval);
export const actorTypeSchema = z.nativeEnum(ActorType);
export const documentStatusSchema = z.nativeEnum(DocumentStatus);
export const documentCategorySchema = z.nativeEnum(DocumentCategory);
export const dateConfidenceSchema = z.nativeEnum(DateConfidence);
export const caseRecordTypeSchema = z.nativeEnum(CaseRecordType);
export const recordStatusSchema = z.nativeEnum(RecordStatus);
export const recordVisibilitySchema = z.nativeEnum(RecordVisibility);
export const caseViewTypeSchema = z.nativeEnum(CaseViewType);
export const manifestKindSchema = z.nativeEnum(ManifestKind);
export const fileMimeFamilySchema = z.nativeEnum(FileMimeFamily);

// ---------- table row schemas ----------
// These are shaped for data coming out of Prisma / your DB layer.

export const userSchema: z.ZodType<User> = z.object({
  id: uuidSchema,
  cognitoSub: nonEmptyStringSchema,
  email: emailSchema,
  billingEmail: z.string().trim().email().nullable(),
  displayName: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profilePicture: z.string().nullable(),
  userName: z.string().nullable(),
  isPlatformAdmin: z.boolean(),
  accountTier: accountTierSchema,
  accountStatus: accountStatusSchema,
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  stripePriceId: z.string().nullable(),
  stripeProductId: z.string().nullable(),
  stripeDefaultPaymentMethodId: z.string().nullable(),
  subscriptionStatus: subscriptionStatusSchema,
  billingInterval: billingIntervalSchema.nullable(),
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  trialStartsAt: z.date().nullable(),
  trialEndsAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const workspaceSchema: z.ZodType<Workspace> = z.object({
  id: uuidSchema,
  name: nonEmptyStringSchema,
  ownerUserId: uuidSchema,
  storageBucket: nonEmptyStringSchema,
  storagePrefix: nonEmptyStringSchema,
  status: workspaceStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const workspaceMembershipSchema: z.ZodType<WorkspaceMembership> =
  z.object({
    id: uuidSchema,
    workspaceId: uuidSchema,
    userId: uuidSchema,
    role: membershipRoleSchema,
    membershipStatus: membershipStatusSchema,
    joinedAt: z.date(),
  });

export const workspaceInvitationSchema: z.ZodType<WorkspaceInvitation> =
  z.object({
    id: uuidSchema,
    workspaceId: uuidSchema,
    email: emailSchema,
    role: invitationRoleSchema,
    invitationToken: nonEmptyStringSchema,
    status: invitationStatusSchema,
    expiresAt: z.date(),
    createdAt: z.date(),
  });

export const caseSchema: z.ZodType<Case> = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  createdByUserId: uuidSchema,
  title: nonEmptyStringSchema,
  description: z.string().nullable(),
  status: caseStatusSchema,
  intake: jsonSchema.nullable(),
  currentManifestNumber: z.number().int().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const caseDocumentIndexSchema: z.ZodType<CaseDocumentIndex> = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  caseId: uuidSchema,
  uploadedByUserId: z.string().uuid().nullable(),
  category: documentCategorySchema,
  fileName: nonEmptyStringSchema,
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  mimeType: z.string().nullable(),
  mimeFamily: fileMimeFamilySchema.nullable(),
  fileSizeBytes: z.bigint().nullable(),
  checksumSha256: z.string().nullable(),
  eTag: z.string().nullable(),
  externalFileId: z.string().nullable(),
  userDescription: z.string().nullable(),
  whyThisMatters: z.string().nullable(),
  llmSummary: z.string().nullable(),
  status: documentStatusSchema,
  createdBy: actorTypeSchema,
  version: z.number().int(),
  relevantDate: z.date().nullable(),
  dateConfidence: dateConfidenceSchema.nullable(),
  referencedBy: jsonSchema.nullable(),
  searchText: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const caseRecordIndexSchema: z.ZodType<CaseRecordIndex> = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  caseId: uuidSchema,
  manifestId: z.string().uuid().nullable(),
  recordType: caseRecordTypeSchema,
  recordCategory: z.string().nullable(),
  title: z.string().nullable(),
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  mimeType: z.string().nullable(),
  fileSizeBytes: z.bigint().nullable(),
  checksumSha256: z.string().nullable(),
  eTag: z.string().nullable(),
  version: z.number().int(),
  confidence: z.number().nullable(),
  createdBy: actorTypeSchema,
  createdByUserId: z.string().uuid().nullable(),
  recordStatus: recordStatusSchema.nullable(),
  recordVisibility: recordVisibilitySchema,
  typedMeta: jsonSchema.nullable(),
  references: jsonSchema.nullable(),
  referencedBy: jsonSchema.nullable(),
  supersedes: jsonSchema.nullable(),
  supersededBy: jsonSchema.nullable(),
  searchText: z.string().nullable(),
  eventDate: z.date().nullable(),
  dueDate: z.date().nullable(),
  dateConfidence: dateConfidenceSchema.nullable(),
  lastUpdatedAt: z.date(),
  lastUpdatedByUserId: z.string().uuid().nullable(),
  createdAt: z.date(),
});

export const caseViewIndexSchema: z.ZodType<CaseViewIndex> = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  caseId: uuidSchema,
  manifestId: z.string().uuid().nullable(),
  viewType: caseViewTypeSchema,
  title: z.string().nullable(),
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  mimeType: z.string().nullable(),
  mimeFamily: fileMimeFamilySchema.nullable(),
  fileSizeBytes: z.bigint().nullable(),
  checksumSha256: z.string().nullable(),
  eTag: z.string().nullable(),
  version: z.number().int(),
  sourceHash: z.string().nullable(),
  searchText: z.string().nullable(),
  generatedBy: z.string().nullable(),
  createdBy: actorTypeSchema,
  createdByUserId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const caseStateManifestSchema: z.ZodType<CaseStateManifest> = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  caseId: z.string().uuid().nullable(),
  createdByUserId: z.string().uuid().nullable(),
  manifestKind: manifestKindSchema,
  manifestNumber: z.number().int(),
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  checksumSha256: z.string().nullable(),
  sourceHash: z.string().nullable(),
  isCurrent: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const llmUsageEventSchema: z.ZodType<LlmUsageEvent> = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  caseId: z.string().uuid().nullable(),
  actorUserId: z.string().uuid().nullable(),
  billedToUserId: uuidSchema,
  provider: nonEmptyStringSchema,
  model: nonEmptyStringSchema,
  operation: z.string().nullable(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  totalTokens: z.number().int(),
  estimatedCostUsd: prismaDecimalSchema.nullable(),
  requestFiles: jsonSchema.nullable(),
  metadata: jsonSchema.nullable(),
  createdAt: z.date(),
});

export const workspaceUsageMonthlySchema: z.ZodType<WorkspaceUsageMonthly> =
  z.object({
    id: uuidSchema,
    workspaceId: uuidSchema,
    billedToUserId: uuidSchema,
    usageMonth: z.date(),
    totalInputTokens: z.bigint(),
    totalOutputTokens: z.bigint(),
    totalTokens: z.bigint(),
    totalEstimatedCostUsd: prismaDecimalSchema,
  });

export const userUsageMonthlySchema: z.ZodType<UserUsageMonthly> = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  usageMonth: z.date(),
  totalInputTokens: z.bigint(),
  totalOutputTokens: z.bigint(),
  totalTokens: z.bigint(),
  totalEstimatedCostUsd: prismaDecimalSchema,
});

export const stripeEventLogSchema: z.ZodType<StripeEventLog> = z.object({
  id: uuidSchema,
  stripeEventId: nonEmptyStringSchema,
  stripeEventType: nonEmptyStringSchema,
  userId: z.string().uuid().nullable(),
  workspaceId: z.string().uuid().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  processed: z.boolean(),
  processedAt: z.date().nullable(),
  eventCreatedAt: z.date().nullable(),
  receivedAt: z.date(),
  payload: jsonSchema,
});

export const accountTierLimitSchema: z.ZodType<AccountTierLimit> = z.object({
  tier: accountTierSchema,
  maxWorkspacesOwned: z.number().int(),
  maxMembersPerWorkspace: z.number().int(),
  maxCasesPerWorkspace: z.number().int(),
  monthlyTokenLimit: z.bigint(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ---------- input / transport schemas ----------
// These are more forgiving for request payloads.

export const createWorkspaceSchema = z.object({
  name: nonEmptyStringSchema.max(200),
});

export const inviteToWorkspaceSchema = z.object({
  workspaceId: uuidSchema,
  email: emailSchema,
  role: invitationRoleSchema.default(InvitationRole.MEMBER),
});

export const createCaseSchema = z.object({
  workspaceId: uuidSchema,
  title: nonEmptyStringSchema.max(300),
  description: z.string().trim().max(10_000).optional().nullable(),
  intake: jsonSchema.optional().nullable(),
});

export const createCaseDocumentIndexSchema = z.object({
  workspaceId: uuidSchema,
  caseId: uuidSchema,
  uploadedByUserId: uuidSchema.optional().nullable(),
  category: documentCategorySchema,
  fileName: nonEmptyStringSchema,
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  mimeType: z.string().optional().nullable(),
  mimeFamily: fileMimeFamilySchema.optional().nullable(),
  fileSizeBytes: bigintLikeSchema.optional().nullable(),
  checksumSha256: z.string().optional().nullable(),
  eTag: z.string().optional().nullable(),
  externalFileId: z.string().optional().nullable(),
  userDescription: z.string().optional().nullable(),
  whyThisMatters: z.string().optional().nullable(),
  llmSummary: z.string().optional().nullable(),
  status: documentStatusSchema.optional().default(DocumentStatus.UPLOADED),
  createdBy: actorTypeSchema.optional().default(ActorType.HUMAN),
  version: z.number().int().optional().default(1),
  relevantDate: dateSchema.optional().nullable(),
  dateConfidence: dateConfidenceSchema.optional().nullable(),
  referencedBy: jsonSchema.optional().nullable(),
  searchText: z.string().optional().nullable(),
});

export const createCaseRecordIndexSchema = z.object({
  workspaceId: uuidSchema,
  caseId: uuidSchema,
  manifestId: uuidSchema.optional().nullable(),
  recordType: caseRecordTypeSchema,
  recordCategory: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  mimeType: z.string().optional().nullable(),
  fileSizeBytes: bigintLikeSchema.optional().nullable(),
  checksumSha256: z.string().optional().nullable(),
  eTag: z.string().optional().nullable(),
  version: z.number().int().optional().default(1),
  confidence: z.number().min(0).max(1).optional().nullable(),
  createdBy: actorTypeSchema.optional().default(ActorType.HUMAN),
  createdByUserId: uuidSchema.optional().nullable(),
  recordStatus: recordStatusSchema.optional().nullable(),
  recordVisibility: recordVisibilitySchema
    .optional()
    .default(RecordVisibility.VISIBLE),
  typedMeta: jsonSchema.optional().nullable(),
  references: jsonSchema.optional().nullable(),
  referencedBy: jsonSchema.optional().nullable(),
  supersedes: jsonSchema.optional().nullable(),
  supersededBy: jsonSchema.optional().nullable(),
  searchText: z.string().optional().nullable(),
  eventDate: dateSchema.optional().nullable(),
  dueDate: dateSchema.optional().nullable(),
  dateConfidence: dateConfidenceSchema.optional().nullable(),
  lastUpdatedAt: dateSchema.optional(),
  lastUpdatedByUserId: uuidSchema.optional().nullable(),
});

export const createCaseViewIndexSchema = z.object({
  workspaceId: uuidSchema,
  caseId: uuidSchema,
  manifestId: uuidSchema.optional().nullable(),
  viewType: caseViewTypeSchema,
  title: z.string().optional().nullable(),
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  mimeType: z.string().optional().nullable(),
  mimeFamily: fileMimeFamilySchema.optional().nullable(),
  fileSizeBytes: bigintLikeSchema.optional().nullable(),
  checksumSha256: z.string().optional().nullable(),
  eTag: z.string().optional().nullable(),
  version: z.number().int().optional().default(1),
  sourceHash: z.string().optional().nullable(),
  searchText: z.string().optional().nullable(),
  generatedBy: z.string().optional().nullable(),
  createdBy: actorTypeSchema.optional().default(ActorType.AGENT),
  createdByUserId: uuidSchema.optional().nullable(),
});

export const createCaseStateManifestSchema = z.object({
  workspaceId: uuidSchema,
  caseId: uuidSchema.optional().nullable(),
  createdByUserId: uuidSchema.optional().nullable(),
  manifestKind: manifestKindSchema,
  manifestNumber: z.number().int().nonnegative(),
  storageBucket: nonEmptyStringSchema,
  storageKey: nonEmptyStringSchema,
  checksumSha256: z.string().optional().nullable(),
  sourceHash: z.string().optional().nullable(),
  isCurrent: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

export const createLlmUsageEventSchema = z.object({
  workspaceId: uuidSchema,
  caseId: uuidSchema.optional().nullable(),
  actorUserId: uuidSchema.optional().nullable(),
  billedToUserId: uuidSchema,
  provider: nonEmptyStringSchema,
  model: nonEmptyStringSchema,
  operation: z.string().optional().nullable(),
  inputTokens: z.number().int().nonnegative().default(0),
  outputTokens: z.number().int().nonnegative().default(0),
  totalTokens: z.number().int().nonnegative().default(0),
  estimatedCostUsd: decimalLikeSchema.optional().nullable(),
  requestFiles: jsonSchema.optional().nullable(),
  metadata: jsonSchema.optional().nullable(),
});

// ---------- patch/update schemas ----------

export const updateUserSchema = z.object({
  billingEmail: z.string().trim().email().optional().nullable(),
  displayName: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  profilePicture: z.string().optional().nullable(),
  userName: z.string().optional().nullable(),
  accountTier: accountTierSchema.optional(),
  accountStatus: accountStatusSchema.optional(),
  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
  stripeDefaultPaymentMethodId: z.string().optional().nullable(),
  subscriptionStatus: subscriptionStatusSchema.optional(),
  billingInterval: billingIntervalSchema.optional().nullable(),
  cancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodStart: dateSchema.optional().nullable(),
  currentPeriodEnd: dateSchema.optional().nullable(),
  trialStartsAt: dateSchema.optional().nullable(),
  trialEndsAt: dateSchema.optional().nullable(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  status: workspaceStatusSchema.optional(),
  storageBucket: z.string().trim().min(1).optional(),
  storagePrefix: z.string().trim().min(1).optional(),
});

export const updateCaseSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(10_000).optional().nullable(),
  status: caseStatusSchema.optional(),
  intake: jsonSchema.optional().nullable(),
  currentManifestNumber: z.number().int().optional().nullable(),
});

// ---------- array schemas ----------

export const usersSchema = z.array(userSchema);
export const workspacesSchema = z.array(workspaceSchema);
export const workspaceMembershipsSchema = z.array(workspaceMembershipSchema);
export const workspaceInvitationsSchema = z.array(workspaceInvitationSchema);
export const casesSchema = z.array(caseSchema);
export const caseDocumentIndexesSchema = z.array(caseDocumentIndexSchema);
export const caseRecordIndexesSchema = z.array(caseRecordIndexSchema);
export const caseViewIndexesSchema = z.array(caseViewIndexSchema);
export const caseStateManifestsSchema = z.array(caseStateManifestSchema);
export const llmUsageEventsSchema = z.array(llmUsageEventSchema);
export const workspaceUsageMonthlyRowsSchema = z.array(
  workspaceUsageMonthlySchema,
);
export const userUsageMonthlyRowsSchema = z.array(userUsageMonthlySchema);
export const stripeEventLogsSchema = z.array(stripeEventLogSchema);
export const accountTierLimitsSchema = z.array(accountTierLimitSchema);

// ---------- inferred types from zod ----------

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteToWorkspaceInput = z.infer<typeof inviteToWorkspaceSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateCaseDocumentIndexInput = z.infer<
  typeof createCaseDocumentIndexSchema
>;
export type CreateCaseRecordIndexInput = z.infer<
  typeof createCaseRecordIndexSchema
>;
export type CreateCaseViewIndexInput = z.infer<
  typeof createCaseViewIndexSchema
>;
export type CreateCaseStateManifestInput = z.infer<
  typeof createCaseStateManifestSchema
>;
export type CreateLlmUsageEventInput = z.infer<
  typeof createLlmUsageEventSchema
>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
