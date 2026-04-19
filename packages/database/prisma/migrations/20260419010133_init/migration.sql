/*
  Warnings:

  - You are about to drop the column `agent_config` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the `case_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `case_views` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[storage_prefix]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storage_bucket` to the `workspaces` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storage_prefix` to the `workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ManifestKind" AS ENUM ('workspace_state', 'case_state', 'snapshot');

-- CreateEnum
CREATE TYPE "FileMimeFamily" AS ENUM ('json', 'markdown', 'text', 'pdf', 'image', 'audio', 'video', 'other');

-- DropForeignKey
ALTER TABLE "case_documents" DROP CONSTRAINT "case_documents_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_documents" DROP CONSTRAINT "case_documents_uploaded_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_documents" DROP CONSTRAINT "case_documents_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "case_records" DROP CONSTRAINT "case_records_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_records" DROP CONSTRAINT "case_records_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_records" DROP CONSTRAINT "case_records_last_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "case_records" DROP CONSTRAINT "case_records_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_case_id_fkey";

-- DropForeignKey
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_workspace_id_fkey";

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "agent_config",
ADD COLUMN     "current_manifest_number" INTEGER;

-- AlterTable
ALTER TABLE "llm_usage_events" ADD COLUMN     "operation" TEXT,
ADD COLUMN     "request_files" JSONB;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "storage_bucket" TEXT NOT NULL,
ADD COLUMN     "storage_prefix" TEXT NOT NULL;

-- DropTable
DROP TABLE "case_documents";

-- DropTable
DROP TABLE "case_records";

-- DropTable
DROP TABLE "case_views";

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
    "confidence" DOUBLE PRECISION,
    "created_by" "ActorType" NOT NULL DEFAULT 'human',
    "created_by_user_id" UUID,
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
CREATE UNIQUE INDEX "workspaces_storage_prefix_key" ON "workspaces"("storage_prefix");

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
