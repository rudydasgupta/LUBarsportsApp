import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ResultsInput from "../admin-area/results-input";
import { notFound } from "next/navigation";
import LeagueSelector from "../admin-area/LeagueSelector";

const prisma = new PrismaClient();
const SESSION_COOKIE = 'admin_session';

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  
  // Check if it's the super admin session
  if (sessionId === 'super_admin') {
    return {
      id: 0,
      email: 'r.dasgupta@lancaster.ac.uk',
      fullName: 'Super Admin',
      adminType: 'SUPER',
      teamId: null
    };
  }
  
  // Check if it's a general admin session
  if (sessionId.startsWith('admin_')) {
    const adminId = Number(sessionId.replace('admin_', ''));
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });
    if (admin) {
      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName || 'Admin User',
        adminType: admin.adminType,
        teamId: null
      };
    }
  }
  
  // Check if it's a captain session
  if (sessionId.startsWith('captain_')) {
    const captainId = Number(sessionId.replace('captain_', ''));
    const captain = await prisma.captain.findUnique({
      where: { id: captainId },
      include: { team: { include: { division: true } } }
    });
    if (captain) {
      return {
        id: captain.id,
        email: captain.email,
        fullName: captain.fullName || 'Captain',
        adminType: captain.adminType || 'CAPTAIN',
        teamId: captain.teamId,
        division: captain.team.division.name
      };
    }
  }
  
  return null;
}

export default async function ResultsInputPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const admin = await getAdminFromCookie();
  if (!admin) {
    redirect("/login");
  }
  
  // Determine allowed divisions based on admin type
  const allDivisions = await prisma.division.findMany({ orderBy: { name: 'asc' } });
  let allowedDivisions = allDivisions;
  
  if (admin.adminType === 'SUPER' || admin.adminType === 'GENERAL') {
    // Super admin and general admin can access all divisions
    allowedDivisions = allDivisions;
  } else if (admin.adminType === 'CPC') {
    // College Pool Coordinator can access pool and dominoes
    allowedDivisions = allDivisions.filter(d => {
      const dn = d.name.toLowerCase();
      return dn.includes('pool') || dn.includes('domino');
    });
  } else if (admin.adminType === 'CDC') {
    // College Darts Coordinator can access darts and dominoes
    allowedDivisions = allDivisions.filter(d => {
      const dn = d.name.toLowerCase();
      return dn.includes('darts') || dn.includes('domino');
    });
  } else if (admin.adminType === 'CAPTAIN' && admin.teamId) {
    // Regular captain can only access their own division
    const team = await prisma.team.findUnique({
      where: { id: admin.teamId },
      include: { division: true },
    });
    if (team) {
      allowedDivisions = [team.division];
    }
  }

  if (allowedDivisions.length === 0) {
    return <div className="p-8 text-center">No divisions available.</div>;
  }

  const selectedDivisionName = sp.division
    ? decodeURIComponent(sp.division)
    : allowedDivisions[0].name;

  // Guard: ensure selected division is permitted
  const isSelectedAllowed = allowedDivisions.some(d => d.name === selectedDivisionName);
  if (!isSelectedAllowed) {
    notFound();
  }
  
  // Get fixtures for this division (both upcoming and past for results input)
  const fixtures = await prisma.fixture.findMany({
    where: {
      division: { name: selectedDivisionName },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      result: true,
    },
    orderBy: { date: "asc" },
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-6xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Results Input</h1>
          <div className="flex gap-2">
            {admin.id === 0 && (
              <a 
                href="/admin" 
                className="menu-link inline-block px-4 py-2 text-sm font-semibold"
              >
                Admin Dashboard
              </a>
            )}
          </div>
        </div>
        
        <p className="text-center text-gray-700">
          Welcome, {admin.fullName || admin.email}! Input match results for {selectedDivisionName}.
        </p>
        <LeagueSelector divisions={allowedDivisions} selected={selectedDivisionName} />
        
        <ResultsInput 
          fixtures={fixtures} 
          coordinatorType={admin.adminType || 'Admin'} 
          divisionName={selectedDivisionName} 
        />
      </div>
    </main>
  );
}
