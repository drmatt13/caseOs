/*
  Warnings:

  - You are about to drop the column `storage_bucket` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the `case_document_indexes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_record_indexes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_state_manifests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_view_indexes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `llm_usage_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspace_invitations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspace_memberships` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "case_document_indexes" DROP CONSTRAINT "case_document_indexes_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_document_indexes" DROP CONSTRAINT "case_document_indexes_uploaded_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_document_indexes" DROP CONSTRAINT "case_document_indexes_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "case_record_indexes" DROP CONSTRAINT "case_record_indexes_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_record_indexes" DROP CONSTRAINT "case_record_indexes_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_record_indexes" DROP CONSTRAINT "case_record_indexes_last_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_record_indexes" DROP CONSTRAINT "case_record_indexes_manifest_id_fkey";

-- DropForeignKey
ALTER TABLE "case_record_indexes" DROP CONSTRAINT "case_record_indexes_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "case_state_manifests" DROP CONSTRAINT "case_state_manifests_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_state_manifests" DROP CONSTRAINT "case_state_manifests_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_state_manifests" DROP CONSTRAINT "case_state_manifests_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "case_view_indexes" DROP CONSTRAINT "case_view_indexes_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_view_indexes" DROP CONSTRAINT "case_view_indexes_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_view_indexes" DROP CONSTRAINT "case_view_indexes_manifest_id_fkey";

-- DropForeignKey
ALTER TABLE "case_view_indexes" DROP CONSTRAINT "case_view_indexes_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "llm_usage_events" DROP CONSTRAINT "llm_usage_events_actor_user_id_fkey";

-- DropForeignKey
ALTER TABLE "llm_usage_events" DROP CONSTRAINT "llm_usage_events_billed_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "llm_usage_events" DROP CONSTRAINT "llm_usage_events_case_id_fkey";

-- DropForeignKey
ALTER TABLE "llm_usage_events" DROP CONSTRAINT "llm_usage_events_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_memberships" DROP CONSTRAINT "workspace_memberships_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workspace_memberships" DROP CONSTRAINT "workspace_memberships_workspace_id_fkey";

-- DropIndex
DROP INDEX "workspaces_status_idx";

-- AlterTable
ALTER TABLE "workspaces" DROP COLUMN "storage_bucket";

-- DropTable
DROP TABLE "case_document_indexes";

-- DropTable
DROP TABLE "case_record_indexes";

-- DropTable
DROP TABLE "case_state_manifests";

-- DropTable
DROP TABLE "case_view_indexes";

-- DropTable
DROP TABLE "cases";

-- DropTable
DROP TABLE "llm_usage_events";

-- DropTable
DROP TABLE "workspace_invitations";

-- DropTable
DROP TABLE "workspace_memberships";

-- DropEnum
DROP TYPE "ActorType";

-- DropEnum
DROP TYPE "CaseRecordType";

-- DropEnum
DROP TYPE "CaseStatus";

-- DropEnum
DROP TYPE "CaseViewType";

-- DropEnum
DROP TYPE "DateConfidence";

-- DropEnum
DROP TYPE "DocumentCategory";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "FileMimeFamily";

-- DropEnum
DROP TYPE "InvitationRole";

-- DropEnum
DROP TYPE "InvitationStatus";

-- DropEnum
DROP TYPE "ManifestKind";

-- DropEnum
DROP TYPE "MembershipRole";

-- DropEnum
DROP TYPE "MembershipStatus";

-- DropEnum
DROP TYPE "RecordParty";

-- DropEnum
DROP TYPE "RecordStatus";

-- DropEnum
DROP TYPE "RecordVisibility";
