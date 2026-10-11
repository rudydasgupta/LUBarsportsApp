import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="card-glow mx-auto mt-6 flex max-w-xl flex-col items-center px-6 py-12 text-center">
      <LogoMark className="h-28 w-auto opacity-90" />
      <p className="eyebrow mt-6 text-chalk">404</p>
      <h1 className="display mt-2 text-4xl">Off the table</h1>
      <p className="mt-3 text-muted">That page doesn&apos;t exist. It may have moved when the site was rebuilt.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/leagues" className="btn">
          League tables
        </Link>
      </div>
    </div>
  );
}
