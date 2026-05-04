import Link from "next/link";
import {
  IconArrowRight,
  IconBrandGithub,
  IconChecklist,
  IconDatabase,
  IconRocket,
  IconSparkles,
} from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";

const features = [
  {
    title: "Bring your own docs",
    description: "Upload PDFs and let your chatbot answer from your given knowledge base.",
    icon: IconDatabase,
  },
  {
    title: "Deploy anywhere",
    description: "Drop one script tag and launch a branded support assistant on your website.",
    icon: IconRocket,
  },
  {
    title: "Own the workflow",
    description: "Create, train, test, and iterate from one dashboard built for speed.",
    icon: IconChecklist,
  },
];

const marqueeItems = [
  "Fast setup",
  "Context-aware replies",
  "Document retrieval",
  "Embeddable widget",
  "Supabase auth",
  "Streaming responses",
  "Production ready",
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-12">
      <SiteHeader />

      <main className="app-shell mt-10 space-y-8">
        <section className="glass-panel hero-mesh relative overflow-hidden px-6 py-12 sm:px-10 lg:px-12">
          <div className="float-orb pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
          <div className="float-orb-slow pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="panel-pop">
              <span className="editorial-kicker reveal-up">Inspired by purpose-led design</span>

              <div className="mt-5 space-y-1 editorial-title">
                <p><span className="headline-word">Build</span> <span className="headline-word">bots</span></p>
                <p><span className="headline-word">that</span> <span className="headline-word">convert</span></p>
                <p><span className="headline-word">and</span> <span className="headline-word">care.</span></p>
              </div>

              <p className="hero-subtitle mt-6 reveal-up reveal-delay-3">
                BotForge helps users launch AI assistants using their own content. Create a bot,
                upload files, and embed a responsive widget without touching backend code.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 reveal-up reveal-delay-3">
                <Link href="/signup" className="btn-primary no-underline">
                  Create Account
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="btn-secondary no-underline">
                  Open dashboard
                </Link>
              </div>
            </div>

            <div className="soft-card panel-pop reveal-delay-2 p-6 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">What you get</p>
                <span className="chip-soft inline-flex items-center gap-1">
                  <IconSparkles className="h-3.5 w-3.5" />
                  Polished UX
                </span>
              </div>
              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature.title} className="lift-on-hover rounded-xl border border-neutral-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-neutral-800/80">
                    <div className="mb-2 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                      <feature.icon className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{feature.description}</p>
                  </div>
                ))}
              </div>

              <a
                href="https://github.com/ashishgoyat/"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors duration-150 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                <IconBrandGithub className="h-4 w-4" />
                Github
              </a>
            </div>
          </div>
        </section>

        <section className="glass-panel reveal-up reveal-delay-2 px-4 py-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Built for teams shipping fast</p>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                <span key={`${item}-${idx}`} className="chip-soft whitespace-nowrap">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
