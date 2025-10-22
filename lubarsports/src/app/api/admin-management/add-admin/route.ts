import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Check if user is super admin
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('admin_session')?.value;
    if (sessionValue !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    console.log('Received form data:', { fullName, email });
    
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
  
  const hashed = await bcrypt.hash(password, 10);
  
  // Create admin user (not captain - admins are not tied to specific teams)
  try {
    await prisma.admin.create({
      data: { 
        email, 
        password: hashed, 
        adminType: 'GENERAL', // General admin can access all leagues
        ...(fullName ? { fullName } : {}) 
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    throw error;
  }
  
    return NextResponse.redirect(new URL('/admin-management', req.nextUrl.origin));
  } catch (error) {
    console.error('Error in add-admin API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
