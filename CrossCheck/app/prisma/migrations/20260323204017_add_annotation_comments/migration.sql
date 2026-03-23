-- CreateTable
CREATE TABLE "annotation_comments" (
    "id" UUID NOT NULL,
    "annotation_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "is_bonus" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annotation_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "annotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
