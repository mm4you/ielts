import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Lấy 10 từ ngẫu nhiên để làm bài thi
    const words = await prisma.word.findMany({
      take: 40, // Lấy nhiều hơn một chút để chọn ngẫu nhiên
    });

    if (words.length < 4) {
      return NextResponse.json({ error: 'Not enough words to generate quiz' }, { status: 400 });
    }

    // Shuffle and pick 10
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 10);

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
