import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Allow viewing if it belongs to the user OR is public
    if (collection.userId !== session.user.id && !collection.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const collectionWords = await prisma.collectionWord.findMany({
      where: { collectionId: id },
      include: {
        word: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const words = collectionWords.map((cw: any) => cw.word);
    return NextResponse.json({ collection, words });
  } catch (error) {
    console.error('[COLLECTION_WORDS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { wordId } = await request.json();
    const parsedWordId = parseInt(wordId, 10);
    if (isNaN(parsedWordId)) {
      return NextResponse.json({ error: 'Invalid wordId' }, { status: 400 });
    }

    // Verify word exists
    const wordExists = await prisma.word.findUnique({
      where: { id: parsedWordId }
    });
    if (!wordExists) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    // Create relation if it doesn't exist
    const relation = await prisma.collectionWord.upsert({
      where: {
        collectionId_wordId: {
          collectionId: id,
          wordId: parsedWordId
        }
      },
      create: {
        collectionId: id,
        wordId: parsedWordId
      },
      update: {} // No-op if already exists
    });

    return NextResponse.json(relation);
  } catch (error) {
    console.error('[COLLECTION_WORDS_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
