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

export default async function AdminAreaPage() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    redirect("/login");
  }
  
  // Only super admin can access admin area (for pool nominations)
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionValue !== 'super_admin') {
    redirect("/results-input");
  }
  // Get the admin's team (for demo purposes)
  const team = await prisma.team.findUnique({
    where: { id: admin.teamId },
    include: { division: true },
  });
  
  if (!team) {
    return <div className="p-8 text-center">Team not found.</div>;
  }
  
  // Determine division name and coordinator type
  const divisionName = team.division.name;
  const isPoolCoordinator = divisionName.toLowerCase().includes('pool');
  const isDartsCoordinator = divisionName.toLowerCase().includes('darts');
  
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
  // Serialize dates for client components expecting string dates
  const fixturesSerialized = fixtures.map(f => ({
    ...f,
    date: (f.date instanceof Date ? f.date.toISOString() : (f.date as any)),
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
          Welcome, {admin.fullName || admin.email}! Here you can manage {isPoolCoordinator ? 'pool nominations and results' : 'results'} for {divisionName}.
        </p>
        
        {isPoolCoordinator && (
          <section className="w-full">
            <h2 className="text-xl font-semibold mb-4">Pool Nominations</h2>
            <PoolUploadWrapper fixtures={upcomingFixtures} team={team} captain={admin} />
          </section>
        )}
        
        <section className="w-full">
          <ResultsInput 
            fixtures={fixturesSerialized} 
            coordinatorType={isPoolCoordinator ? 'CPC' : 'CDC'} 
            divisionName={divisionName} 
          />
        </section>
      </div>
    </main>
  );
} 