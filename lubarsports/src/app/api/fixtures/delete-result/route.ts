import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAdminIdFromRequest } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const adminId = getAdminIdFromRequest(req);
    if (adminId === null) {
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

    // Check admin permissions based on admin type (same logic as submit-result)
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

    // Transaction: reverse points allocation and delete result
    await prisma.$transaction(async (tx) => {
      const prev = fixture.result!;
      const toPoints = (hs: number, as: number) => {
        // New system: 1 point per game/frame won + 2 points for match win
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


