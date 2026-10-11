import type { ReactNode } from "react";

/** Shown when a list has nothing in it. Says why, and what to do next. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-start gap-2 px-5 py-8 sm:px-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <div className="max-w-prose text-muted">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export type Tone = "success" | "error" | "warning" | "info";

export function Notice({ tone, children, className = "" }: { tone: Tone; children: ReactNode; className?: string }) {
  const tones = {
    success: "border-win bg-win-wash",
    error: "border-loss bg-loss-wash",
    warning: "border-cue bg-cue-wash",
    info: "border-chalk bg-chalk-wash",
  } as const;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border-l-4 px-4 py-3 text-[0.9375rem] text-ink ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-2 text-chalk ${className}`}>
      <span aria-hidden="true" className="h-px w-6 bg-current" />
      {children}
    </p>
  );
}

export function PageHeading({
  title,
  eyebrow,
  children,
  lead,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-2.5">{eyebrow}</Eyebrow> : null}
        <h1 className="display text-[2.25rem] sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">{lead}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 id={id} className="display mt-2 text-[1.625rem] sm:text-[2rem]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function Arrow({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Wrapper for tables that may be wider than a phone screen. It scrolls
 * sideways, and is focusable and labelled so keyboard users can scroll it too.
 */
export function TableScroll({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`card overflow-x-auto ${className}`} tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  );
}
