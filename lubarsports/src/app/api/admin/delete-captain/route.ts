import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Check if user is super admin
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get('admin_session')?.value;
  if (sessionValue !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const id = Number(formData.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  
  try {
    await prisma.captain.delete({ where: { id } });
    return NextResponse.redirect('/admin');
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
} 