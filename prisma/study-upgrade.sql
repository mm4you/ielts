-- Prepared only; apply once after backup, test and explicit rollout approval.
BEGIN;
-- AlterTable
ALTER TABLE "DailyActivity" ADD COLUMN     "legacyInteractionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "practiceCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,
    "rating" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPreference" (
    "userId" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',

    CONSTRAINT "StudyPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "StudyWordDay" (
    "userId" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "StudyWordDay_pkey" PRIMARY KEY ("userId","date","wordId")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "source" JSONB NOT NULL,
    "wordIds" INTEGER[],
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordMistake" (
    "userId" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "lastWrongAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WordMistake_pkey" PRIMARY KEY ("userId","wordId","mode")
);

-- CreateTable
CREATE TABLE "StudyDeck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "StudyDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyStage" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "StudyStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyStageWord" (
    "stageId" TEXT NOT NULL,
    "wordId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "StudyStageWord_pkey" PRIMARY KEY ("stageId","wordId")
);

-- CreateTable
CREATE TABLE "StudyCheckpoint" (
    "userId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastSessionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyCheckpoint_pkey" PRIMARY KEY ("userId","stageId","mode")
);

-- CreateTable
CREATE TABLE "WordContentReview" (
    "wordId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sourceUrl" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "senses" JSONB NOT NULL,
    "acceptedAnswers" TEXT[],

    CONSTRAINT "WordContentReview_pkey" PRIMARY KEY ("wordId")
);

-- CreateIndex
CREATE INDEX "ReviewEvent_userId_wordId_idx" ON "ReviewEvent"("userId", "wordId");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_completedAt_idx" ON "PracticeSession"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "WordMistake_userId_resolvedAt_idx" ON "WordMistake"("userId", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudyDeck_topic_version_key" ON "StudyDeck"("topic", "version");

-- CreateIndex
CREATE UNIQUE INDEX "StudyStage_deckId_position_key" ON "StudyStage"("deckId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "StudyStageWord_stageId_position_key" ON "StudyStageWord"("stageId", "position");

-- AddForeignKey
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPreference" ADD CONSTRAINT "StudyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyWordDay" ADD CONSTRAINT "StudyWordDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordMistake" ADD CONSTRAINT "WordMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordMistake" ADD CONSTRAINT "WordMistake_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyStage" ADD CONSTRAINT "StudyStage_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "StudyDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyStageWord" ADD CONSTRAINT "StudyStageWord_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "StudyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyStageWord" ADD CONSTRAINT "StudyStageWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyCheckpoint" ADD CONSTRAINT "StudyCheckpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyCheckpoint" ADD CONSTRAINT "StudyCheckpoint_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "StudyStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordContentReview" ADD CONSTRAINT "WordContentReview_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve historical interaction counts without fabricating distinct-word history.
UPDATE "DailyActivity" SET "legacyInteractionCount"="wordsLearned", "practiceCount"="wordsLearned", "wordsLearned"=0;

ALTER TABLE "ReviewEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewEvent" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_owner ON "ReviewEvent" USING ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "StudyPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyPreference" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_owner ON "StudyPreference" USING ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "StudyWordDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyWordDay" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_owner ON "StudyWordDay" USING ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "PracticeSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PracticeSession" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_owner ON "PracticeSession" USING ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "WordMistake" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WordMistake" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_owner ON "WordMistake" USING ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "StudyCheckpoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyCheckpoint" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_owner ON "StudyCheckpoint" USING ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true') WITH CHECK ("userId" = NULLIF(current_setting('app.current_user_id',true),'') OR current_setting('app.bypass_rls',true)='true');

ALTER TABLE "StudyDeck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyDeck" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_public_read ON "StudyDeck" FOR SELECT USING (true);
CREATE POLICY study_admin_write ON "StudyDeck" FOR ALL USING (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin')) WITH CHECK (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin'));

ALTER TABLE "StudyStage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyStage" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_public_read ON "StudyStage" FOR SELECT USING (true);
CREATE POLICY study_admin_write ON "StudyStage" FOR ALL USING (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin')) WITH CHECK (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin'));

ALTER TABLE "StudyStageWord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyStageWord" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_public_read ON "StudyStageWord" FOR SELECT USING (true);
CREATE POLICY study_admin_write ON "StudyStageWord" FOR ALL USING (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin')) WITH CHECK (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin'));

ALTER TABLE "WordContentReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WordContentReview" FORCE ROW LEVEL SECURITY;
CREATE POLICY study_public_read ON "WordContentReview" FOR SELECT USING (true);
CREATE POLICY study_admin_write ON "WordContentReview" FOR ALL USING (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin')) WITH CHECK (current_setting('app.bypass_rls',true)='true' OR EXISTS (SELECT 1 FROM "User" WHERE "id"=NULLIF(current_setting('app.current_user_id',true),'') AND "role"='admin'));

COMMIT;
