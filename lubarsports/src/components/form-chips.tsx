import type { Outcome } from "@/lib/standings";

const WORD = { W: "won", D: "drew", L: "lost" } as const;

/** Recent results, most recent first: filled for a win, grey for a draw, outlined for a loss. */
export function FormChips({ form, size = "sm" }: { form: readonly Outcome[]; size?: "sm" | "md" }) {
  if (form.length === 0) return <span className="text-[0.8125rem] text-muted">&ndash;</span>;
  const box = size === "md" ? "size-7 text-sm" : "size-5 text-[0.6875rem]";
  const summary = form.map((o) => WORD[o]).join(", ");
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Last ${form.length}, most recent first: ${summary}`}>
      {form.map((outcome, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`inline-flex ${box} items-center justify-center rounded-[4px] font-bold leading-none ${
            outcome === "W"
              ? "bg-win text-surface"
              : outcome === "D"
                ? "bg-draw/25 text-ink"
                : "border border-loss text-loss"
          }`}
        >
          {outcome}
        </span>
      ))}
    </span>
  );
}
