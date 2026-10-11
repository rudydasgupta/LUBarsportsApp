/** What every admin form action returns, so forms can show the outcome in place. */
export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  warning?: string;
  /** One message per field, keyed by field name. */
  errors?: Record<string, string>;
  /** Shown once, e.g. a generated temporary password. */
  secret?: string;
  /** Changes on every success so forms know to reset. */
  savedAt?: number;
};

export const IDLE: ActionState = { status: "idle" };

export const fail = (message: string, errors?: Record<string, string>): ActionState => ({
  status: "error",
  message,
  errors,
});

export const ok = (message: string, extra: Partial<ActionState> = {}): ActionState => ({
  status: "success",
  message,
  savedAt: Date.now(),
  ...extra,
});

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function int(form: FormData, key: string): number | null {
  const s = str(form, key);
  if (s === "" || !/^-?\d+$/.test(s)) return null;
  return Number(s);
}
