/*
  Warnings:

  - You are about to drop the column `display_name` on the `users` table. All the data in the column will be lost.
  - Added the required column `user_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "display_name",
ADD COLUMN     "first_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "last_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "profile_picture" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "user_name" TEXT NOT NULL;
