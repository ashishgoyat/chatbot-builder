"use client";

import { IconMoonStars, IconSunHigh } from "@tabler/icons-react";

export function ThemeToggle() {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";
    const root = document.documentElement;

    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;
    localStorage.setItem("theme", nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex h-10 items-center gap-2 px-1 text-sm font-semibold text-neutral-700 transition duration-200 hover:-translate-y-0.5 dark:text-neutral-100"
    >
      <span className="relative flex h-6 w-11 items-center rounded-full bg-neutral-200/85 p-0.5 dark:bg-neutral-700/70">
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:translate-x-5 dark:bg-neutral-200" />
        <IconSunHigh className="absolute left-1 h-3.5 w-3.5 text-amber-500" />
        <IconMoonStars className="absolute right-1 h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
      </span>
    </button>
  );
}
