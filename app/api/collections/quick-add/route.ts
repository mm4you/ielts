import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const wordIdStr = searchParams.get('wordId');
    if (!wordIdStr) {
      return NextResponse.json({ error: 'wordId is required' }, { status: 400 });
    }
    const wordId = parseInt(wordIdStr, 10);
    if (isNaN(wordId)) {
      return NextResponse.json({ error: 'Invalid wordId' }, { status: 400 });
    }

    // Find all collections where this word is saved
    const savedRelations = await prisma.collectionWord.findMany({
      where: {
        wordId,
        collection: {
          userId: session.user.id
        }
      },
      select: {
        collectionId: true
      }
    });

    const savedCollectionIds = savedRelations.map((r: any) => r.collectionId);
    return NextResponse.json({ savedCollectionIds });
  } catch (error) {
    console.error('[QUICK_ADD_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wordId, collectionId } = await request.json();
    const parsedWordId = parseInt(wordId, 10);
    if (isNaN(parsedWordId)) {
      return NextResponse.json({ error: 'Invalid wordId' }, { status: 400 });
    }

    // 1. Get or create target collection
    let targetCollectionId = collectionId;
    let collection;

    if (!targetCollectionId) {
      // Find user's last updated collection
      const lastCollection = await prisma.collection.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' }
      });

      if (lastCollection) {
        collection = lastCollection;
        targetCollectionId = lastCollection.id;
      } else {
        // Create default collection if none exists
        collection = await prisma.collection.create({
          data: {
            name: 'Sổ tay từ vựng',
            description: 'Bộ sưu tập mặc định của tôi',
            userId: session.user.id
          }
        });
        targetCollectionId = collection.id;
      }
    } else {
      collection = await prisma.collection.findUnique({
        where: { id: targetCollectionId }
      });
      if (!collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }
      if (collection.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 2. Toggle word in collection
    const existing = await prisma.collectionWord.findUnique({
      where: {
        collectionId_wordId: {
          collectionId: targetCollectionId,
          wordId: parsedWordId
        }
      }
    });

    let added = false;
    if (existing) {
      await prisma.collectionWord.delete({
        where: {
          collectionId_wordId: {
            collectionId: targetCollectionId,
            wordId: parsedWordId
          }
        }
      });
      added = false;
    } else {
      await prisma.collectionWord.create({
        data: {
          collectionId: targetCollectionId,
          wordId: parsedWordId
        }
      });
      added = true;

      // Update the collection's updatedAt timestamp to mark it as most recently active
      await prisma.collection.update({
        where: { id: targetCollectionId },
        data: { updatedAt: new Date() }
      });
    }

    return NextResponse.json({ added, collection });
  } catch (error) {
    console.error('[QUICK_ADD_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
