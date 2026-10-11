"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; badge?: number };

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:thin]">
      {items.map((item) => {
        const current = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[0.9375rem] font-semibold transition-colors ${
              current ? "bg-cloth text-on-cloth shadow-[0_6px_20px_-10px_var(--glow)]" : "text-muted hover:bg-raised hover:text-ink"
            }`}
          >
            {item.label}
            {item.badge ? (
              <span
                className={`num rounded-full px-1.5 text-[0.6875rem] leading-[1.125rem] ${
                  current ? "bg-white/20 text-white" : "bg-cue-wash text-cue"
                }`}
              >
                {item.badge}
                <span className="sr-only"> needing attention</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
