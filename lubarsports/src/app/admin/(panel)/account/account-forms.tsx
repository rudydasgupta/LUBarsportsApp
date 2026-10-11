"use client";

import { changePassword, signOutEverywhere, updateProfile } from "@/app/admin/actions/auth";
import { ActionForm, FieldError, SubmitButton } from "@/components/admin/form-bits";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  return (
    <ActionForm action={updateProfile} className="space-y-4">
      {(state) => (
        <>
          <div>
            <label className="label" htmlFor="fullName">
              Name
            </label>
            <input id="fullName" name="fullName" defaultValue={fullName} className="input" required maxLength={80} aria-invalid={Boolean(state.errors?.fullName)} />
            <FieldError message={state.errors?.fullName} />
          </div>
          <div>
            <p className="label">Email</p>
            <p className="text-muted">{email}</p>
            <p className="hint">Ask a super admin if this needs to change.</p>
          </div>
          <SubmitButton className="btn">Save name</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} className="space-y-4" resetOnSuccess>
      {(state) => (
        <>
          <input type="text" name="username" autoComplete="username" className="hidden" aria-hidden="true" tabIndex={-1} />
          <div>
            <label className="label" htmlFor="current">
              Current password
            </label>
            <input id="current" name="current" type="password" autoComplete="current-password" required className="input" aria-invalid={Boolean(state.errors?.current)} />
            <FieldError message={state.errors?.current} />
          </div>
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
              className="input"
              aria-invalid={Boolean(state.errors?.password)}
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="hint">
              At least 10 characters. A few random words works well.
            </p>
            <FieldError message={state.errors?.password} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              New password again
            </label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" aria-invalid={Boolean(state.errors?.confirm)} />
            <FieldError message={state.errors?.confirm} />
          </div>
          <SubmitButton pendingLabel="Changing…">Change password</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function SignOutEverywhere() {
  return (
    <form action={signOutEverywhere}>
      <SubmitButton className="btn" pendingLabel="Signing out…">
        Sign out on every device
      </SubmitButton>
    </form>
  );
}
