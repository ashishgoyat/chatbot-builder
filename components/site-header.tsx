import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="app-shell pt-6 nav-enter">
      <nav className="glass-panel flex items-center justify-between px-5 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-sm font-bold text-white no-underline"
          >
            AI
          </Link>
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">BotForge</p>
            <p className="hidden text-xs text-neutral-500 dark:text-neutral-400 sm:block">AI chatbot builder</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-secondary hidden no-underline sm:inline-flex">
            Login
          </Link>
          <Link href="/signup" className="btn-primary no-underline">
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
