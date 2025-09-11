import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAdminIdFromRequest } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const adminId = getAdminIdFromRequest(req);
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fixtureId, homeScore, awayScore, details } = await req.json();

    if (!fixtureId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the fixture and verify the admin has permission to submit results for this division
    const fixture = await prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { 
        division: true,
        homeTeam: true,
        awayTeam: true
      }
    });

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    // Get the admin's team to check permissions
    const admin = await prisma.captain.findUnique({
      where: { id: adminId },
      include: { team: { include: { division: true } } }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Check if admin has permission for this division
    const adminDivisionName = admin.team.division.name.toLowerCase();
    const fixtureDivisionName = fixture.division.name.toLowerCase();
    
    // Allow if it's the same division or if the admin is a coordinator for the relevant sport
    const isPoolCoordinator = adminDivisionName.includes('pool') && fixtureDivisionName.includes('pool');
    const isDartsCoordinator = adminDivisionName.includes('darts') && fixtureDivisionName.includes('darts');
    
    if (!isPoolCoordinator && !isDartsCoordinator && adminDivisionName !== fixtureDivisionName) {
      return NextResponse.json({ error: 'Permission denied for this division' }, { status: 403 });
    }

    // Idempotent points update with transaction: apply delta vs previous result
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.result.findUnique({ where: { fixtureId } });

      // Helper to compute points for home/away based on scores
      const toPoints = (hs: number, as: number) => {
        if (hs > as) return { home: 3, away: 0 };
        if (as > hs) return { home: 0, away: 3 };
        return { home: 1, away: 1 };
      };

      const newScores = {
        home: parseInt(homeScore),
        away: parseInt(awayScore)
      };

      // Compute previous points allocation if any
      const prevPoints = existing ? toPoints(existing.homeScore, existing.awayScore) : { home: 0, away: 0 };
      const newPoints = toPoints(newScores.home, newScores.away);

      const deltaHome = newPoints.home - prevPoints.home;
      const deltaAway = newPoints.away - prevPoints.away;

      // Only adjust if there is any change
      if (deltaHome !== 0) {
        await tx.team.update({ where: { id: fixture.homeTeamId }, data: { points: { increment: deltaHome } } });
      }
      if (deltaAway !== 0) {
        await tx.team.update({ where: { id: fixture.awayTeamId }, data: { points: { increment: deltaAway } } });
      }

      // Upsert the result record itself
      const saved = await tx.result.upsert({
        where: { fixtureId },
        update: { homeScore: newScores.home, awayScore: newScores.away, details: details || null },
        create: { fixtureId, homeScore: newScores.home, awayScore: newScores.away, details: details || null }
      });

      return saved;
    });

    return NextResponse.json({ success: true, result: updated });

  } catch (error) {
    console.error('Error submitting result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
