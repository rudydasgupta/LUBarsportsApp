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
      teamId: 1 // Default to first team for demo
    };
  }
  
  // Check if it's a regular admin session
  if (sessionId.startsWith('admin_')) {
    const adminId = Number(sessionId.replace('admin_', ''));
    const admin = await prisma.captain.findUnique({
      where: { id: adminId },
      include: { team: true }
    });
    if (admin) {
      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName || 'Admin User',
        teamId: admin.teamId
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
  
  // Get the admin's team
  const team = await prisma.team.findUnique({
    where: { id: admin.teamId },
    include: { division: true },
  });
  
  if (!team) {
    return <div className="p-8 text-center">Team not found.</div>;
  }
  
  // Determine coordinator type from admin's home division
  const homeDivisionName = team.division.name;
  const isPoolCoordinator = homeDivisionName.toLowerCase().includes('pool');
  const isDartsCoordinator = homeDivisionName.toLowerCase().includes('darts');

  // Allowed divisions: CPC => all pool + dominoes; CDC => all darts + dominoes (case-insensitive filtering done in JS)
  const allDivisions = await prisma.division.findMany({ orderBy: { name: 'asc' } });
  const allowedDivisions = allDivisions.filter(d => {
    const dn = d.name.toLowerCase();
    if (isPoolCoordinator) return dn.includes('pool') || dn.includes('domino');
    if (isDartsCoordinator) return dn.includes('darts') || dn.includes('domino');
    return d.name === homeDivisionName;
  });

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
          coordinatorType={isPoolCoordinator ? 'CPC' : 'CDC'} 
          divisionName={selectedDivisionName} 
        />
      </div>
    </main>
  );
}
