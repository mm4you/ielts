import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    
    // Fetch random words
    const queryArgs: any = {};
    if (level !== 'all') {
      queryArgs.where = { level };
    }

    const words = await prisma.word.findMany(queryArgs);
    
    if (!words || words.length === 0) {
      return NextResponse.json({ error: 'No words found' }, { status: 404 });
    }

    // Pick 50 random questions
    const shuffledWords = words.sort(() => 0.5 - Math.random()).slice(0, 50);
    const allEnglishWords = words.map(w => w.word);

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
