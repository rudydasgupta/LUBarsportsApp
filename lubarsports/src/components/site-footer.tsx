import Link from "next/link";
import { site } from "@/lib/config";
import { LogoMark } from "./logo";
import { PUBLIC_NAV } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-6 text-sm text-muted sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-auto opacity-90" />
          <p>
            <span className="font-semibold text-ink">{site.fullName}</span>
            <span className="block text-[0.8125rem]">
              Tables update the moment a result is entered. Problems with the site? Contact {site.contact}.
            </span>
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {PUBLIC_NAV.filter((i) => i.href !== "/").map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
