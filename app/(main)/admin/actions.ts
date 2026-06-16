'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
}

export async function createWord(data: {
  word: string;
  ipa?: string;
  meaning_vi: string;
  example?: string;
  synonyms?: string;
  topic: string;
  level: string;
}) {
  await checkAdmin();
  const word = await prisma.word.create({ data });
  revalidatePath('/library');
  revalidatePath('/admin');
  return word;
}

export async function updateWord(id: number, data: {
  word: string;
  ipa?: string;
  meaning_vi: string;
  example?: string;
  synonyms?: string;
  topic: string;
  level: string;
}) {
  await checkAdmin();
  const word = await prisma.word.update({
    where: { id },
    data,
  });
  revalidatePath('/library');
  revalidatePath('/admin');
  revalidatePath(`/word/${id}`);
  return word;
}

export async function deleteWord(id: number) {
  await checkAdmin();
  // Note: due to cascade, if it has relation with user progress, we should delete those first or configure cascade in schema.
  // We added onDelete: Cascade in prisma schema for userProgress, so this is safe!
  await prisma.word.delete({ where: { id } });
  revalidatePath('/library');
  revalidatePath('/admin');
  return true;
}
