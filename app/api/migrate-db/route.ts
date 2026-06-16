import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attempt to add the pos column if it doesn't exist
    await prisma.$executeRawUnsafe(`ALTER TABLE "Word" ADD COLUMN IF NOT EXISTS "pos" TEXT;`);
    
    return NextResponse.json({
      success: true,
      message: 'Migration successful! Column "pos" added.'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
