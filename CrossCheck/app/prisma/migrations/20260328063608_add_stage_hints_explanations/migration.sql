-- CreateEnum
CREATE TYPE "SessionStage" AS ENUM ('recognize', 'explain', 'locate', 'results');

-- AlterTable
ALTER TABLE "annotations" ADD COLUMN     "hint_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "target_section" TEXT;

-- AlterTable
ALTER TABLE "flaw_responses" ADD COLUMN     "hint_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stage" TEXT;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "stage" "SessionStage" NOT NULL DEFAULT 'recognize';

-- CreateTable
CREATE TABLE "hint_usages" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "flaw_id" TEXT,
    "turn_id" TEXT NOT NULL,
    "hint_level" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "target_section" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hint_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explanations" (
    "id" UUID NOT NULL,
    "turn_id" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "revision_of" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "explanations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hint_usages_student_id_session_id_idx" ON "hint_usages"("student_id", "session_id");

-- CreateIndex
CREATE INDEX "hint_usages_group_id_idx" ON "hint_usages"("group_id");

-- CreateIndex
CREATE INDEX "explanations_group_id_turn_id_idx" ON "explanations"("group_id", "turn_id");

-- CreateIndex
CREATE INDEX "explanations_author_id_idx" ON "explanations"("author_id");

-- AddForeignKey
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hint_usages" ADD CONSTRAINT "hint_usages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanations" ADD CONSTRAINT "explanations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanations" ADD CONSTRAINT "explanations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanations" ADD CONSTRAINT "explanations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
