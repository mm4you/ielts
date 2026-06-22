import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');

  try {
    const whereClause = {
      ...(level && level !== 'all' ? { level } : {})
    };

    const totalCount = await prisma.word.count({
      where: whereClause
    });

    if (totalCount < 4) {
      return NextResponse.json({ error: 'Not enough words to generate quiz' }, { status: 400 });
    }

    const take = Math.min(100, totalCount);
    const skip = totalCount > take ? Math.floor(Math.random() * (totalCount - take + 1)) : 0;

    const words = await prisma.word.findMany({
      where: whereClause,
      skip: skip,
      take: take
    });

    // Shuffle words to pick random questions
    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    const selectedMeanings = shuffledWords.map((w) => w.meaning_vi);

    const questions = shuffledWords.map((word) => {
      // Lấy 3 đáp án sai ngẫu nhiên từ danh sách các từ đã chọn
      const wrongAnswers = selectedMeanings
        .filter((m) => m !== word.meaning_vi)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

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
