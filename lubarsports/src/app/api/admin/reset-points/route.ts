import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isSuperAdmin } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    if (!isSuperAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset both points and clear all results in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reset all team points to zero
      const pointsResult = await tx.team.updateMany({ 
        data: { points: 0 } 
      });
      
      // Delete all results from fixtures
      const resultsResult = await tx.result.deleteMany({});
      
      return {
        teamsUpdated: pointsResult.count,
        resultsDeleted: resultsResult.count
      };
    });

    return NextResponse.json({ 
      success: true, 
      teamsUpdated: result.teamsUpdated,
      resultsDeleted: result.resultsDeleted
    });
  } catch (error) {
    console.error('Error resetting points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


