import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get adminId from session
import { getAdminIdFromRequest } from '@/utils/auth';

export async function POST(req: NextRequest) {
  const adminId = getAdminIdFromRequest(req);
  if (!adminId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { fixtureId, gameNumber, playerName } = await req.json();
  if (!fixtureId || !gameNumber || !playerName) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }
  // Get admin's team
  const admin = await prisma.captain.findUnique({ where: { id: adminId }, include: { team: true } });
  if (!admin || !admin.team) return NextResponse.json({ error: 'No team found' }, { status: 400 });
  const teamId = admin.team.id;

  // Get fixture and division
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    include: { division: true, homeTeam: true, awayTeam: true, poolNominations: true },
  });
  if (!fixture) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  if (fixture.division.name !== "Women's+ Pool") return NextResponse.json({ error: 'Not a Women\'s+ Pool fixture' }, { status: 400 });

  // Determine whose turn it is
  const isHome = fixture.homeTeamId === teamId;
  const isAway = fixture.awayTeamId === teamId;
  if (!isHome && !isAway) return NextResponse.json({ error: 'Not your fixture' }, { status: 403 });
  const homeFirst = gameNumber % 2 === 0; // 1-based: game 1,3,5... away first; 2,4... home first
  const myTurn = (isHome && homeFirst) || (isAway && !homeFirst);
  if (!myTurn) return NextResponse.json({ error: 'Not your turn' }, { status: 403 });

  // Check if already locked
  const existing = await prisma.poolNomination.findUnique({
    where: { fixtureId_teamId_gameNumber: { fixtureId, teamId, gameNumber } },
  });
  if (existing && existing.locked) {
    return NextResponse.json({ error: 'Already locked' }, { status: 400 });
  }

  // Lock nomination
  await prisma.poolNomination.upsert({
    where: { fixtureId_teamId_gameNumber: { fixtureId, teamId, gameNumber } },
    update: { playerName, locked: true },
    create: { fixtureId, teamId, gameNumber, playerName, pickedFirst: false, brokeFirst: false, locked: true },
  });

  return NextResponse.json({ success: true });
} 