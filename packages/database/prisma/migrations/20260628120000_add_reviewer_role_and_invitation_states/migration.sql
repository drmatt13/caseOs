-- Adds the elevated "reviewer" membership role (propose + accept/answer/task)
-- and the accept/decline invitation states. Purely additive — existing
-- contributor members stay propose-only and existing invitations are unaffected.

-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE 'reviewer' BEFORE 'contributor';

-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'accepted' BEFORE 'revoked';
ALTER TYPE "InvitationStatus" ADD VALUE 'declined' BEFORE 'revoked';
