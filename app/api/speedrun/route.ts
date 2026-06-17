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

    // Shuffle words to pick 50
    const shuffledWords = words.sort(() => 0.5 - Math.random()).slice(0, 50);
    
    // Extract all meanings for distractors
    const allMeanings = words.map(w => w.meaning_vi);

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
