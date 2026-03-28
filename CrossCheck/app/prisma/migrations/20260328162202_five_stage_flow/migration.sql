-- AlterEnum
ALTER TYPE "SessionStage" ADD VALUE 'collaborate';

-- AlterTable
ALTER TABLE "annotations" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "explanations" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stage" TEXT;

-- AlterTable
ALTER TABLE "flaw_responses" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0;
