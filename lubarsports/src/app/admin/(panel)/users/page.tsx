import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { asRole, ROLE_DESCRIPTION, ROLE_LABEL, ROLES } from "@/lib/permissions";
import { AddUserForm, UserCard, type UserRow } from "./user-forms";

export const metadata: Metadata = { title: "Admins" };

const ORDER = { SUPER: 0, GENERAL: 1, CPC: 2, CDC: 3 } as const;

export default async function AdminUsersPage() {
  const me = await requireUser({ roles: ["SUPER"] });
  const admins = await db.admin.findMany();
  const rows: UserRow[] = admins
    .map((a) => ({
      id: a.id,
      fullName: a.fullName ?? "",
      email: a.email,
      role: asRole(a.adminType),
      college: a.college,
      active: a.active,
      lastLogin: a.lastLoginAt ? formatDateTime(a.lastLoginAt) : null,
      isSelf: a.id === me.id,
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || ORDER[a.role] - ORDER[b.role] || (a.fullName || a.email).localeCompare(b.fullName || b.email));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Admins</h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          {rows.filter((r) => r.active).length} active {rows.filter((r) => r.active).length === 1 ? "account" : "accounts"}.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <div key={r} className="card px-4 py-3">
            <dt className="flex items-baseline justify-between gap-2 font-bold">
              {ROLE_LABEL[r]}
              <span className="num text-[0.8125rem] font-semibold text-muted">{rows.filter((u) => u.role === r && u.active).length}</span>
            </dt>
            <dd className="mt-1 text-[0.8125rem] text-muted">{ROLE_DESCRIPTION[r]}</dd>
          </div>
        ))}
      </dl>

      <section className="card p-4 sm:p-5" aria-labelledby="add-heading">
        <h2 id="add-heading" className="mb-3 text-xl font-bold">
          Add an admin or coordinator
        </h2>
        <AddUserForm />
      </section>

      <ul className="space-y-3">
        {rows.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </ul>
    </div>
  );
}
