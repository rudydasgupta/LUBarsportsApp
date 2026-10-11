/**
 * A rank position as a small numbered tile. The top three get the red
 * treatment; everyone else a quiet outline. The number is always printed, so
 * colour is never the only way to read it.
 */

const SIZES = {
  sm: "h-7 min-w-7 px-1.5 text-[0.8125rem] rounded-md",
  lg: "h-12 min-w-12 px-2.5 text-xl rounded-xl",
} as const;

export function RankBall({ rank, size = "sm", label }: { rank: number; size?: keyof typeof SIZES; label?: string }) {
  const accessibleName = label ?? `Rank ${rank}`;
  const podium = rank >= 1 && rank <= 3;
  const tone = podium
    ? rank === 1
      ? "bg-[linear-gradient(160deg,#ff3b52,#b8141f_60%,#7a0b14)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_6px_18px_-6px_rgba(232,24,52,0.7)]"
      : "bg-[linear-gradient(160deg,#d81f37,#8f0f18)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
    : "border border-line-strong text-muted";

  return (
    <span className={`num inline-flex ${SIZES[size]} shrink-0 items-center justify-center font-bold leading-none ${tone}`}>
      <span className="sr-only">{accessibleName}</span>
      <span aria-hidden="true">{rank}</span>
    </span>
  );
}
