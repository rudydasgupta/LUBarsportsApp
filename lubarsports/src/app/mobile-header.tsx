"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import SidebarNav from "./sidebar-nav";
import TopNav from "./top-nav";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sticky top-0 left-0 right-0 bg-white border-b border-neutral-200 shadow z-40">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          aria-label="Open menu"
          className="p-2 rounded-md border border-neutral-300 text-neutral-700 active:scale-95"
          onClick={() => setOpen(true)}
          style={{ display: "inline-flex" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <Link href="/" className="">
          <img src="/lubarsports-logo.png" alt="LU Bar Sports Logo" width={40} height={40} className="rounded-full" />
        </Link>
        <div className="hidden md:block">
          <TopNav />
        </div>
        <div className="w-10 md:w-0" aria-hidden />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-xs bg-white shadow-2xl border-r border-neutral-200 animate-[slideIn_.15s_ease-out]">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="font-semibold">Menu</span>
              <button
                aria-label="Close menu"
                className="p-2 rounded-md border border-neutral-300 text-neutral-700 active:scale-95"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <nav className="w-full p-3" onClick={() => setOpen(false)}>
              <SidebarNav />
            </nav>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}


