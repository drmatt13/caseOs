/*
  Warnings:

  - You are about to drop the column `storage_prefix` on the `workspaces` table. All the data in the column will be lost.
  - Added the required column `description` to the `workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "workspaces_storage_prefix_key";

-- AlterTable
ALTER TABLE "workspaces" DROP COLUMN "storage_prefix",
ADD COLUMN     "description" TEXT NOT NULL;
