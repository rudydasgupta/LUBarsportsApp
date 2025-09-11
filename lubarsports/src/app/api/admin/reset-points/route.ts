import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isSuperAdmin } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    if (!isSuperAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.team.updateMany({ data: { points: 0 } });
    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error('Error resetting points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


