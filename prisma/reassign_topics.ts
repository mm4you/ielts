import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOPICS = [
  'Education',
  'Environment',
  'Technology',
  'Health',
  'Crime',
  'Government',
  'Work',
  'Culture',
  'Globalization',
];

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
  console.log('Fetching words with topic Academic...');
  const words = await withRetry(() => prisma.word.findMany({
    where: { topic: 'Academic' },
    select: { id: true }
  }));

  console.log(`Found ${words.length} words. Reassigning topics...`);

  let count = 0;
  for (const word of words) {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    await withRetry(() => prisma.word.update({
      where: { id: word.id },
      data: { topic: randomTopic }
    }));
    count++;
    if (count % 100 === 0) console.log(`Updated ${count}/${words.length}`);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
