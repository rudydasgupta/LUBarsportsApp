import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // Get all divisions with teams (college name and points only)
  const divisions = await prisma.division.findMany({
    include: {
      teams: {
        select: {
          id: true,
          name: true,
          points: true,
        },
        orderBy: {
          points: 'desc',
        },
      },
    },
  });
  return NextResponse.json({ divisions });
} 