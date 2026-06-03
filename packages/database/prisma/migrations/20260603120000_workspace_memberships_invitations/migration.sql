-- Align workspaces with the current Prisma schema.
ALTER TABLE "workspaces" ALTER COLUMN "description" DROP NOT NULL;

-- Recreate workspace membership and invitation types after the trimmed workspace migration.
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'admin', 'contributor', 'readonly');
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'invited', 'removed');
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'revoked', 'expired');

CREATE TABLE "workspace_memberships" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "membership_status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_invitations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "invited_by_user_id" UUID,
    "email" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'readonly',
    "invitation_token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspaces_status_idx" ON "workspaces"("status");

CREATE UNIQUE INDEX "workspace_memberships_workspace_id_user_id_key" ON "workspace_memberships"("workspace_id", "user_id");
CREATE INDEX "workspace_memberships_workspace_id_role_idx" ON "workspace_memberships"("workspace_id", "role");
CREATE INDEX "workspace_memberships_user_id_idx" ON "workspace_memberships"("user_id");

CREATE UNIQUE INDEX "workspace_invitations_invitation_token_key" ON "workspace_invitations"("invitation_token");
CREATE INDEX "workspace_invitations_workspace_id_idx" ON "workspace_invitations"("workspace_id");
CREATE INDEX "workspace_invitations_invited_by_user_id_idx" ON "workspace_invitations"("invited_by_user_id");
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations"("email");
CREATE INDEX "workspace_invitations_workspace_id_email_status_idx" ON "workspace_invitations"("workspace_id", "email", "status");
CREATE INDEX "workspace_invitations_status_expires_at_idx" ON "workspace_invitations"("status", "expires_at");

ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
