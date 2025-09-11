"use client";
import Link from "next/link";
import { navLinks } from "./sidebar-nav";

export default function TopNav() {
  return (
    <nav className="hidden md:flex items-center gap-3">
      {(Array.isArray(navLinks) ? navLinks : []).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="px-3 py-2 rounded-md font-medium text-[color:var(--lu-red)] border border-[color:var(--lu-red)] bg-white hover:bg-[color:var(--lu-red)] hover:text-white transition"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}


