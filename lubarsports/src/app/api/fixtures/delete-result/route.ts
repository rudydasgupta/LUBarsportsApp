import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAdminIdFromRequest } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const adminId = getAdminIdFromRequest(req);
    if (!adminId && adminId !== 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fixtureId } = await req.json();
    if (!fixtureId) {
      return NextResponse.json({ error: 'Missing fixtureId' }, { status: 400 });
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { division: true, homeTeam: true, awayTeam: true, result: true }
    });
    if (!fixture) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    if (!fixture.result) return NextResponse.json({ success: true });

    // Check permission: same as submit route
    const admin = await prisma.captain.findUnique({
      where: { id: adminId === 0 ? undefined : adminId },
      include: { team: { include: { division: true } } }
    });
    if (adminId !== 0 && !admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    if (adminId !== 0) {
      const adminDivisionName = admin!.team.division.name.toLowerCase();
      const fixtureDivisionName = fixture.division.name.toLowerCase();
      const isPoolCoordinator = adminDivisionName.includes('pool') && fixtureDivisionName.includes('pool');
      const isDartsCoordinator = adminDivisionName.includes('darts') && fixtureDivisionName.includes('darts');
      if (!isPoolCoordinator && !isDartsCoordinator && adminDivisionName !== fixtureDivisionName) {
        return NextResponse.json({ error: 'Permission denied for this division' }, { status: 403 });
      }
    }

    // Transaction: reverse points allocation and delete result
    await prisma.$transaction(async (tx) => {
      const prev = fixture.result!;
      const toPoints = (hs: number, as: number) => {
        if (hs > as) return { home: 3, away: 0 };
        if (as > hs) return { home: 0, away: 3 };
        return { home: 1, away: 1 };
      };
      const prevPts = toPoints(prev.homeScore, prev.awayScore);
      if (prevPts.home !== 0) {
        await tx.team.update({ where: { id: fixture.homeTeamId }, data: { points: { decrement: prevPts.home } } });
      }
      if (prevPts.away !== 0) {
        await tx.team.update({ where: { id: fixture.awayTeamId }, data: { points: { decrement: prevPts.away } } });
      }
      await tx.result.delete({ where: { fixtureId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


