import Image from "next/image";
import Link from "next/link";

/** Signature visuelle : le ruban marque-page rouge. */
export function Ribbon({ className = "h-5 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 20" aria-hidden="true" className={`shrink-0 text-brand-600 ${className}`}>
      <path d="M0 0h12v20l-6-4.6L0 20z" fill="currentColor" />
    </svg>
  );
}

/** Logotype : marque + nom en serif, comme sur une page de titre. */
export function Wordmark({ tone = "ink", tagline = false, size = "md" }: { tone?: "ink" | "light"; tagline?: boolean; size?: "sm" | "md" }) {
  const light = tone === "light";
  const logo = size === "sm" ? "h-8 w-8" : "h-8 w-8 sm:h-10 sm:w-10";
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/logo.svg" alt="" width={40} height={40} className={`${logo} ${light ? "brightness-0 invert" : ""}`} priority />
      <span className="leading-none">
        <span className={`block font-display font-semibold tracking-tight ${size === "sm" ? "text-lg" : "text-lg sm:text-[1.35rem]"} ${light ? "text-white" : "text-night-900"}`}>
          Holistique Books
        </span>
        {tagline ? (
          <span className={`mt-1 hidden font-display text-[0.8rem] italic sm:block ${light ? "text-night-200" : "text-slate-500"}`}>
            Maison d’édition · depuis 2018
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function WordmarkLink(props: Parameters<typeof Wordmark>[0]) {
  return (
    <Link href="/home" aria-label="Holistique Books, accueil" className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
      <Wordmark {...props} />
    </Link>
  );
}
