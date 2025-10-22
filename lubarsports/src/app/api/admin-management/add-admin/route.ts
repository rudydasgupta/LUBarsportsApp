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
    const coordinatorType = formData.get('coordinatorType') as string;
    const gender = formData.get('gender') as string;
    
    console.log('Received form data:', { fullName, email, coordinatorType, gender });
    
    if (!email || !password || !coordinatorType || !gender) {
      console.log('Missing fields:', { email: !!email, password: !!password, coordinatorType: !!coordinatorType, gender: !!gender });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
  
  // Find teams that match the coordinator type and gender
  const teams = await prisma.team.findMany({
    include: { division: true }
  });
  
    const filteredTeams = teams.filter(team => {
      const divisionName = team.division.name.toLowerCase();
      
      // Check coordinator type
      const isPool = coordinatorType === "CPC" && divisionName.includes("pool");
      const isDarts = coordinatorType === "CDC" && divisionName.includes("darts");
      
      // Check gender
      const isOpen = gender === "Open" && !divisionName.includes("women");
      const isWomens = gender === "Women" && divisionName.includes("women");
      
      return (isPool || isDarts) && (isOpen || isWomens);
    });
    
    console.log('Filtered teams:', filteredTeams.map(t => ({ name: t.name, division: t.division.name })));
    
    if (filteredTeams.length === 0) {
      console.log('No teams found for combination:', { coordinatorType, gender });
      return NextResponse.json({ error: 'No teams found for this combination' }, { status: 400 });
    }
  
  const hashed = await bcrypt.hash(password, 10);
  
  // Create admin for the first matching team (since email must be unique)
  // In a real system, you might want to create separate accounts for each team
  // or use a different approach for multi-team coordinators
  const firstTeam = filteredTeams[0];
  
  try {
    await prisma.captain.create({
      data: { 
        email, 
        password: hashed, 
        teamId: firstTeam.id,
        adminType: coordinatorType, // Persist CPC/CDC so permissions apply
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
