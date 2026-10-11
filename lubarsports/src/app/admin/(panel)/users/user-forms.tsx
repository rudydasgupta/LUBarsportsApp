"use client";

import { useState } from "react";
import { createUser, deleteUser, resetPassword, updateUser } from "@/app/admin/actions/users";
import { ActionForm, ConfirmAction, FieldError, SubmitButton } from "@/components/admin/form-bits";
import { COLLEGE_NAMES } from "@/lib/config";
import { ROLE_DESCRIPTION, ROLE_LABEL, ROLES, type Role } from "@/lib/permissions";

export type UserRow = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  college: string | null;
  active: boolean;
  lastLogin: string | null;
  isSelf: boolean;
};

function RoleAndCollege({ role: initialRole, college, errors, idPrefix }: { role: Role; college: string | null; errors?: Record<string, string>; idPrefix: string }) {
  const [role, setRole] = useState<Role>(initialRole);
  const coordinator = role === "CPC" || role === "CDC";
  return (
    <>
      <div>
        <label className="label" htmlFor={`${idPrefix}-role`}>
          Role
        </label>
        <select id={`${idPrefix}-role`} name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="input select" aria-describedby={`${idPrefix}-role-hint`}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <p id={`${idPrefix}-role-hint`} className="hint">
          {ROLE_DESCRIPTION[role]}
        </p>
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-college`}>
          College {coordinator ? null : <span className="font-normal text-muted">(coordinators only)</span>}
        </label>
        <select
          id={`${idPrefix}-college`}
          name="college"
          defaultValue={college ?? ""}
          disabled={!coordinator}
          required={coordinator}
          className="input select"
          aria-invalid={Boolean(errors?.college)}
        >
          <option value="">Choose…</option>
          {COLLEGE_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <FieldError message={errors?.college} />
      </div>
    </>
  );
}

export function AddUserForm() {
  return (
    <ActionForm action={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
      {(state) => (
        <>
          <div>
            <label className="label" htmlFor="new-name">
              Name
            </label>
            <input id="new-name" name="fullName" className="input" required maxLength={80} aria-invalid={Boolean(state.errors?.fullName)} />
            <FieldError message={state.errors?.fullName} />
          </div>
          <div>
            <label className="label" htmlFor="new-email">
              Email
            </label>
            <input id="new-email" name="email" type="email" className="input" required aria-invalid={Boolean(state.errors?.email)} />
            <FieldError message={state.errors?.email} />
          </div>
          <RoleAndCollege role="GENERAL" college={null} errors={state.errors} idPrefix="new" />
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <SubmitButton pendingLabel="Adding…">Add admin</SubmitButton>
            <span className="text-[0.8125rem] text-muted">A temporary password is generated and shown once. They choose their own at first sign-in.</span>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function UserCard({ user }: { user: UserRow }) {
  return (
    <li className={`card p-4 sm:p-5 ${user.active ? "" : "opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {user.fullName || user.email}
            <span className={`tag ${user.role === "SUPER" ? "border-chalk text-chalk" : ""}`}>{ROLE_LABEL[user.role]}</span>
            {user.college ? <span className="tag">{user.college}</span> : null}
            {!user.active ? <span className="tag border-loss text-loss">Deactivated</span> : null}
            {user.isSelf ? <span className="tag border-win text-win">You</span> : null}
          </p>
          <p className="truncate text-[0.875rem] text-muted">{user.email}</p>
          <p className="text-[0.8125rem] text-muted">{user.lastLogin ? `Last signed in ${user.lastLogin}` : "Hasn't signed in to the new admin yet"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfirmAction
            action={resetPassword}
            fields={{ id: String(user.id) }}
            trigger="Reset password"
            tone="primary"
            title={`Reset ${user.fullName || user.email}'s password?`}
            confirmLabel="Reset password"
          >
            They&apos;re signed out everywhere and get a temporary password, which you&apos;ll see here once. Send it to them privately.
          </ConfirmAction>
          {!user.isSelf ? (
            <ConfirmAction
              action={deleteUser}
              fields={{ id: String(user.id) }}
              trigger="Remove"
              triggerClassName="btn btn-sm btn-quiet text-loss"
              title={`Remove ${user.fullName || user.email}?`}
              confirmLabel="Remove account"
            >
              Their account is deleted. Results they entered stay. To pause access instead, untick Active.
            </ConfirmAction>
          ) : null}
        </div>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-[0.875rem] font-semibold text-chalk">Edit access</summary>
        <ActionForm action={updateUser} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
          {(state) => (
            <>
              <input type="hidden" name="id" value={user.id} />
              <div>
                <label className="label" htmlFor={`u${user.id}-name`}>
                  Name
                </label>
                <input id={`u${user.id}-name`} name="fullName" defaultValue={user.fullName} className="input" required aria-invalid={Boolean(state.errors?.fullName)} />
                <FieldError message={state.errors?.fullName} />
              </div>
              <RoleAndCollege role={user.role} college={user.college} errors={state.errors} idPrefix={`u${user.id}`} />
              <label className="flex items-center gap-2 text-[0.9375rem]">
                <input type="checkbox" name="active" defaultChecked={user.active} disabled={user.isSelf} className="size-4 accent-[var(--cloth)]" />
                Active
                {user.isSelf ? <input type="hidden" name="active" value="on" /> : null}
              </label>
              <div className="sm:col-span-2 lg:col-span-3">
                <SubmitButton className="btn btn-sm btn-primary">Save access</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      </details>
    </li>
  );
}
