"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Notice } from "@/components/states";
import { IDLE, type ActionState } from "@/lib/action-state";

export type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>;

/** Pending state for forms submitted through useActionForm (see below). */
const PendingContext = createContext<{ pending: boolean; submitter: { name: string; value: string } | null } | null>(null);

/**
 * Runs a server action from a form without React's automatic form reset, so
 * nothing the user typed is lost when the server sends back an error.
 */
export function useActionForm(action: Action) {
  const [state, dispatch, pending] = useActionState(action, IDLE);
  const [submitter, setSubmitter] = useState<{ name: string; value: string } | null>(null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const by = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = new FormData(e.currentTarget, by);
    setSubmitter(by?.name ? { name: by.name, value: by.value } : null);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit, Provider: PendingContext.Provider, ctx: { pending, submitter } };
}

/** Submit button that disables itself and changes its label while saving. */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn btn-primary",
  name,
  value,
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const status = useFormStatus();
  const ctx = useContext(PendingContext);
  const pending = ctx ? ctx.pending : status.pending;
  // With several submit buttons in one form, only the pressed one shows as busy.
  const pressed = ctx ? (ctx.submitter?.name === name ? ctx.submitter?.value : undefined) : status.data?.get(name ?? "");
  const mine = pending && (!name || pressed === value);
  return (
    <button type="submit" className={className} name={name} value={value} disabled={pending || disabled}>
      {mine ? pendingLabel : children}
    </button>
  );
}

/** The outcome of the last submit, plus a one-time secret if there is one. */
export function FormMessages({ state }: { state: ActionState }) {
  const [copied, setCopied] = useState(false);
  if (!state.message && !state.warning) return null;
  return (
    <div className="col-span-full space-y-2">
      {state.message ? (
        <Notice tone={state.status === "error" ? "error" : "success"}>
          {state.message}
          {state.secret ? (
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <code className="num rounded-md border border-line-strong bg-surface px-2 py-1 text-[0.9375rem] font-bold">{state.secret}</code>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  navigator.clipboard?.writeText(state.secret!).then(() => setCopied(true));
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <span className="text-[0.8125rem] text-muted">Shown once. Send it to them privately.</span>
            </span>
          ) : null}
        </Notice>
      ) : null}
      {state.warning ? <Notice tone="warning">{state.warning}</Notice> : null}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}

/** A form wired to a server action, with its messages shown above the fields. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  messagesAt = "top",
}: {
  action: Action;
  children: React.ReactNode | ((state: ActionState) => React.ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  messagesAt?: "top" | "bottom";
}) {
  const { state, onSubmit, Provider, ctx } = useActionForm(action);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.status === "success") ref.current?.reset();
  }, [state, resetOnSuccess]);
  const messages = <FormMessages state={state} />;
  return (
    <Provider value={ctx}>
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {messagesAt === "top" ? messages : null}
        {typeof children === "function" ? children(state) : children}
        {messagesAt === "bottom" ? messages : null}
      </form>
    </Provider>
  );
}

/**
 * A button that asks "are you sure?" in a dialog before running a server
 * action. Uses the native <dialog>, which traps focus and closes on Escape.
 */
export function ConfirmAction({
  action,
  fields,
  trigger,
  triggerClassName = "btn btn-sm",
  triggerLabel,
  title,
  children,
  confirmLabel,
  tone = "danger",
}: {
  action: Action;
  fields: Record<string, string>;
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(action, IDLE);
  const titleId = useId();

  useEffect(() => {
    if (state.status === "success" && !state.secret) dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <button type="button" className={triggerClassName} aria-label={triggerLabel} onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,30rem)] rounded-xl border border-line-strong bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="p-5 text-left">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <div className="mt-2 text-[0.9375rem] text-muted">{children}</div>
          {state.status !== "idle" ? (
            <div className="mt-3">
              <FormMessages state={state} />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
              {state.secret ? "Done" : "Cancel"}
            </button>
            {!state.secret ? (
              <SubmitButton className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`} pendingLabel="Working…">
                {confirmLabel}
              </SubmitButton>
            ) : null}
          </div>
        </form>
      </dialog>
    </>
  );
}
