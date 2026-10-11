"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  // Reflect changes made by the button or in another tab.
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const onStorage = (event: StorageEvent) => {
    if (event.key === "theme" && (event.newValue === "light" || event.newValue === "dark")) {
      document.documentElement.setAttribute("data-theme", event.newValue);
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

export function ThemeToggle() {
  // The server cannot know the theme, so it renders the default ("dark") label
  // and the real value is read on the client. The icon itself is chosen in CSS
  // from data-theme, so it is correct from the first paint either way.
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-9 items-center justify-center rounded-lg text-white/65 outline-white transition-colors hover:bg-white/[0.06] hover:text-white"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      suppressHydrationWarning
    >
      {/* Sun shows in dark mode, moon in light mode. */}
      <svg viewBox="0 0 24 24" className="hidden size-5 dark:block" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
      </svg>
      <svg viewBox="0 0 24 24" className="size-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
