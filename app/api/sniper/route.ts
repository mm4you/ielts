import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    
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
      select: { id: true, word: true }
    });

    if (allWords.length === 0) {
      return NextResponse.json({ error: 'No words found' }, { status: 404 });
    }

    const take = 50;
    const shuffledIds = allWords.map(w => w.id).sort(() => 0.5 - Math.random()).slice(0, take);

    const words = await prisma.word.findMany({
      where: {
        id: { in: shuffledIds }
      }
    });

    // Shuffle words to pick 50 random questions
    const shuffledWords = words.sort(() => 0.5 - Math.random());
    const allEnglishWords = allWords.map(w => w.word);

    const questions = shuffledWords.map(word => {
      // Target is the meaning, choices are English words
      const distractors = allEnglishWords
        .filter(w => w !== word.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
        
      const choices = [word.word, ...distractors].sort(() => 0.5 - Math.random());
      const correctIndex = choices.indexOf(word.word);

      return {
        id: word.id,
        targetMeaning: word.meaning_vi,
        pos: word.pos,
        choices: choices,
        correctIndex: correctIndex
      };
    });

    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words for sniper' }, { status: 500 });
  }
}
