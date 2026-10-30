'use server';

import { auth } from '@/auth';
import { prisma, studyTransaction } from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as {role?:string}).role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function createWord(data: {
  word: string;
  pos?: string;
  ipa?: string;
  meaning_vi: string;
  example?: string;
  synonyms?: string;
  topic: string;
  level: string;
}) {
  await checkAdmin();
  const word = await prisma.word.create({ data });
  updateTag('words');
  revalidatePath('/library');
  revalidatePath('/admin');
  return word;
}

export async function updateWord(id: number, data: {
  word: string;
  pos?: string;
  ipa?: string;
  meaning_vi: string;
  example?: string;
  synonyms?: string;
  topic: string;
  level: string;
}) {
  const userId = await checkAdmin();
  const word = await studyTransaction(userId, async tx=>{
    const updated=await tx.word.update({where:{id},data});
    await tx.wordContentReview.updateMany({where:{wordId:id},data:{status:'draft',reviewedBy:null,reviewedAt:null,acceptedAnswers:[]}});
    return updated;
  });
  updateTag('words');
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
  updateTag('words');
  revalidatePath('/library');
  revalidatePath('/admin');
  return true;
}
