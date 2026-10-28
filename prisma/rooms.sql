-- Additive room storage. Run with scripts/setup-rooms.ts; never reset existing tables.
CREATE TABLE IF NOT EXISTS "BattleRoom" (
  "code" TEXT PRIMARY KEY,
  "hostUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "state" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMPTZ NOT NULL DEFAULT now() + interval '2 hours'
);
-- statement
CREATE INDEX IF NOT EXISTS "BattleRoom_hostUserId_expiresAt_idx" ON "BattleRoom"("hostUserId", "expiresAt");
-- statement
CREATE TABLE IF NOT EXISTS "BattleRoomRate" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "windowStart" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "count" INTEGER NOT NULL DEFAULT 1
);
-- statement
ALTER TABLE "BattleRoom" ENABLE ROW LEVEL SECURITY;
-- statement
ALTER TABLE "BattleRoom" FORCE ROW LEVEL SECURITY;
-- statement
DROP POLICY IF EXISTS battle_room_scope ON "BattleRoom";
-- statement
CREATE POLICY battle_room_scope ON "BattleRoom"
USING (NULLIF(current_setting('app.current_user_id', true), '') IS NOT NULL AND ("code" = current_setting('app.room_code', true) OR ("hostUserId" = current_setting('app.current_user_id', true) AND current_setting('app.room_code', true) = '__create__')))
WITH CHECK (NULLIF(current_setting('app.current_user_id', true), '') IS NOT NULL AND ("code" = current_setting('app.room_code', true) OR ("hostUserId" = current_setting('app.current_user_id', true) AND current_setting('app.room_code', true) = '__create__')));
-- statement
ALTER TABLE "BattleRoomRate" ENABLE ROW LEVEL SECURITY;
-- statement
ALTER TABLE "BattleRoomRate" FORCE ROW LEVEL SECURITY;
-- statement
DROP POLICY IF EXISTS battle_room_rate_owner ON "BattleRoomRate";
-- statement
CREATE POLICY battle_room_rate_owner ON "BattleRoomRate" USING ("userId" = current_setting('app.current_user_id', true)) WITH CHECK ("userId" = current_setting('app.current_user_id', true));
