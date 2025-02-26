/*
  Warnings:

  - You are about to drop the column `links` on the `CAPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CAPost" DROP COLUMN "links",
ADD COLUMN     "link" JSONB;
