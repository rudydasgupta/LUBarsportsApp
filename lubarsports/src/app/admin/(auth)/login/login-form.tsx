"use client";

import { signIn } from "@/app/admin/actions/auth";
import { ActionForm, SubmitButton } from "@/components/admin/form-bits";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={signIn} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" autoFocus />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <SubmitButton className="btn btn-primary min-h-11 w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </ActionForm>
  );
}
