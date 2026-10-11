import type { Metadata } from "next";
import { Notice } from "@/components/states";
import { requireUser } from "@/lib/auth";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/permissions";
import { PasswordForm, ProfileForm, SignOutEverywhere } from "./account-forms";

export const metadata: Metadata = { title: "Account" };

type Props = { searchParams: Promise<{ first?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireUser({ allowPasswordChange: true });
  return (
    <div className="space-y-6">
      <h1 className="display text-4xl">Account</h1>
      {user.mustChangePassword ? (
        <Notice tone="warning">
          <span className="font-semibold">Choose a new password to continue.</span> You signed in with a temporary password.
          {sp.first ? null : " Other admin pages open once it's changed."}
        </Notice>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="password-heading">
          <h2 id="password-heading" className="mb-4 text-xl font-bold">
            Password
          </h2>
          <PasswordForm />
        </section>
        <div className="space-y-6">
          <section className="card p-5" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="mb-4 text-xl font-bold">
              Profile
            </h2>
            <ProfileForm fullName={user.name} email={user.email} />
          </section>
          <section className="card p-5" aria-labelledby="access-heading">
            <h2 id="access-heading" className="text-xl font-bold">
              Access
            </h2>
            <p className="mt-2">
              <span className="font-semibold">{ROLE_LABEL[user.role]}</span>
              {user.college ? <> &middot; {user.college}</> : null}
            </p>
            <p className="text-[0.9375rem] text-muted">{ROLE_DESCRIPTION[user.role]}</p>
            <div className="mt-4">
              <SignOutEverywhere />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
