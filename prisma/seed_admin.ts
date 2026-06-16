import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 10, delayMs = 5000): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(`\n[DB] Connection failed. Retrying in ${delayMs/1000}s... (${i+1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

async function main() {
  const email = 'ungnhutkhang53@gmail.com';
  const plainPassword = 'admin'; // Simplified password
  
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  console.log(`Creating/Updating admin account for ${email}...`);

  await withRetry(() => prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email,
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
  }));

  console.log('Admin account ready!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
