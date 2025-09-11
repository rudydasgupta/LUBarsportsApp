import Link from "next/link";

const poolDivisions = [
  { name: "Open A's Pool", slug: "open-as-pool" },
  { name: "Open B's Pool", slug: "open-bs-pool" },
  { name: "Women's+ Pool", slug: "womens-pool" },
];

export default function PoolPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Pool Divisions</h1>
      <nav className="w-full max-w-md">
        <ul className="space-y-6">
          {poolDivisions.map((division) => (
            <li key={division.slug}>
              <Link href={`/league/${division.slug}`} className="menu-link block w-full text-center rounded-lg px-6 py-4 text-xl font-semibold shadow">
                {division.name} League Table
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
} 