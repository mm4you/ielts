import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { CollectionService } from '@/services/collection.service';
import { createCollectionSchema } from '@/lib/validations/collection';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn({ path: '/api/collections', method: 'GET' }, 'Unauthorized collection retrieval request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info({ userId: session.user.id, path: '/api/collections', method: 'GET' }, 'Retrieving user collections');
    const collections = await CollectionService.getUserCollections(session.user.id);
    return NextResponse.json(collections);
  } catch (error) {
    logger.error({ error, path: '/api/collections', method: 'GET' }, 'Error in GET /api/collections');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn({ path: '/api/collections', method: 'POST' }, 'Unauthorized collection creation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = createCollectionSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      logger.warn({ userId: session.user.id, errors: validation.error.format() }, 'Validation failed for collection creation');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    logger.info({ userId: session.user.id, name: validation.data.name }, 'Creating new collection');
    const collection = await CollectionService.createCollection(session.user.id, validation.data);

    return NextResponse.json(collection);
  } catch (error) {
    logger.error({ error, path: '/api/collections', method: 'POST' }, 'Error in POST /api/collections');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
