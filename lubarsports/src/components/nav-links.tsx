"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

const base =
  "relative shrink-0 rounded-lg px-3 py-1.5 text-[0.9375rem] font-semibold outline-white transition-colors after:absolute after:inset-x-3 after:-bottom-[0.6875rem] after:h-0.5 after:rounded-full after:transition-opacity";
const idle = "text-white/65 after:opacity-0 hover:bg-white/[0.06] hover:text-white";
const active = "text-white after:bg-[#ff3b52] after:opacity-100 after:shadow-[0_0_12px_2px_rgba(255,59,82,0.55)]";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items }: { items: readonly Item[] }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const current = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`${base} ${current ? active : idle}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
