import Link from "next/link";
import { IconCheck, IconSparkles } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { pricingPlans } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <div className="min-h-screen pb-12">
      <SiteHeader />

      <main className="app-shell mt-10 space-y-8">
        <section className="glass-panel hero-mesh relative overflow-hidden px-6 py-12 sm:px-10 lg:px-12">
          <div className="float-orb pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />
          <div className="float-orb-slow pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span className="editorial-kicker reveal-up">Simple billing, clear limits</span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-900 reveal-up reveal-delay-1 sm:text-5xl dark:text-neutral-100">
              Pricing that scales by monthly sessions
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 reveal-up reveal-delay-2 sm:text-lg dark:text-neutral-300">
              Choose your monthly session capacity, launch your assistant, and upgrade anytime when your usage grows.
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`soft-card reveal-up flex h-full flex-col p-6 ${
                plan.highlighted
                  ? "border-indigo-300 bg-indigo-50/70 shadow-xl shadow-indigo-900/10 dark:border-indigo-400/50 dark:bg-indigo-900/20"
                  : "dark:border-white/10 dark:bg-neutral-900/75"
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{plan.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{plan.description}</p>
                </div>
                {plan.highlighted ? (
                  <span className="chip inline-flex items-center gap-1 whitespace-nowrap dark:border-indigo-300/40 dark:bg-indigo-900/50 dark:text-indigo-100">
                    <IconSparkles className="h-3.5 w-3.5" />
                    Best value
                  </span>
                ) : null}
              </div>

              <div className="mb-4">
                <p className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {plan.price}
                  <span className="ml-1 text-base font-medium text-neutral-500 dark:text-neutral-400">{plan.billing}</span>
                </p>
              </div>

              <div className="mb-5 rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-neutral-800/75">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">Session limit</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{plan.sessions} sessions per month</p>
              </div>

              <ul className="mb-6 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.isAvailableNow ? (
                <Link href={plan.ctaHref} className={`${plan.highlighted ? "btn-primary" : "btn-secondary"} mt-auto no-underline`}>
                  {plan.ctaLabel}
                </Link>
              ) : (
                <div className="mt-auto inline-flex items-center justify-center rounded-full border border-dashed border-neutral-300 bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:border-white/20 dark:bg-neutral-800 dark:text-neutral-200">
                  Comming soon
                </div>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
