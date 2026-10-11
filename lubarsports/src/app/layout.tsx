import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/config";
import { getCurrentSeason } from "@/lib/season-data";
import "./globals.css";

// Tables change whenever a result is entered, so pages are rendered per
// request rather than at build time.
export const dynamic = "force-dynamic";

// Archivo (SIL Open Font License, see ./fonts/OFL.txt), self-hosted so builds
// never depend on a font CDN. One variable file covers every weight and width.
const archivo = localFont({
  src: "./fonts/Archivo-latin.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const archivoExt = localFont({
  src: "./fonts/Archivo-latin-ext.woff2",
  variable: "--font-archivo-ext",
  weight: "100 900",
  display: "swap",
  preload: false,
  declarations: [
    { prop: "font-stretch", value: "62% 125%" },
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
});

// JetBrains Mono (SIL Open Font License, see ./fonts/OFL-JetBrainsMono.txt)
// for scores, points and other figures.
const jetbrains = localFont({
  src: "./fonts/JetBrainsMono-latin.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  icons: { icon: "/brand/logo-256.png", apple: "/brand/logo-256.png" },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
};

// Runs before first paint: applies the saved theme. The site is dark (black
// and red) unless the visitor has chosen light mode with the toggle.
const themeScript = `(function(){try{var s=localStorage.getItem("theme");document.documentElement.setAttribute("data-theme",s==="light"?"light":"dark")}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const season = await getCurrentSeason().catch(() => null);
  return (
    <html
      lang="en-GB"
      data-theme="dark"
      className={`${archivo.variable} ${archivoExt.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <div className="backdrop" aria-hidden="true" />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:text-ink focus:shadow-lg"
        >
          Skip to content
        </a>
        <SiteHeader seasonName={season?.name ?? null} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
