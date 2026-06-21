import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { CollectionService } from '@/services/collection.service';
import { updateCollectionSchema } from '@/lib/validations/collection';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn({ path: '/api/collections/[id]', method: 'PATCH' }, 'Unauthorized collection patch attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = updateCollectionSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ';
      logger.warn({ userId: session.user.id, collectionId: id, errors: validation.error.format() }, 'Validation failed for collection patch');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    logger.info({ userId: session.user.id, collectionId: id }, 'Updating collection');
    const updatedCollection = await CollectionService.updateCollection(
      session.user.id,
      id,
      validation.data
    );

    return NextResponse.json(updatedCollection);
  } catch (error: any) {
    logger.error({ error, path: '/api/collections/[id]', method: 'PATCH' }, 'Error in PATCH /api/collections/[id]');
    if (error.message === 'Collection not found') {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn({ path: '/api/collections/[id]', method: 'DELETE' }, 'Unauthorized collection delete attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    logger.info({ userId: session.user.id, collectionId: id }, 'Deleting collection');
    await CollectionService.deleteCollection(session.user.id, id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error({ error, path: '/api/collections/[id]', method: 'DELETE' }, 'Error in DELETE /api/collections/[id]');
    if (error.message === 'Collection not found') {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
