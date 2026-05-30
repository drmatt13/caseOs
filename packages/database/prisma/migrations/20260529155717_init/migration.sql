-- CreateEnum
CREATE TYPE "AccountTier" AS ENUM ('free', 'trial', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('active', 'archived', 'suspended');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "InvitationRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('open', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'trialing', 'active', 'past_due', 'unpaid', 'cancelled', 'incomplete', 'incomplete_expired');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('human', 'agent');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('uploaded', 'processed', 'error');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('evidence', 'research', 'client_statement', 'witness_statement', 'transcript', 'other');

-- CreateEnum
CREATE TYPE "DateConfidence" AS ENUM ('exact', 'approximate', 'unknown');

-- CreateEnum
CREATE TYPE "CaseRecordType" AS ENUM ('arguments', 'case_notes', 'facts', 'issues', 'legal_precedent', 'objectives', 'posture', 'tasks', 'testimony', 'timeline');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('proposed', 'accepted', 'rejected', 'supersession_pending', 'superseded');

-- CreateEnum
CREATE TYPE "RecordParty" AS ENUM ('plaintiff', 'defense');

-- CreateEnum
CREATE TYPE "RecordVisibility" AS ENUM ('hidden', 'visible');

-- CreateEnum
CREATE TYPE "CaseViewType" AS ENUM ('arguments', 'case_notes', 'facts', 'issues', 'legal_precedent', 'objectives', 'posture', 'tasks', 'testimony', 'timeline', 'case_agent', 'case_summary', 'documents_index');

-- CreateEnum
CREATE TYPE "ManifestKind" AS ENUM ('workspace_state', 'case_state', 'snapshot');

-- CreateEnum
CREATE TYPE "FileMimeFamily" AS ENUM ('json', 'markdown', 'text', 'pdf', 'image', 'audio', 'video', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "cognito_sub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "billing_email" TEXT,
    "display_name" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profile_picture" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "account_tier" "AccountTier" NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_default_payment_method_id" TEXT,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "stripe_price_id" TEXT,
    "stripe_product_id" TEXT,
    "stripe_subscription_id" TEXT,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
    "has_had_active_subscription" BOOLEAN NOT NULL DEFAULT false,
    "user_name" TEXT,
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'active',
    "billing_interval" "BillingInterval",
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "trial_starts_at" TIMESTAMPTZ(6),
    "trial_ends_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "storage_prefix" TEXT NOT NULL,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "storage_bucket" TEXT NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_memberships" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "membership_status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invitations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "InvitationRole" NOT NULL DEFAULT 'member',
    "invitation_token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'open',
    "intake" JSONB,
    "current_manifest_number" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_document_indexes" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "uploaded_by_user_id" UUID,
    "category" "DocumentCategory" NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "mime_family" "FileMimeFamily",
    "file_size_bytes" BIGINT,
    "checksum_sha256" TEXT,
    "etag" TEXT,
    "external_file_id" TEXT,
    "user_description" TEXT,
    "why_this_matters" TEXT,
    "llm_summary" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'uploaded',
    "created_by" "ActorType" NOT NULL DEFAULT 'human',
    "version" INTEGER NOT NULL DEFAULT 1,
    "relevant_date" TIMESTAMPTZ(6),
    "date_confidence" "DateConfidence",
    "referenced_by" JSONB,
    "search_text" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "case_document_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_record_indexes" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "manifest_id" UUID,
    "record_type" "CaseRecordType" NOT NULL,
    "record_category" TEXT,
    "title" TEXT,
    "storage_bucket" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size_bytes" BIGINT,
    "checksum_sha256" TEXT,
    "etag" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" "ActorType" NOT NULL DEFAULT 'human',
    "created_by_user_id" UUID,
    "party" "RecordParty",
    "record_status" "RecordStatus",
    "record_visibility" "RecordVisibility" NOT NULL DEFAULT 'visible',
    "typed_meta" JSONB,
    "references" JSONB,
    "referenced_by" JSONB,
    "supersedes" JSONB,
    "superseded_by" JSONB,
    "search_text" TEXT,
    "event_date" TIMESTAMPTZ(6),
    "due_date" TIMESTAMPTZ(6),
    "date_confidence" "DateConfidence",
    "last_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_record_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_view_indexes" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "manifest_id" UUID,
    "view_type" "CaseViewType" NOT NULL,
    "title" TEXT,
    "storage_bucket" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "mime_family" "FileMimeFamily",
    "file_size_bytes" BIGINT,
    "checksum_sha256" TEXT,
    "etag" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source_hash" TEXT,
    "search_text" TEXT,
    "generated_by" TEXT,
    "created_by" "ActorType" NOT NULL DEFAULT 'agent',
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "case_view_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_state_manifests" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "case_id" UUID,
    "created_by_user_id" UUID,
    "manifest_kind" "ManifestKind" NOT NULL,
    "manifest_number" INTEGER NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "checksum_sha256" TEXT,
    "source_hash" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_state_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_usage_events" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "billed_to_user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operation" TEXT,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6),
    "request_files" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "users_account_tier_idx" ON "users"("account_tier");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_storage_prefix_key" ON "workspaces"("storage_prefix");

-- CreateIndex
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces"("owner_user_id");

-- CreateIndex
CREATE INDEX "workspaces_status_idx" ON "workspaces"("status");

-- CreateIndex
CREATE INDEX "workspace_memberships_workspace_id_role_idx" ON "workspace_memberships"("workspace_id", "role");

-- CreateIndex
CREATE INDEX "workspace_memberships_user_id_idx" ON "workspace_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberships_workspace_id_user_id_key" ON "workspace_memberships"("workspace_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invitations_invitation_token_key" ON "workspace_invitations"("invitation_token");

-- CreateIndex
CREATE INDEX "workspace_invitations_workspace_id_idx" ON "workspace_invitations"("workspace_id");

-- CreateIndex
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations"("email");

-- CreateIndex
CREATE INDEX "workspace_invitations_status_expires_at_idx" ON "workspace_invitations"("status", "expires_at");

-- CreateIndex
CREATE INDEX "cases_workspace_id_idx" ON "cases"("workspace_id");

-- CreateIndex
CREATE INDEX "cases_created_by_user_id_idx" ON "cases"("created_by_user_id");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "case_document_indexes_storage_key_key" ON "case_document_indexes"("storage_key");

-- CreateIndex
CREATE INDEX "case_document_indexes_workspace_id_category_idx" ON "case_document_indexes"("workspace_id", "category");

-- CreateIndex
CREATE INDEX "case_document_indexes_case_id_category_idx" ON "case_document_indexes"("case_id", "category");

-- CreateIndex
CREATE INDEX "case_document_indexes_uploaded_by_user_id_idx" ON "case_document_indexes"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "case_document_indexes_status_idx" ON "case_document_indexes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "case_record_indexes_storage_key_key" ON "case_record_indexes"("storage_key");

-- CreateIndex
CREATE INDEX "case_record_indexes_workspace_id_record_type_idx" ON "case_record_indexes"("workspace_id", "record_type");

-- CreateIndex
CREATE INDEX "case_record_indexes_case_id_record_type_idx" ON "case_record_indexes"("case_id", "record_type");

-- CreateIndex
CREATE INDEX "case_record_indexes_manifest_id_idx" ON "case_record_indexes"("manifest_id");

-- CreateIndex
CREATE INDEX "case_record_indexes_created_by_user_id_idx" ON "case_record_indexes"("created_by_user_id");

-- CreateIndex
CREATE INDEX "case_record_indexes_last_updated_by_user_id_idx" ON "case_record_indexes"("last_updated_by_user_id");

-- CreateIndex
CREATE INDEX "case_record_indexes_record_status_idx" ON "case_record_indexes"("record_status");

-- CreateIndex
CREATE INDEX "case_record_indexes_event_date_idx" ON "case_record_indexes"("event_date");

-- CreateIndex
CREATE INDEX "case_record_indexes_due_date_idx" ON "case_record_indexes"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "case_view_indexes_storage_key_key" ON "case_view_indexes"("storage_key");

-- CreateIndex
CREATE INDEX "case_view_indexes_workspace_id_view_type_idx" ON "case_view_indexes"("workspace_id", "view_type");

-- CreateIndex
CREATE INDEX "case_view_indexes_case_id_view_type_idx" ON "case_view_indexes"("case_id", "view_type");

-- CreateIndex
CREATE INDEX "case_view_indexes_manifest_id_idx" ON "case_view_indexes"("manifest_id");

-- CreateIndex
CREATE INDEX "case_view_indexes_created_by_user_id_idx" ON "case_view_indexes"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_state_manifests_storage_key_key" ON "case_state_manifests"("storage_key");

-- CreateIndex
CREATE INDEX "case_state_manifests_workspace_id_manifest_kind_created_at_idx" ON "case_state_manifests"("workspace_id", "manifest_kind", "created_at");

-- CreateIndex
CREATE INDEX "case_state_manifests_case_id_is_current_idx" ON "case_state_manifests"("case_id", "is_current");

-- CreateIndex
CREATE INDEX "case_state_manifests_created_by_user_id_idx" ON "case_state_manifests"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_state_manifests_case_id_manifest_number_key" ON "case_state_manifests"("case_id", "manifest_number");

-- CreateIndex
CREATE INDEX "llm_usage_events_workspace_id_created_at_idx" ON "llm_usage_events"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "llm_usage_events_case_id_idx" ON "llm_usage_events"("case_id");

-- CreateIndex
CREATE INDEX "llm_usage_events_billed_to_user_id_created_at_idx" ON "llm_usage_events"("billed_to_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_document_indexes" ADD CONSTRAINT "case_document_indexes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_document_indexes" ADD CONSTRAINT "case_document_indexes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_document_indexes" ADD CONSTRAINT "case_document_indexes_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_record_indexes" ADD CONSTRAINT "case_record_indexes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_record_indexes" ADD CONSTRAINT "case_record_indexes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_record_indexes" ADD CONSTRAINT "case_record_indexes_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "case_state_manifests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_record_indexes" ADD CONSTRAINT "case_record_indexes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_record_indexes" ADD CONSTRAINT "case_record_indexes_last_updated_by_user_id_fkey" FOREIGN KEY ("last_updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_view_indexes" ADD CONSTRAINT "case_view_indexes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_view_indexes" ADD CONSTRAINT "case_view_indexes_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_view_indexes" ADD CONSTRAINT "case_view_indexes_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "case_state_manifests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_view_indexes" ADD CONSTRAINT "case_view_indexes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_state_manifests" ADD CONSTRAINT "case_state_manifests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_state_manifests" ADD CONSTRAINT "case_state_manifests_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_state_manifests" ADD CONSTRAINT "case_state_manifests_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_billed_to_user_id_fkey" FOREIGN KEY ("billed_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
