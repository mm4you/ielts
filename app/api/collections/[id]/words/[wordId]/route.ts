import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wordId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, wordId } = await params;
    const parsedWordId = parseInt(wordId, 10);
    if (isNaN(parsedWordId)) {
      return NextResponse.json({ error: 'Invalid wordId' }, { status: 400 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.collectionWord.delete({
      where: {
        collectionId_wordId: {
          collectionId: id,
          wordId: parsedWordId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[COLLECTION_WORD_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
