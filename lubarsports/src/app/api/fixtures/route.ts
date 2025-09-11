import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  // Fetch all fixtures, including division and team info
  const fixtures = await prisma.fixture.findMany({
    include: {
      division: true,
      homeTeam: true,
      awayTeam: true,
      result: true,
    },
    orderBy: [
      { date: "asc" },
      { divisionId: "asc" },
    ],
  });

  // Map to frontend format
  const formatted = fixtures.map(f => ({
    id: f.id,
    week: getWeekNumber(f.date),
    date: f.date,
    division: f.division.name,
    homeTeam: { name: f.homeTeam.name },
    awayTeam: { name: f.awayTeam.name },
    result: f.result ? {
      homeScore: f.result.homeScore,
      awayScore: f.result.awayScore,
      details: f.result.details
    } : null,
  }));

  return NextResponse.json({ fixtures: formatted });
}

// Helper: Week number based on fixture date (assume week 1 is first fixture week)
function getWeekNumber(date: Date) {
  // For now, use the week field if present, else fallback to ISO week
  // (If you want to use a custom week calculation, adjust here)
  // This is a placeholder; you may want to improve this logic if needed.
  const d = new Date(date);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
  return 1 + Math.floor(days / 7);
} 