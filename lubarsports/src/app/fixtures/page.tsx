"use client";
import Link from "next/link";

export default function FixturesPage() {
  // Define leagues and their corresponding routes to filtered fixture lists
  const leagues = [
    { name: "Open Darts", route: "/fixtures/open-darts" },
    { name: "Women's+ Darts", route: "/fixtures/womens-darts" },
    { name: "Dominoes", route: "/fixtures/dominoes" },
    { name: "Open A's Pool", route: "/fixtures/open-as-pool" },
    { name: "Open B's Pool", route: "/fixtures/open-bs-pool" },
    { name: "Women's+ Pool", route: "/fixtures/womens-pool" },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center bg-white text-black p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Fixture Lists</h1>
      
      {/* League Buttons Section */}
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-8 text-center">Select a League to View Fixtures</h2>
        <ul className="space-y-6">
          {leagues.map((league) => (
            <li key={league.name}>
              <Link
                href={league.route}
                className="menu-link block w-full text-center rounded-lg px-6 py-4 text-xl font-semibold shadow"
              >
                {league.name} Fixtures
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
} 