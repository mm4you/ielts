import dnsPromises from 'node:dns/promises';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

async function getIpv4ConnectionString(url: string | undefined): Promise<string | undefined> {
  if (!url) return url;
  // Parse host from: postgresql://user:password@host:port/db...
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
        console.log(`[NEON] Appended project option: ${endpointId}`);
      }
      console.log(`[DNS] Resolved hostname ${host} -> ${ipv4Host}`);
      return replaced;
    }
  } catch (err) {
    console.warn(`[DNS] Failed to resolve ${host} to IPv4:`, err);
  }
  return url;
}

let prisma: PrismaClient;


async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `backup-${timestamp}`);
  
  console.log(`[BACKUP] Khởi động tiến trình sao lưu cơ sở dữ liệu...`);
  console.log(`[BACKUP] Thư mục sao lưu: ${backupDir}`);

  try {
    const url = await getIpv4ConnectionString(process.env.DATABASE_URL);
    prisma = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }


    // 1. Sao lưu bảng User
    console.log('[BACKUP] Đang tải dữ liệu User...');
    const users = await prisma.user.findMany();
    fs.writeFileSync(path.join(backupDir, 'User.json'), JSON.stringify(users, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${users.length} người dùng.`);

    // 2. Sao lưu bảng Account
    console.log('[BACKUP] Đang tải dữ liệu Account...');
    const accounts = await prisma.account.findMany();
    fs.writeFileSync(path.join(backupDir, 'Account.json'), JSON.stringify(accounts, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${accounts.length} liên kết tài khoản.`);

    // 3. Sao lưu bảng Session
    console.log('[BACKUP] Đang tải dữ liệu Session...');
    const sessions = await prisma.session.findMany();
    fs.writeFileSync(path.join(backupDir, 'Session.json'), JSON.stringify(sessions, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${sessions.length} phiên đăng nhập.`);

    // 4. Sao lưu bảng VerificationToken
    console.log('[BACKUP] Đang tải dữ liệu VerificationToken...');
    const verificationTokens = await prisma.verificationToken.findMany();
    fs.writeFileSync(path.join(backupDir, 'VerificationToken.json'), JSON.stringify(verificationTokens, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${verificationTokens.length} mã xác minh.`);

    // 5. Sao lưu bảng UserProgress
    console.log('[BACKUP] Đang tải dữ liệu UserProgress...');
    const userProgress = await prisma.userProgress.findMany();
    fs.writeFileSync(path.join(backupDir, 'UserProgress.json'), JSON.stringify(userProgress, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${userProgress.length} bản ghi tiến trình học.`);

    // 6. Sao lưu bảng DailyActivity
    console.log('[BACKUP] Đang tải dữ liệu DailyActivity...');
    const dailyActivities = await prisma.dailyActivity.findMany();
    fs.writeFileSync(path.join(backupDir, 'DailyActivity.json'), JSON.stringify(dailyActivities, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${dailyActivities.length} nhật ký hoạt động.`);

    // 7. Sao lưu bảng Collection
    console.log('[BACKUP] Đang tải dữ liệu Collection...');
    const collections = await prisma.collection.findMany();
    fs.writeFileSync(path.join(backupDir, 'Collection.json'), JSON.stringify(collections, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${collections.length} bộ sưu tập.`);

    // 8. Sao lưu bảng CollectionWord
    console.log('[BACKUP] Đang tải dữ liệu CollectionWord...');
    const collectionWords = await prisma.collectionWord.findMany();
    fs.writeFileSync(path.join(backupDir, 'CollectionWord.json'), JSON.stringify(collectionWords, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${collectionWords.length} mối quan hệ từ vựng - bộ sưu tập.`);

    // 9. Sao lưu bảng Word (tùy chọn nhưng tốt nhất nên lưu)
    console.log('[BACKUP] Đang tải dữ liệu Word...');
    const words = await prisma.word.findMany();
    fs.writeFileSync(path.join(backupDir, 'Word.json'), JSON.stringify(words, null, 2));
    console.log(`[BACKUP] Đã sao lưu ${words.length} từ vựng từ điển.`);

    console.log(`\n[SUCCESS] SAO LƯU THÀNH CÔNG!`);
    console.log(`[SUCCESS] Toàn bộ dữ liệu của ${9} bảng đã được lưu tại: ${backupDir}`);
  } catch (error) {
    console.error(`\n[ERROR] Tiến trình sao lưu thất bại:`, error);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

backup();
