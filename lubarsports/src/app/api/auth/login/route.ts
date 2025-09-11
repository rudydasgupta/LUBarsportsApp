import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';

const prisma = new PrismaClient();


export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }
  // Super admin login logic (r.dasgupta@lancaster.ac.uk)
  if (email === 'r.dasgupta@lancaster.ac.uk' && password === 'Avengers2004') {
    const cookie = serialize('admin_session', 'super_admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
    });
    const res = NextResponse.json({ success: true, admin: true, superAdmin: true });
    res.headers.set('Set-Cookie', cookie);
    return res;
  }
  
  // Regular admin login logic (check database for other admins)
  const admin = await prisma.captain.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  // Create session for regular admin
  const cookie = serialize('admin_session', `admin_${admin.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
  });
  const res = NextResponse.json({ success: true, admin: true });
  res.headers.set('Set-Cookie', cookie);
  return res;
}

 