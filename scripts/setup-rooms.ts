import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
config({ path: '.env.local', quiet: true });
config({ quiet: true });

async function main() {
  if (!process.env.ADMIN_DATABASE_URL || !process.env.DATABASE_URL) throw new Error('Cần ADMIN_DATABASE_URL và DATABASE_URL.');
  const role = decodeURIComponent(new URL(process.env.DATABASE_URL).username);
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(role)) throw new Error('Tên database role không hợp lệ.');
  const db = new PrismaClient({ datasources: { db: { url: process.env.ADMIN_DATABASE_URL } } });
  try {
    await db.$transaction(async tx => {
      for (const sql of readFileSync('prisma/rooms.sql', 'utf8').split('-- statement')) {
        if (sql.trim()) await tx.$executeRawUnsafe(sql);
      }
      // Role is validated above; all schema statements come from the checked-in migration.
      await tx.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE ON "BattleRoom", "BattleRoomRate" TO "${role}"`);
    });
    console.log('Đã tạo bảng phòng và chính sách phân quyền.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Không thể tạo bảng phòng. Kiểm tra kết nối và quyền quản trị database.'); process.exitCode = 1; });
