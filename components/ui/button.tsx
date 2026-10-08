import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { cx } from "@/components/ui/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "on-dark" | "outline-on-dark" | "ink" | "outline-on-brand";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  // Fond clair : bleu profond, texte blanc (contraste 7,5:1).
  primary: "bg-brand-deep text-white hover:bg-brand-700 focus-visible:ring-brand-deep focus-visible:ring-offset-white",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-white focus-visible:ring-ink focus-visible:ring-offset-white",
  ghost: "text-brand-deep hover:bg-brand-wash focus-visible:ring-brand-deep focus-visible:ring-offset-white",
  // Fond sombre : bleu du logo. Texte noir plutôt qu'encre : 4,9:1 au lieu de 4,3:1 (AA).
  "on-dark": "bg-brand text-black hover:bg-brand-soft focus-visible:ring-brand-soft focus-visible:ring-offset-ink",
  "outline-on-dark": "border border-white/40 text-white hover:border-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-ink",
  // Sur fond bleu du logo : encre pleine.
  ink: "bg-ink text-white hover:bg-ink-2 focus-visible:ring-ink focus-visible:ring-offset-brand",
  "outline-on-brand": "border border-black text-black hover:bg-black/10 focus-visible:ring-black focus-visible:ring-offset-brand",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-5 text-sm",
  lg: "min-h-12 px-6 text-[0.95rem]",
};

export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cx(base, variants[variant], sizes[size], className);
}

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
