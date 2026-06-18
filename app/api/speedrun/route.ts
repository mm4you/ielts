import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    
    // Fetch random words
    const collectionId = searchParams.get('collectionId');
    
    // Fetch random words
    const queryArgs: any = { where: {} };
    if (level !== 'all') {
      queryArgs.where.level = level;
    }
    if (collectionId) {
      queryArgs.where.collections = {
        some: { collectionId }
      };
    }

    const allWords = await prisma.word.findMany({
      where: queryArgs.where,
      select: { id: true, meaning_vi: true }
    });

    if (allWords.length === 0) {
      return NextResponse.json({ error: 'No words found' }, { status: 404 });
    }

    const take = 300;
    const shuffledIds = allWords.map(w => w.id).sort(() => 0.5 - Math.random()).slice(0, take);

    const words = await prisma.word.findMany({
      where: {
        id: { in: shuffledIds }
      }
    });

    // Shuffle words to keep it fully random
    const shuffledWords = words.sort(() => 0.5 - Math.random());
    
    // Extract meanings for distractors from all words in selection
    const allMeanings = allWords.map(w => w.meaning_vi);

    const questions = shuffledWords.map(word => {
      // Pick 3 random distractors that are not the correct meaning
      const distractors = allMeanings
        .filter(m => m !== word.meaning_vi)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
        
      // Combine and shuffle choices
      const choices = [word.meaning_vi, ...distractors].sort(() => 0.5 - Math.random());
      
      // Find the index of the correct answer
      const correctIndex = choices.indexOf(word.meaning_vi);

      return {
        id: word.id,
        word: word.word,
        pos: word.pos,
        choices: choices,
        correctIndex: correctIndex
      };
    });

    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words for speedrun' }, { status: 500 });
  }
}
