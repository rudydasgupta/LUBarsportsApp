import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import SidebarNav from "./sidebar-nav";
import MobileHeader from "./mobile-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LU Bar Sports",
  description: "Lancaster University Bar Sports hub",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen site-bg`}
      >
        <div className="flex min-h-screen">
          {/* Mobile top header only */}
          <div className="md:hidden w-full fixed top-0 left-0 right-0 z-40">
            <MobileHeader />
          </div>
          {/* Desktop left sidebar */}
          <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 shadow-lg fixed top-0 left-0 h-full z-30">
            <div className="flex flex-col items-center py-8">
              <Link href="/" className="mb-8">
                <img src="/lubarsports-logo.png" alt="LU Bar Sports Logo" width={96} height={96} className="rounded-full shadow" />
              </Link>
              <nav className="w-full">
                <SidebarNav />
              </nav>
            </div>
          </aside>
          <main className="flex-1 ml-0 md:ml-64 flex flex-col items-center justify-center min-h-[90vh] px-2 pt-16 md:pt-0">
            <div className="w-full max-w-4xl bg-white/80 rounded-2xl shadow-xl p-6 mt-8 mb-8 backdrop-blur-md">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
