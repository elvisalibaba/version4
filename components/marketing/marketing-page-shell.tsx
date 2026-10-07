import Link from "next/link";
import { ArrowRight, Compass, Layers3, Sparkles, Waypoints } from "lucide-react";
import type { MarketingPage } from "@/lib/marketing-pages";

const highlightIcons = [Compass, Sparkles, Layers3, Waypoints];

export function MarketingPageShell({ page }: { page: MarketingPage }) {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[96rem] px-4 py-10 md:px-6 md:py-14">
        <div className="overflow-hidden rounded-md border border-night-900/12 bg-night-900 text-white ">
          <div className="grid gap-8 px-5 py-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_320px] md:px-10 md:py-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-sm border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold text-brand-300">
                {page.kicker}
              </span>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-[3.2rem] md:leading-[1.05]">
                  {page.title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/72 sm:text-base">{page.intro}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={page.primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-sm bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  {page.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {page.secondaryCta ? (
                  <Link
                    href={page.secondaryCta.href}
                    className="inline-flex items-center gap-2 rounded-sm border border-white/18 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {page.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-white/12 bg-white/7 p-5">
              <p className="text-xs font-semibold text-brand-300">En bref</p>
              <p className="mt-3 text-sm leading-7 text-white/76">{page.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {page.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex rounded-sm border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {page.highlights.map((highlight, index) => {
            const Icon = highlightIcons[index % highlightIcons.length];

            return (
              <article
                key={highlight.title}
                className="rounded-md border border-night-50 bg-white/92 p-6 "
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-night-50 text-night-800">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-night-900">{highlight.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{highlight.description}</p>
              </article>
            );
          })}
        </div>

        {page.directoryGroups?.length ? (
          <div className="mt-8 rounded-md border border-night-50 bg-white/96 p-5 sm:p-7">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-brand-700">Reperes rapides</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-night-900">Les sections essentielles du site</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {page.directoryGroups.map((group) => (
                <article key={group.title} className="rounded-md border border-night-50 bg-night-50 p-5">
                  <h3 className="text-lg font-semibold text-night-900">{group.title}</h3>
                  <ul className="mt-4 space-y-3 text-sm text-night-600">
                    {group.links.map((link) => (
                      <li key={`${group.title}-${link.href}`}>
                        <Link href={link.href} className="inline-flex items-center gap-2 transition hover:text-brand-600">
                          <ArrowRight className="h-3.5 w-3.5" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
