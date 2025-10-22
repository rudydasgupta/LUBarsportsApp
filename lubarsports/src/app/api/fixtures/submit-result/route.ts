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

    // Check admin permissions based on admin type
    let hasPermission = false;
    
    // Check if it's a super admin (id = 0)
    if (adminId === 0) {
      hasPermission = true;
    } else {
      // Check Admin table first
      const generalAdmin = await prisma.admin.findUnique({
        where: { id: adminId }
      });
      
      if (generalAdmin) {
        // General admin can access all divisions
        hasPermission = true;
      } else {
        // Check Captain table for coordinators
        const captain = await prisma.captain.findUnique({
          where: { id: adminId },
          include: { team: { include: { division: true } } }
        });
        
        if (captain) {
          const adminType = captain.adminType;
          const fixtureDivisionName = fixture.division.name.toLowerCase();
          
          if (adminType === 'CPC') {
            // College Pool Coordinator can access pool and dominoes
            hasPermission = fixtureDivisionName.includes('pool') || fixtureDivisionName.includes('domino');
          } else if (adminType === 'CDC') {
            // College Darts Coordinator can access darts and dominoes
            hasPermission = fixtureDivisionName.includes('darts') || fixtureDivisionName.includes('domino');
          } else {
            // Regular captain can only access their own division
            hasPermission = captain.team.division.name === fixture.division.name;
          }
        }
      }
    }
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied for this division' }, { status: 403 });
    }

    // Idempotent points update with transaction: apply delta vs previous result
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.result.findUnique({ where: { fixtureId } });

      // Helper to compute points for home/away based on scores
      // New system: 1 point per game/frame won + 2 points for match win
      const toPoints = (hs: number, as: number) => {
        if (hs > as) {
          // Home team wins: gets points for games won + 2 bonus points for match win
          return { home: hs + 2, away: as };
        } else if (as > hs) {
          // Away team wins: gets points for games won + 2 bonus points for match win
          return { home: hs, away: as + 2 };
        } else {
          // Draw: each team gets points for games won (no bonus)
          return { home: hs, away: as };
        }
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
