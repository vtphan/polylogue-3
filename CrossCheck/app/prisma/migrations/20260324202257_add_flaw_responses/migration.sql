-- CreateTable
CREATE TABLE "flaw_responses" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "flaw_id" TEXT NOT NULL,
    "type_answer" TEXT NOT NULL,
    "type_correct" BOOLEAN NOT NULL,
    "reason_answer" TEXT,
    "reason_correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flaw_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flaw_responses_group_id_flaw_id_idx" ON "flaw_responses"("group_id", "flaw_id");

-- AddForeignKey
ALTER TABLE "flaw_responses" ADD CONSTRAINT "flaw_responses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flaw_responses" ADD CONSTRAINT "flaw_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
