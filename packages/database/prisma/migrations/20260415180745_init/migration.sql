-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "WorkspaceTier" AS ENUM ('free', 'trial', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('active', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'invited', 'suspended');

-- CreateEnum
CREATE TYPE "InvitationRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('open', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('inactive', 'trialing', 'active', 'past_due', 'unpaid', 'cancelled', 'incomplete', 'incomplete_expired');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "PaymentMethodStatus" AS ENUM ('active', 'detached');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "cognito_sub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "can_create_workspaces" BOOLEAN NOT NULL DEFAULT false,
    "account_status" "AccountStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "tier" "WorkspaceTier" NOT NULL DEFAULT 'free',
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'active',
    "billing_email" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_default_payment_method_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

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
    "invited_by_user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "InvitationRole" NOT NULL DEFAULT 'member',
    "invitation_token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_by_user_id" UUID,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_subscriptions" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_product_id" TEXT,
    "tier" "WorkspaceTier" NOT NULL,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'inactive',
    "billing_interval" "BillingInterval",
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "trial_start" TIMESTAMPTZ(6),
    "trial_end" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_payment_methods" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "PaymentMethodStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_event_log" (
    "id" UUID NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "stripe_event_type" TEXT NOT NULL,
    "workspace_id" UUID,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ(6),
    "event_created_at" TIMESTAMPTZ(6),
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "stripe_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_usage_events" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "case_id" UUID,
    "user_id" UUID,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_usage_monthly" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "usage_month" DATE NOT NULL,
    "total_input_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_output_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_tokens" BIGINT NOT NULL DEFAULT 0,
    "total_estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,

    CONSTRAINT "workspace_usage_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_limits" (
    "tier" "WorkspaceTier" NOT NULL,
    "max_workspaces_created" INTEGER NOT NULL,
    "max_members_per_workspace" INTEGER NOT NULL,
    "max_cases_per_workspace" INTEGER NOT NULL,
    "monthly_token_limit" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tier_limits_pkey" PRIMARY KEY ("tier")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_sub_key" ON "users"("cognito_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripe_customer_id_key" ON "workspaces"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "workspaces_created_by_user_id_idx" ON "workspaces"("created_by_user_id");

-- CreateIndex
CREATE INDEX "workspaces_tier_idx" ON "workspaces"("tier");

-- CreateIndex
CREATE INDEX "workspaces_status_idx" ON "workspaces"("status");

-- CreateIndex
CREATE INDEX "workspace_memberships_user_id_idx" ON "workspace_memberships"("user_id");

-- CreateIndex
CREATE INDEX "workspace_memberships_workspace_id_role_idx" ON "workspace_memberships"("workspace_id", "role");

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
CREATE UNIQUE INDEX "workspace_subscriptions_workspace_id_key" ON "workspace_subscriptions"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_subscriptions_stripe_subscription_id_key" ON "workspace_subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_stripe_customer_id_idx" ON "workspace_subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_tier_idx" ON "workspace_subscriptions"("tier");

-- CreateIndex
CREATE INDEX "workspace_subscriptions_subscription_status_idx" ON "workspace_subscriptions"("subscription_status");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_payment_methods_stripe_payment_method_id_key" ON "workspace_payment_methods"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "workspace_payment_methods_workspace_id_is_default_idx" ON "workspace_payment_methods"("workspace_id", "is_default");

-- CreateIndex
CREATE INDEX "workspace_payment_methods_stripe_customer_id_idx" ON "workspace_payment_methods"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_payment_methods_workspace_id_stripe_payment_metho_key" ON "workspace_payment_methods"("workspace_id", "stripe_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_event_log_stripe_event_id_key" ON "stripe_event_log"("stripe_event_id");

-- CreateIndex
CREATE INDEX "stripe_event_log_workspace_id_idx" ON "stripe_event_log"("workspace_id");

-- CreateIndex
CREATE INDEX "stripe_event_log_stripe_customer_id_idx" ON "stripe_event_log"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "stripe_event_log_stripe_subscription_id_idx" ON "stripe_event_log"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "stripe_event_log_processed_received_at_idx" ON "stripe_event_log"("processed", "received_at");

-- CreateIndex
CREATE INDEX "cases_workspace_id_idx" ON "cases"("workspace_id");

-- CreateIndex
CREATE INDEX "cases_created_by_user_id_idx" ON "cases"("created_by_user_id");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "llm_usage_events_workspace_id_created_at_idx" ON "llm_usage_events"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "llm_usage_events_case_id_idx" ON "llm_usage_events"("case_id");

-- CreateIndex
CREATE INDEX "llm_usage_events_user_id_idx" ON "llm_usage_events"("user_id");

-- CreateIndex
CREATE INDEX "llm_usage_events_provider_model_idx" ON "llm_usage_events"("provider", "model");

-- CreateIndex
CREATE INDEX "workspace_usage_monthly_usage_month_idx" ON "workspace_usage_monthly"("usage_month");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_usage_monthly_workspace_id_usage_month_key" ON "workspace_usage_monthly"("workspace_id", "usage_month");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_accepted_by_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_subscriptions" ADD CONSTRAINT "workspace_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_payment_methods" ADD CONSTRAINT "workspace_payment_methods_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stripe_event_log" ADD CONSTRAINT "stripe_event_log_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage_events" ADD CONSTRAINT "llm_usage_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_usage_monthly" ADD CONSTRAINT "workspace_usage_monthly_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
