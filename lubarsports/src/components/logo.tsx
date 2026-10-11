import Image from "next/image";

/** The Bar Sports badge: the Lancashire rose over darts, dominoes and a pool rack. */
export function LogoMark({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-256.png"
      alt=""
      width={202}
      height={256}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}
