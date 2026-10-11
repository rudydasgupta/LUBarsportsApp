import Link from "next/link";
import { site } from "@/lib/config";
import { LogoMark } from "./logo";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/leagues", label: "Leagues" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/colleges", label: "Colleges" },
  { href: "/archive", label: "Archive" },
] as const;

/** Always black, in both themes, with a red line along the bottom edge. */
export function SiteHeader({ seasonName }: { seasonName: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#07070a]/92 text-white backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:gap-x-6 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 rounded-lg outline-white">
          <LogoMark
            priority
            className="h-9 w-auto shrink-0 drop-shadow-[0_0_10px_rgba(232,24,52,0.45)] transition-transform sm:h-10 duration-500 group-hover:scale-105"
          />
          <span className="flex flex-col">
            <span className="display text-[1.1875rem] leading-none tracking-[-0.01em] sm:text-[1.375rem]">{site.name}</span>
            <span className="eyebrow mt-1 text-[0.5625rem] text-white/55">
              {seasonName ? `Season ${seasonName}` : "Lancaster University"}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-2 pb-1 [scrollbar-width:none] lg:order-none lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0 lg:pb-0"
        >
          <NavLinks items={PUBLIC_NAV} />
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/admin"
            prefetch={false}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm font-semibold sm:px-3 text-white/75 outline-white transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
          >
            Admin
          </Link>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="h-px bg-[linear-gradient(90deg,transparent,#c8102e_20%,#ff3b52_50%,#c8102e_80%,transparent)] opacity-70"
      />
    </header>
  );
}
