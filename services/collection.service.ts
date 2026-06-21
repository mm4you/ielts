import { prisma } from '@/lib/prisma';

export class CollectionService {
  static async getUserCollections(userId: string) {
    return prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { words: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createCollection(userId: string, data: { name: string; description?: string | null; isPublic?: boolean }) {
    return prisma.collection.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isPublic: !!data.isPublic,
        userId
      }
    });
  }

  static async updateCollection(
    userId: string,
    collectionId: string,
    data: { name?: string; description?: string | null; isPublic?: boolean }
  ) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new Error('Forbidden');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }
    if (data.isPublic !== undefined) {
      updateData.isPublic = !!data.isPublic;
    }

    return prisma.collection.update({
      where: { id: collectionId },
      data: updateData
    });
  }

  static async deleteCollection(userId: string, collectionId: string) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      throw new Error('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new Error('Forbidden');
    }

    await prisma.collection.delete({
      where: { id: collectionId }
    });

    return true;
  }
}
