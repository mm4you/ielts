import dnsPromises from 'node:dns/promises';
import { PrismaClient } from '@prisma/client';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

async function getIpv4ConnectionString(url: string | undefined): Promise<string | undefined> {
  if (!url) return url;
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^/?#]+)(.*)/);
  if (!match) return url;
  const hostAndPort = match[3];
  const [host, port] = hostAndPort.split(':');
  try {
    const addresses = await dnsPromises.resolve4(host);
    if (addresses.length > 0) {
      const ipv4Host = addresses[0];
      const newHostAndPort = port ? `${ipv4Host}:${port}` : ipv4Host;
      let replaced = url.replace(hostAndPort, newHostAndPort);
      replaced = replaced.replace('channel_binding=require', 'channel_binding=disable');
      const endpointIdMatch = host.match(/^([a-z0-9-]+)-pooler/);
      if (endpointIdMatch) {
        const endpointId = endpointIdMatch[1];
        replaced += `&options=project%3D${endpointId}`;
      }
      return replaced;
    }
  } catch (err) {
    console.warn(`[DNS] Failed to resolve ${host} to IPv4:`, err);
  }
  return url;
}

async function setupRls() {
  console.log(`[RLS] Đang chuẩn bị kết nối cơ sở dữ liệu để cấu hình RLS...`);
  const originalUrl = process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL;
  const url = await getIpv4ConnectionString(originalUrl);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });

  try {
    console.log(`[RLS] Đang thực thi các lệnh DDL thiết lập RLS...`);

    // 1. Cấu hình bảng UserProgress
    console.log(`[RLS] Đang thiết lập RLS cho bảng UserProgress...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProgress" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "UserProgress" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_progress_isolation_policy ON "UserProgress";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_progress_isolation_policy ON "UserProgress"
      USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);

    // 2. Cấu hình bảng DailyActivity
    console.log(`[RLS] Đang thiết lập RLS cho bảng DailyActivity...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "DailyActivity" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "DailyActivity" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS daily_activity_isolation_policy ON "DailyActivity";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY daily_activity_isolation_policy ON "DailyActivity"
      USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);

    // 3. Cấu hình bảng Collection
    console.log(`[RLS] Đang thiết lập RLS cho bảng Collection...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Collection" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS collection_select_policy ON "Collection";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS collection_write_policy ON "Collection";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY collection_select_policy ON "Collection" FOR SELECT
      USING ("isPublic" = true OR "userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY collection_write_policy ON "Collection" FOR ALL
      USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);

    // 4. Cấu hình bảng CollectionWord
    console.log(`[RLS] Đang thiết lập RLS cho bảng CollectionWord...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "CollectionWord" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "CollectionWord" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS collection_word_select_policy ON "CollectionWord";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS collection_word_write_policy ON "CollectionWord";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY collection_word_select_policy ON "CollectionWord" FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM "Collection" c 
        WHERE c.id = "collectionId" 
        AND (c."isPublic" = true OR c."userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true')
      ));
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY collection_word_write_policy ON "CollectionWord" FOR ALL
      USING (EXISTS (
        SELECT 1 FROM "Collection" c 
        WHERE c.id = "collectionId" 
        AND (c."userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true')
      ));
    `);

    // 5. Cấu hình bảng Account
    console.log(`[RLS] Đang thiết lập RLS cho bảng Account...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Account" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS account_isolation_policy ON "Account";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY account_isolation_policy ON "Account"
      USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);

    // 6. Cấu hình bảng Session
    console.log(`[RLS] Đang thiết lập RLS cho bảng Session...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Session" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS session_isolation_policy ON "Session";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY session_isolation_policy ON "Session"
      USING ("userId" = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);

    // 7. Cấu hình bảng User (chú ý SELECT công khai)
    console.log(`[RLS] Đang thiết lập RLS cho bảng User...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" FORCE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_select_policy ON "User";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_write_policy ON "User";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_update_policy ON "User";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_delete_policy ON "User";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_insert_policy ON "User";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_select_policy ON "User" FOR SELECT
      USING (true);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_insert_policy ON "User" FOR INSERT
      WITH CHECK (true);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_update_policy ON "User" FOR UPDATE
      USING (id = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_delete_policy ON "User" FOR DELETE
      USING (id = NULLIF(current_setting('app.current_user_id', true), '') OR current_setting('app.bypass_rls', true) = 'true');
    `);

    console.log(`\n[SUCCESS] THIẾT LẬP RLS THÀNH CÔNG CHO TOÀN BỘ CÁC BẢNG TARGET!`);
  } catch (error) {
    console.error(`\n[ERROR] Thiết lập RLS thất bại:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupRls();
