import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const getCachedWordById = unstable_cache(
  async (id: number) => {
    return prisma.word.findUnique({
      where: { id },
    });
  },
  ['word-by-id'],
  { tags: ['words'], revalidate: 86400 } // Cache for 24 hours
);


export class WordService {
  static async getWordById(id: number) {

    let word;
    // Standalone CLI scripts don't have Next.js incremental cache context, so bypass
    if (process.env.IS_SCRIPT === 'true') {
      word = await prisma.word.findUnique({
        where: { id },
      });
    } else {
      try {
        word = await getCachedWordById(id);
      } catch (err) {
        // Fallback if unstable_cache throws because of missing Next.js server context
        word = await prisma.word.findUnique({
          where: { id },
        });
      }
    }

    return word;
  }
}
