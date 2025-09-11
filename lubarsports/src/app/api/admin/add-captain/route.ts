import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const teamId = Number(formData.get('teamId'));
  if (!email || !password || !teamId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.captain.create({
    data: { email, password: hashed, teamId, ...(fullName ? { fullName } : {}) },
  });
  return NextResponse.redirect(new URL('/admin', req.nextUrl.origin));
} 