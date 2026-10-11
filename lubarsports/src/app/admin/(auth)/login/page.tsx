import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { Notice } from "@/components/states";
import { getSessionUser } from "@/lib/auth";
import { site } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; signedout?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  if (await getSessionUser()) redirect("/admin");
  return (
    <div className="mx-auto mt-4 max-w-md">
      <div className="card-glow overflow-hidden">
        <div className="relative flex flex-col items-center border-b border-line px-6 pb-6 pt-8 text-center">
          <LogoMark priority className="h-24 w-auto drop-shadow-[0_8px_24px_rgba(232,24,52,0.35)]" />
          <p className="eyebrow mt-5 text-chalk">{site.name}</p>
          <h1 className="display mt-2 text-3xl">Admin sign in</h1>
          <p className="mt-2 text-[0.9375rem] text-muted">For committee members and college coordinators.</p>
        </div>
        <div className="relative space-y-4 p-6">
          {sp.signedout ? <Notice tone="info">You&apos;ve been signed out.</Notice> : null}
          <LoginForm next={sp.next?.startsWith("/admin") ? sp.next : undefined} />
          <p className="text-center text-[0.8125rem] text-muted">
            Forgotten your password? Ask a super admin to reset it.
          </p>
        </div>
      </div>
    </div>
  );
}
