import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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
    const adminId = formData.get('id') as string;
    
    if (!adminId) {
      return NextResponse.json({ error: 'Missing admin ID' }, { status: 400 });
    }

    // Delete the admin
    await prisma.admin.delete({
      where: { id: parseInt(adminId) }
    });

    return NextResponse.redirect(new URL('/admin', req.nextUrl.origin));
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
