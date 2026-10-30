-- Prepared only. Apply after study-upgrade.sql, on an approved database.
BEGIN;
-- CreateTable
CREATE TABLE "ExerciseQuestion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "mode" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "content" JSONB NOT NULL,
    "sourceUrl" TEXT,
    "usageRights" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "source" JSONB NOT NULL,
    "questionIds" TEXT[],
    "snapshots" JSONB NOT NULL,
    "results" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseMistake" (
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "lastWrongAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseMistake_pkey" PRIMARY KEY ("userId","questionId")
);

-- CreateIndex
CREATE INDEX "ExerciseQuestion_mode_status_topic_level_idx" ON "ExerciseQuestion"("mode", "status", "topic", "level");

-- CreateIndex
CREATE INDEX "ExerciseSession_userId_completedAt_idx" ON "ExerciseSession"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "ExerciseMistake_userId_resolvedAt_idx" ON "ExerciseMistake"("userId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "ExerciseQuestion" ADD CONSTRAINT "ExerciseQuestion_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSession" ADD CONSTRAINT "ExerciseSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMistake" ADD CONSTRAINT "ExerciseMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMistake" ADD CONSTRAINT "ExerciseMistake_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExerciseQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExerciseMistake" ADD CONSTRAINT "ExerciseMistake_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExerciseSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseSession" FORCE ROW LEVEL SECURITY;
CREATE POLICY exercise_owner ON "ExerciseSession" USING ("userId"=NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId"=NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "ExerciseMistake" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseMistake" FORCE ROW LEVEL SECURITY;
CREATE POLICY exercise_owner ON "ExerciseMistake" USING ("userId"=NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId"=NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "ExerciseQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseQuestion" FORCE ROW LEVEL SECURITY;
CREATE POLICY exercise_read ON "ExerciseQuestion" FOR SELECT USING ("status"='reviewed' OR current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin'));
CREATE POLICY exercise_admin_write ON "ExerciseQuestion" FOR ALL USING (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin')) WITH CHECK (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin'));
COMMIT;
