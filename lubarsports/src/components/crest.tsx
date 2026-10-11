import Image from "next/image";
import Link from "next/link";
import { collegeByName } from "@/lib/config";

const SIZES = {
  xs: { box: "size-6 rounded-md p-0.5", px: 24 },
  sm: { box: "size-8 rounded-lg p-1", px: 32 },
  md: { box: "size-11 rounded-xl p-1.5", px: 44 },
  lg: { box: "size-16 rounded-2xl p-2", px: 64 },
  xl: { box: "size-24 rounded-3xl p-3", px: 96 },
} as const;

/**
 * A college crest on a white tile, so logos with white backgrounds look the
 * same in light and dark mode. Decorative: the college name is always shown
 * alongside.
 */
export function Crest({ college, size = "sm", className = "" }: { college: string; size?: keyof typeof SIZES; className?: string }) {
  const c = collegeByName(college);
  const s = SIZES[size];
  if (!c) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center bg-raised text-[0.625rem] font-bold text-muted ${s.box} ${className}`}
      >
        {college.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${s.box} ${className}`}
    >
      <Image src={c.logo} alt="" width={s.px * 2} height={s.px * 2} className="size-full object-contain" />
    </span>
  );
}

/** Crest and name, linking to the college page. */
export function CollegeName({
  college,
  size = "sm",
  link = true,
  bold = false,
  className = "",
}: {
  college: string;
  size?: keyof typeof SIZES;
  link?: boolean;
  bold?: boolean;
  className?: string;
}) {
  const c = collegeByName(college);
  const inner = (
    <>
      <Crest college={college} size={size} />
      <span className={`truncate ${bold ? "font-bold" : "font-semibold"}`}>{college}</span>
    </>
  );
  if (!c || !link) return <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>{inner}</span>;
  return (
    <Link href={`/colleges/${c.slug}`} className={`inline-flex min-w-0 items-center gap-2.5 hover:text-chalk ${className}`}>
      {inner}
    </Link>
  );
}
