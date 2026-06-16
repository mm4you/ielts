import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');

  try {
    const words = await prisma.word.findMany({
      where: {
        ...(level && level !== 'all' ? { level } : {})
      }
    });

    if (words.length < 4) {
      return NextResponse.json({ error: 'Not enough words to generate quiz' }, { status: 400 });
    }

    // Shuffle and pick 100
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 100);

    const questions = selectedWords.map((word) => {
      // Lấy 3 đáp án sai ngẫu nhiên
      const wrongAnswers = shuffled
        .filter((w) => w.id !== word.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.meaning_vi);

      const options = [word.meaning_vi, ...wrongAnswers].sort(() => 0.5 - Math.random());

      return {
        id: word.id,
        word: word.word,
        ipa: word.ipa,
        correctAnswer: word.meaning_vi,
        options,
      };
    });

    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
