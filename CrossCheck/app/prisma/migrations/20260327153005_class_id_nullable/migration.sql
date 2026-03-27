-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_class_id_fkey";

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "class_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
