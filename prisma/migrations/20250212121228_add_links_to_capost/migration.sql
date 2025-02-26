-- AlterTable
ALTER TABLE "CAPost" ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[];
