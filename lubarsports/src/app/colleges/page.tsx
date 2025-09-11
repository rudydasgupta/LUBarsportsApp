import Link from "next/link";
import Image from "next/image";

const collegeData = [
  {
    name: "Bowland",
    logo: "/colleges/bowland.png",
    color: "#d90429",
  },
  {
    name: "Cartmel",
    logo: "/colleges/cartmel.png",
    color: "#7a003c",
  },
  {
    name: "County",
    logo: "/colleges/county.png",
    color: "#003865",
  },
  {
    name: "Furness",
    logo: "/colleges/furness.png",
    color: "#3d2c91",
  },
  {
    name: "Fylde",
    logo: "/colleges/fylde.png",
    color: "#ff9900",
  },
  {
    name: "Graduate",
    logo: "/colleges/graduate.png",
    color: "#b8002e",
  },
  {
    name: "Grizedale",
    logo: "/colleges/grizedale.png",
    color: "#005eb8",
  },
  {
    name: "Lonsdale",
    logo: "/colleges/lonsdale.png",
    color: "#003366",
  },
  {
    name: "Pendle",
    logo: "/colleges/pendle.png",
    color: "#ffb800",
  },
];

export default function CollegesPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">College Home Pages</h1>
      <nav className="w-full max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {collegeData.map((college) => (
            <Link
              key={college.name}
              href={`/colleges/${college.name.toLowerCase()}`}
              className="flex flex-col items-center justify-center rounded-lg px-6 py-8 text-2xl font-semibold shadow min-h-[150px] text-center border-2 border-black hover:scale-105 transition"
              style={{ backgroundColor: '#fff', color: college.color }}
            >
              <Image
                src={college.logo}
                alt={`${college.name} logo`}
                width={64}
                height={64}
                className="mb-4"
              />
              {college.name} College
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
} 