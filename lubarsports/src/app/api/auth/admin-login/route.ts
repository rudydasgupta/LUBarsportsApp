import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }
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
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
} 