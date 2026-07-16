import Link from "next/link";
import { ArrowRight, Compass, Layers3, Sparkles, Waypoints } from "lucide-react";
import type { MarketingPage } from "@/lib/marketing-pages";

const highlightIcons = [Compass, Sparkles, Layers3, Waypoints];

export function MarketingPageShell({ page }: { page: MarketingPage }) {
  return (
    <section className="bg-[linear-gradient(180deg,#f5f7fb_0%,#eef2f7_42%,#ffffff_100%)]">
      <div className="mx-auto max-w-[96rem] px-4 py-10 md:px-6 md:py-14">
        <div className="overflow-hidden rounded-[36px] border border-[#1f2937]/12 bg-[#101826] text-white shadow-[0_32px_100px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 px-5 py-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_320px] md:px-10 md:py-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#ffd27d]">
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
                  className="inline-flex items-center gap-2 rounded-full bg-[#febd69] px-5 py-3 text-sm font-semibold text-[#101826] transition hover:bg-[#f9aa44]"
                >
                  {page.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {page.secondaryCta ? (
                  <Link
                    href={page.secondaryCta.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {page.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/7 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd27d]">En bref</p>
              <p className="mt-3 text-sm leading-7 text-white/76">{page.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {page.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82"
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
                className="rounded-[28px] border border-[#d8e0eb] bg-white/92 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4df] text-[#a85b3f]">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[#101826]">{highlight.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5f6876]">{highlight.description}</p>
              </article>
            );
          })}
        </div>

        {page.directoryGroups?.length ? (
          <div className="mt-8 rounded-[32px] border border-[#d8e0eb] bg-white/96 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-7">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8b6c39]">Reperes rapides</p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#101826]">Les sections essentielles du site</h2>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {page.directoryGroups.map((group) => (
                <article key={group.title} className="rounded-[24px] border border-[#e6edf5] bg-[#f9fbfe] p-5">
                  <h3 className="text-lg font-semibold text-[#101826]">{group.title}</h3>
                  <ul className="mt-4 space-y-3 text-sm text-[#4f5865]">
                    {group.links.map((link) => (
                      <li key={`${group.title}-${link.href}`}>
                        <Link href={link.href} className="inline-flex items-center gap-2 transition hover:text-[#a85b3f]">
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
