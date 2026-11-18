CREATE TABLE IF NOT EXISTS "VoiceConsent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "version" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- statement
CREATE INDEX IF NOT EXISTS "VoiceConsent_userId_idx" ON "VoiceConsent" ("userId");
-- statement
ALTER TABLE "VoiceConsent" ENABLE ROW LEVEL SECURITY;
-- statement
ALTER TABLE "VoiceConsent" FORCE ROW LEVEL SECURITY;
-- statement
DROP POLICY IF EXISTS voice_consent_insert ON "VoiceConsent";
-- statement
CREATE POLICY voice_consent_insert ON "VoiceConsent" FOR INSERT
WITH CHECK ("userId" = current_setting('app.current_user_id', true));
-- statement
CREATE INDEX IF NOT EXISTS "BattleRoom_expiresAt_idx" ON "BattleRoom" ("expiresAt");
-- statement
DROP POLICY IF EXISTS room_cleanup_read ON "BattleRoom";
-- statement
CREATE POLICY room_cleanup_read ON "BattleRoom" FOR SELECT
USING (current_setting('app.room_cleanup', true) = 'true' AND "expiresAt" < now() - interval '24 hours');
-- statement
DROP POLICY IF EXISTS room_cleanup_delete ON "BattleRoom";
-- statement
CREATE POLICY room_cleanup_delete ON "BattleRoom" FOR DELETE
USING (current_setting('app.room_cleanup', true) = 'true' AND "expiresAt" < now() - interval '24 hours');
-- statement
DROP POLICY IF EXISTS room_cleanup_required ON "BattleRoom";
-- statement
CREATE POLICY room_cleanup_required ON "BattleRoom" AS RESTRICTIVE FOR DELETE
USING (current_setting('app.room_cleanup', true) = 'true' AND "expiresAt" < now() - interval '24 hours');
