import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import PoolUploadWrapper from "./PoolUploadWrapper";
import ResultsInput from "./results-input";

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

export default async function AdminAreaPage() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    redirect("/login");
  }
  
  // Only super admin and general admin can access admin area (for pool nominations)
  if (admin.adminType !== 'SUPER' && admin.adminType !== 'GENERAL') {
    redirect("/results-input");
  }
  
  // For super admin, show all divisions. For general admin, show all divisions too.
  const allDivisions = await prisma.division.findMany({ orderBy: { name: 'asc' } });
  const allowedDivisions = allDivisions;
  
  if (allowedDivisions.length === 0) {
    return <div className="p-8 text-center">No divisions available.</div>;
  }
  
  // Use the first division as default
  const divisionName = allowedDivisions[0].name;
  
  // Get fixtures for this division (both upcoming and past for results input)
  const fixtures = await prisma.fixture.findMany({
    where: {
      division: { name: divisionName },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      poolNominations: true,
      result: true,
    },
    orderBy: { date: "asc" },
  });
  // Serialize and shape fixtures for client components expecting specific types
  const fixturesSerialized = fixtures.map(f => ({
    id: f.id,
    date: (f.date instanceof Date ? f.date.toISOString() : (f.date as any)),
    homeTeam: { name: f.homeTeam.name },
    awayTeam: { name: f.awayTeam.name },
    result: f.result ? {
      homeScore: f.result.homeScore,
      awayScore: f.result.awayScore,
      details: f.result.details ?? undefined,
    } : undefined,
    // Additional fields retained for server-only consumers if needed by other sections
    poolNominations: f.poolNominations,
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
  }));

  // Narrow shape specifically for ResultsInput props
  type ResultsInputFixture = {
    id: number;
    date: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    result?: { homeScore: number; awayScore: number; details?: string };
  };
  const fixturesForResults: ResultsInputFixture[] = fixturesSerialized.map(f => ({
    id: f.id,
    date: f.date,
    homeTeam: f.homeTeam,
    awayTeam: f.awayTeam,
    result: f.result,
  }));

  // Get upcoming fixtures for pool nominations (only future fixtures)
  const upcomingFixtures = fixturesSerialized.filter(f => new Date(f.date) >= new Date());
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-4xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Area</h1>
          <div className="flex gap-2">
            <a 
              href="/results-input" 
              className="menu-link inline-block px-4 py-2 text-sm font-semibold"
            >
              Results Input
            </a>
            <a 
              href="/admin" 
              className="menu-link inline-block px-4 py-2 text-sm font-semibold"
            >
              Admin Dashboard
            </a>
          </div>
        </div>
        <p className="text-center text-gray-700 mb-4">
          Welcome, {admin.fullName || admin.email}! Here you can manage pool nominations and results for {divisionName}.
        </p>
        
        <section className="w-full">
          <h2 className="text-xl font-semibold mb-4">Pool Nominations</h2>
          <PoolUploadWrapper fixtures={upcomingFixtures} team={null} captain={admin} />
        </section>
        
        <section className="w-full">
          <ResultsInput 
            fixtures={fixturesForResults} 
            coordinatorType={admin.adminType || 'Admin'} 
            divisionName={divisionName} 
          />
        </section>
      </div>
    </main>
  );
} 