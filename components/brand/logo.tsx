import Image from "next/image";
import Link from "next/link";

const LOGO_RATIO = 1471 / 658;

/** Logotype officiel. `light` : fond clair (texte encre) ; `dark` : fond sombre (texte blanc). */
export function Logo({ tone = "light", height = 40, priority = false }: { tone?: "light" | "dark"; height?: number; priority?: boolean }) {
  return (
    <Image
      src={tone === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
      alt="Holistique Books"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      priority={priority}
      className="h-auto w-auto"
      style={{ height, width: "auto" }}
    />
  );
}

/** Logo cliquable vers l'accueil. */
export function LogoLink(props: Parameters<typeof Logo>[0]) {
  return (
    <Link href="/home" aria-label="Holistique Books, accueil" className="inline-flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep focus-visible:ring-offset-2">
      <Logo {...props} />
    </Link>
  );
}
