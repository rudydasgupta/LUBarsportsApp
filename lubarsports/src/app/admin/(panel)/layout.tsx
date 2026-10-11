import type { Metadata } from "next";
import { signOut } from "@/app/admin/actions/auth";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { overdueFixtures } from "@/lib/admin-data";
import { getSessionUser } from "@/lib/auth";
import { canManageLeagues, canManageSeasons, canManageUsers, canViewAudit, ROLE_LABEL } from "@/lib/permissions";
import { loadCurrentSeason } from "@/lib/season-data";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

/**
 * Frame shared by every admin page. It does not guard access: each page
 * calls requireUser() itself, and every action checks again.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) return <>{children}</>;

  const data = await loadCurrentSeason();
  const overdue = data ? overdueFixtures(data, user).length : 0;
  const items: AdminNavItem[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/results", label: "Results", badge: overdue || undefined },
    ...(canManageLeagues(user)
      ? [
          { href: "/admin/fixtures", label: "Fixtures" },
          { href: "/admin/leagues", label: "Leagues & points" },
          { href: "/admin/announcements", label: "Announcements" },
        ]
      : []),
    ...(canManageSeasons(user) ? [{ href: "/admin/seasons", label: "Seasons" }] : []),
    ...(canManageUsers(user) ? [{ href: "/admin/users", label: "Admins" }] : []),
    ...(canViewAudit(user) ? [{ href: "/admin/audit", label: "Audit log" }] : []),
    { href: "/admin/account", label: "Account" },
  ];

  return (
    <div>
      <div className="mb-6 border-b border-line pb-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex items-center gap-2 text-sm">
            <span className="eyebrow text-[0.625rem] text-chalk">Admin</span>
            <span className="text-muted">&middot;</span>
            <span className="font-semibold">{user.name}</span>
            <span className="tag">
              {ROLE_LABEL[user.role]}
              {user.college ? `, ${user.college}` : ""}
            </span>
          </p>
          <form action={signOut}>
            <button type="submit" className="link cursor-pointer text-sm">
              Sign out
            </button>
          </form>
        </div>
        <AdminNav items={items} />
      </div>
      {children}
    </div>
  );
}
