-- CreateEnum
CREATE TYPE "GroupPhase" AS ENUM ('individual', 'group', 'reviewing');

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('active', 'complete');
ALTER TABLE "public"."sessions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sessions" ALTER COLUMN "status" TYPE "SessionStatus_new" USING ("status"::text::"SessionStatus_new");
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "public"."SessionStatus_old";
ALTER TABLE "sessions" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "phase" "GroupPhase" NOT NULL DEFAULT 'individual';

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "closed_at",
ADD COLUMN     "completed_at" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateTable
CREATE TABLE "group_ready" (
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "group_ready_pkey" PRIMARY KEY ("group_id","user_id")
);

-- AddForeignKey
ALTER TABLE "group_ready" ADD CONSTRAINT "group_ready_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_ready" ADD CONSTRAINT "group_ready_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
