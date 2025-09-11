"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/pool", label: "Pool" },
  { href: "/darts", label: "Darts" },
  { href: "/dominoes", label: "Dominoes" },
  { href: "/colleges", label: "College Home Pages" },
  { href: "/fixtures", label: "Fixture Lists" },
];

export default function SidebarNav() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsAdmin(document.cookie.includes('admin_session='));
    }
  }, []);
  return (
    <ul className="space-y-4 w-full px-4">
      {navLinks.map(link => (
        <li key={link.href}>
          <Link href={link.href} className="block w-full text-center py-3 px-4 rounded-lg font-semibold text-lg text-[color:var(--lu-red)] border-2 border-[color:var(--lu-red)] bg-white hover:bg-[color:var(--lu-red)] hover:text-white transition shadow-sm">
            {link.label}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/login" className="block w-full text-center py-3 px-4 rounded-lg font-semibold text-lg bg-[color:var(--lu-red)] text-white border-2 border-[color:var(--lu-red)] hover:bg-white hover:text-[color:var(--lu-red)] transition shadow-lg mt-8">
          Admin Login
        </Link>
      </li>
      {isAdmin && (
        <li>
          <Link href="/admin" className="block w-full text-center py-3 px-4 rounded-lg font-semibold text-lg bg-black text-white border-2 border-black hover:bg-white hover:text-black transition shadow-lg mt-8">
            Admin Area
          </Link>
        </li>
      )}
    </ul>
  );
} 