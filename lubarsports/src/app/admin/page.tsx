import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AddAdminForm from "../admin-management/AddAdminForm";
import ResetPointsButton from "./ResetPointsButton";

const prisma = new PrismaClient();

async function getCaptains() {
  return prisma.captain.findMany({
    include: { team: { include: { division: true } } },
    orderBy: { email: "asc" },
  });
}

async function getTeams() {
  return prisma.team.findMany({
    include: { division: true },
    orderBy: [{ name: "asc" }, { division: { name: "asc" } }],
  });
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("admin_session")?.value;
  const isSuperAdmin = sessionValue === "super_admin";
  
  // Only super admin can access this page
  if (!isSuperAdmin) {
    redirect("/results-input");
  }

  const captains = await getCaptains();
  const teams = await getTeams();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <a 
              href="/admin-management" 
              className="menu-link inline-block px-4 py-2 text-sm font-semibold"
            >
              Manage Admins
            </a>
            <a 
              href="/results-input" 
              className="menu-link inline-block px-4 py-2 text-sm font-semibold"
            >
              Results Input
            </a>
            <ResetPointsButton />
          </div>
        </div>
        <section>
          <h2 className="text-xl font-semibold mb-2">All Admins</h2>
          <table className="min-w-full border border-gray-300 mb-4">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-2 border">Full Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Coordinator Type</th>
                <th className="px-4 py-2 border">League</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {captains.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 border">{c.fullName || "-"}</td>
                  <td className="px-4 py-2 border">{c.email}</td>
                  <td className="px-4 py-2 border">{
                    (() => {
                      const dn = c.team?.division?.name?.toLowerCase() || '';
                      if (dn.includes('pool')) return 'CPC';
                      if (dn.includes('darts')) return 'CDC';
                      return '-';
                    })()
                  }</td>
                  <td className="px-4 py-2 border">{
                    (() => {
                      const dn = c.team?.division?.name?.toLowerCase() || '';
                      if (dn.includes('women')) return "Women's+";
                      return "Open's";
                    })()
                  }</td>
                  <td className="px-4 py-2 border text-center">
                    <form action={`/api/admin/delete-captain`} method="POST" style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-red-600 underline hover:text-red-800">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Add Admin</h2>
          <AddAdminForm teams={teams} />
        </section>
      </div>
    </main>
  );
} 