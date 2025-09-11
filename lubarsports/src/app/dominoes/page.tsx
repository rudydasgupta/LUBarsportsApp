import Link from "next/link";

export default function DominoesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Dominoes</h1>
      <nav className="w-full max-w-md">
        <ul className="space-y-6">
          <li>
            <Link href="/league/dominoes" className="menu-link block w-full text-center rounded-lg px-6 py-4 text-xl font-semibold shadow">
              Dominoes League Table
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
} 