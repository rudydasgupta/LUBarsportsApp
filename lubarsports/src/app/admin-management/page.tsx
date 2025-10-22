import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AddAdminForm from "./AddAdminForm";

const prisma = new PrismaClient();
const SESSION_COOKIE = 'admin_session';

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId || sessionId !== 'super_admin') return null;
  return { id: 0, email: 'r.dasgupta@lancaster.ac.uk', fullName: 'Super Admin' };
}

export default async function AdminManagementPage() {
  const admin = await getAdminFromCookie();
  if (!admin) {
    redirect("/login");
  }
  
  // Only super admin can access this page
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionValue !== 'super_admin') {
    redirect("/results-input");
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <a 
            href="/admin" 
            className="menu-link inline-block px-4 py-2 text-lg font-semibold"
          >
            Back to Admin Dashboard
          </a>
        </div>
        
        <p className="text-center text-gray-700">
          Welcome, {admin.fullName || admin.email}! Here you can add new admin users.
        </p>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
          <AddAdminForm />
        </div>
      </div>
    </main>
  );
}
