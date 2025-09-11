"use client";
import Image from "next/image";


export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
      <Image
        src="/lubarsports-logo.png"
        alt="LU Bar Sports Logo"
        width={180}
        height={180}
        className="mb-6"
      />
      <h1 className="text-4xl font-bold mb-8 text-center">Lancaster University Bar Sports</h1>
      <section className="max-w-xl text-center text-lg text-gray-700 bg-white/80 rounded-xl shadow p-6 mb-4">
        Welcome to the official hub for Lancaster University Bar Sports! Here you can find league tables, fixtures, results, and information for all college bar sports competitions, including Pool, Darts, and Dominoes. Explore your college&apos;s performance, upcoming matches, and more. Whether you&apos;re a player, supporter, or just curious, this site keeps you up to date with everything happening in LU Bar Sports.
      </section>
      <p className="max-w-xl text-center text-sm text-gray-500 mb-2">For issues with the site, contact Rudy Dasgupta.</p>
      {/* Navigation removed, now in sidebar */}
    </main>
  );
}
