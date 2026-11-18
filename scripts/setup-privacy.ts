import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local', quiet: true });
config({ quiet: true });

async function main() {
  const adminUrl = process.env.ADMIN_DATABASE_URL;
  const appUrl = process.env.DATABASE_URL;
  if (!adminUrl || !appUrl) throw new Error('Thiếu cấu hình database.');
  const admin = new URL(adminUrl);
  const app = new URL(appUrl);
  const directHost = (host: string) => host.replace('-pooler.', '.');
  if (directHost(admin.host) !== directHost(app.host) || admin.pathname !== app.pathname) {
    throw new Error('Hai kết nối phải trỏ tới cùng database.');
  }
  const role = decodeURIComponent(app.username);
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(role)) throw new Error('Database role không hợp lệ.');
  const db = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    await db.$transaction(async tx => {
      await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
      for (const sql of readFileSync('prisma/privacy-upgrade.sql', 'utf8').split('-- statement')) {
        if (sql.trim()) await tx.$executeRawUnsafe(sql.trim());
      }
      await tx.$executeRawUnsafe(`GRANT INSERT ON "VoiceConsent" TO "${role}"`);
      await tx.$executeRawUnsafe(`GRANT DELETE ON "BattleRoom" TO "${role}"`);
    });
    console.log('Đã áp dụng migration quyền riêng tư.');
  } finally {
    await db.$disconnect();
  }
}

main().catch(() => {
  console.error('Không áp dụng được migration quyền riêng tư. Kiểm tra kết nối và quyền quản trị.');
  process.exitCode = 1;
});
