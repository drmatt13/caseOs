/*
  Warnings:

  - The values [accepted] on the enum `InvitationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [invited] on the enum `MembershipStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [cancelled] on the enum `WorkspaceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `user_id` on the `llm_usage_events` table. All the data in the column will be lost.
  - You are about to drop the column `can_create_workspaces` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `accepted_at` on the `workspace_invitations` table. All the data in the column will be lost.
  - You are about to drop the column `accepted_by_user_id` on the `workspace_invitations` table. All the data in the column will be lost.
  - You are about to drop the column `invited_by_user_id` on the `workspace_invitations` table. All the data in the column will be lost.
  - You are about to drop the column `billing_email` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_user_id` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_customer_id` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_default_payment_method_id` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the `tier_limits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspace_payment_methods` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspace_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_name]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_subscription_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billed_to_user_id` to the `llm_usage_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billed_to_user_id` to the `workspace_usage_monthly` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_user_id` to the `workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountTier" AS ENUM ('free', 'trial', 'pro', 'enterprise');

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
CREATE TYPE "RecordStatus" AS ENUM ('proposed', 'accepted', 'rejected', 'superseded');

-- CreateEnum
CREATE TYPE "RecordVisibility" AS ENUM ('hidden', 'visible');

-- CreateEnum
CREATE TYPE "CaseViewType" AS ENUM ('arguments', 'case_notes', 'facts', 'issues', 'legal_precedent', 'objectives', 'posture', 'tasks', 'testimony', 'timeline', 'agent_config', 'case_summary', 'documents_index');

-- AlterEnum
BEGIN;
CREATE TYPE "InvitationStatus_new" AS ENUM ('pending', 'revoked', 'expired');
ALTER TABLE "public"."workspace_invitations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "workspace_invitations" ALTER COLUMN "status" TYPE "InvitationStatus_new" USING ("status"::text::"InvitationStatus_new");
ALTER TYPE "InvitationStatus" RENAME TO "InvitationStatus_old";
ALTER TYPE "InvitationStatus_new" RENAME TO "InvitationStatus";
DROP TYPE "public"."InvitationStatus_old";
ALTER TABLE "workspace_invitations" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MembershipStatus_new" AS ENUM ('active', 'suspended');
ALTER TABLE "public"."workspace_memberships" ALTER COLUMN "membership_status" DROP DEFAULT;
ALTER TABLE "workspace_memberships" ALTER COLUMN "membership_status" TYPE "MembershipStatus_new" USING ("membership_status"::text::"MembershipStatus_new");
ALTER TYPE "MembershipStatus" RENAME TO "MembershipStatus_old";
ALTER TYPE "MembershipStatus_new" RENAME TO "MembershipStatus";
DROP TYPE "public"."MembershipStatus_old";
ALTER TABLE "workspace_memberships" ALTER COLUMN "membership_status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WorkspaceStatus_new" AS ENUM ('active', 'archived', 'suspended');
ALTER TABLE "public"."workspaces" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "workspaces" ALTER COLUMN "status" TYPE "WorkspaceStatus_new" USING ("status"::text::"WorkspaceStatus_new");
ALTER TYPE "WorkspaceStatus" RENAME TO "WorkspaceStatus_old";
ALTER TYPE "WorkspaceStatus_new" RENAME TO "WorkspaceStatus";
DROP TYPE "public"."WorkspaceStatus_old";
ALTER TABLE "workspaces" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- DropForeignKey
ALTER TABLE "llm_usage_events" DROP CONSTRAINT "llm_usage_events_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_accepted_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_invited_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_payment_methods" DROP CONSTRAINT "workspace_payment_methods_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_subscriptions" DROP CONSTRAINT "workspace_subscriptions_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_created_by_user_id_fkey";

-- DropIndex
DROP INDEX "llm_usage_events_user_id_idx";

-- DropIndex
DROP INDEX "workspaces_created_by_user_id_idx";

-- DropIndex
DROP INDEX "workspaces_stripe_customer_id_key";

-- DropIndex
DROP INDEX "workspaces_tier_idx";

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "agent_config" TEXT,
ADD COLUMN     "intake" JSONB;

-- AlterTable
ALTER TABLE "llm_usage_events" DROP COLUMN "user_id",
ADD COLUMN     "actor_user_id" UUID,
ADD COLUMN     "billed_to_user_id" UUID NOT NULL,
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "stripe_event_log" ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "can_create_workspaces",
ADD COLUMN     "account_tier" "AccountTier" NOT NULL DEFAULT 'free',
ADD COLUMN     "billing_email" TEXT,
ADD COLUMN     "billing_interval" "BillingInterval",
ADD COLUMN     "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "current_period_end" TIMESTAMPTZ(6),
ADD COLUMN     "current_period_start" TIMESTAMPTZ(6),
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_default_payment_method_id" TEXT,
ADD COLUMN     "stripe_price_id" TEXT,
ADD COLUMN     "stripe_product_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
ADD COLUMN     "trial_ends_at" TIMESTAMPTZ(6),
ADD COLUMN     "trial_starts_at" TIMESTAMPTZ(6),
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "first_name" DROP DEFAULT,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP DEFAULT,
ALTER COLUMN "profile_picture" DROP NOT NULL,
ALTER COLUMN "profile_picture" DROP DEFAULT,
ALTER COLUMN "user_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workspace_invitations" DROP COLUMN "accepted_at",
DROP COLUMN "accepted_by_user_id",
DROP COLUMN "invited_by_user_id";

-- AlterTable
ALTER TABLE "workspace_usage_monthly" ADD COLUMN     "billed_to_user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "workspaces" DROP COLUMN "billing_email",
DROP COLUMN "created_by_user_id",
DROP COLUMN "stripe_customer_id",
DROP COLUMN "stripe_default_payment_method_id",
DROP COLUMN "tier",
ADD COLUMN     "owner_user_id" UUID NOT NULL;

-- DropTable
DROP TABLE "tier_limits";

-- DropTable
DROP TABLE "workspace_payment_methods";

-- DropTable
DROP TABLE "workspace_subscriptions";

-- DropEnum
DROP TYPE "PaymentMethodStatus";

-- DropEnum
DROP TYPE "WorkspaceTier";

-- CreateTable
CREATE TABLE "case_documents" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "uploaded_by_user_id" UUID,
    "category" "DocumentCategory" NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT,
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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "case_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_records" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "record_type" "CaseRecordType" NOT NULL,
    "record_category" TEXT,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "created_by" "ActorType" NOT NULL DEFAULT 'human',
    "created_by_user_id" UUID,
    "record_status" "RecordStatus",
    "record_visibility" "RecordVisibility" NOT NULL DEFAULT 'visible',
    "typed_data" JSONB,
    "references" JSONB,
    "referenced_by" JSONB,
    "supersedes" JSONB,
    "superseded_by" JSONB,
    "last_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_views" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "view_type" "CaseViewType" NOT NULL,
    "content" TEXT NOT NULL,
    "last_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage_monthly" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "usage_month" DATE NOT NULL,
    "total_input_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_output_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,

    CONSTRAINT "user_usage_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_tier_limits" (
    "tier" "AccountTier" NOT NULL,
    "max_workspaces_owned" INTEGER NOT NULL,
    "max_members_per_workspace" INTEGER NOT NULL,
    "max_cases_per_workspace" INTEGER NOT NULL,
    "monthly_token_limit" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "account_tier_limits_pkey" PRIMARY KEY ("tier")
);

-- CreateIndex
CREATE INDEX "case_documents_case_id_idx" ON "case_documents"("case_id");

-- CreateIndex
CREATE INDEX "case_documents_workspace_id_idx" ON "case_documents"("workspace_id");

-- CreateIndex
CREATE INDEX "case_documents_uploaded_by_user_id_idx" ON "case_documents"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "case_documents_status_idx" ON "case_documents"("status");

-- CreateIndex
CREATE INDEX "case_records_case_id_record_type_idx" ON "case_records"("case_id", "record_type");

-- CreateIndex
CREATE INDEX "case_records_workspace_id_idx" ON "case_records"("workspace_id");

-- CreateIndex
CREATE INDEX "case_records_created_by_user_id_idx" ON "case_records"("created_by_user_id");

-- CreateIndex
CREATE INDEX "case_records_last_updated_by_user_id_idx" ON "case_records"("last_updated_by_user_id");

-- CreateIndex
CREATE INDEX "case_records_record_status_idx" ON "case_records"("record_status");

-- CreateIndex
CREATE INDEX "case_views_workspace_id_idx" ON "case_views"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_views_case_id_view_type_key" ON "case_views"("case_id", "view_type");

-- CreateIndex
CREATE INDEX "user_usage_monthly_usage_month_idx" ON "user_usage_monthly"("usage_month");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_monthly_user_id_usage_month_key" ON "user_usage_monthly"("user_id", "usage_month");

-- CreateIndex
CREATE INDEX "llm_usage_events_actor_user_id_idx" ON "llm_usage_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "llm_usage_events_billed_to_user_id_created_at_idx" ON "llm_usage_events"("billed_to_user_id", "created_at");

-- CreateIndex
CREATE INDEX "stripe_event_log_user_id_idx" ON "stripe_event_log"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "users_account_tier_idx" ON "users"("account_tier");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "workspace_usage_monthly_billed_to_user_id_usage_month_idx" ON "workspace_usage_monthly"("billed_to_user_id", "usage_month");

-- CreateIndex
CREATE INDEX "workspaces_owner_user_id_idx" ON "workspaces"("owner_user_id");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_last_updated_by_user_id_fkey" FOREIGN KEY ("last_updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_billed_to_user_id_fkey" FOREIGN KEY ("billed_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_usage_monthly" ADD CONSTRAINT "workspace_usage_monthly_billed_to_user_id_fkey" FOREIGN KEY ("billed_to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage_monthly" ADD CONSTRAINT "user_usage_monthly_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_event_log" ADD CONSTRAINT "stripe_event_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
