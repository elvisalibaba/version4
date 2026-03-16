"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const COOKIE_CONSENT_KEY = "hb_cookie_consent";
const COOKIE_CONSENT_NAME = "hb_cookie_consent";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type ConsentValue = "accepted" | "declined";
type ConsentState = ConsentValue | "pending" | "unset";

function persistConsent(value: ConsentValue) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<ConsentState>("pending");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (pathname.startsWith("/admin")) {
        setChoice("accepted");
        return;
      }

      const savedChoice = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (savedChoice === "accepted" || savedChoice === "declined") {
        setChoice(savedChoice);
        return;
      }

      setChoice("unset");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  if (choice === "pending" || choice === "accepted" || choice === "declined" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <aside className="hb-cookie-banner" role="dialog" aria-live="polite" aria-label="Consentement cookies">
      <div className="hb-cookie-banner-copy">
        <p className="hb-cookie-banner-title">Votre confidentialite compte</p>
        <p className="hb-cookie-banner-text">
          Nous utilisons les cookies essentiels pour la connexion et le bon fonctionnement de la plateforme. Vous pouvez
          accepter ou refuser les cookies optionnels.
        </p>
      </div>
      <div className="hb-cookie-banner-actions">
        <button
          type="button"
          className="cta-primary px-5 py-3 text-sm"
          onClick={() => {
            persistConsent("accepted");
            setChoice("accepted");
          }}
        >
          Accepter
        </button>
        <button
          type="button"
          className="cta-secondary px-5 py-3 text-sm"
          onClick={() => {
            persistConsent("declined");
            setChoice("declined");
          }}
        >
          Refuser
        </button>
        <Link href="/cookies" className="hb-cookie-banner-link">
          En savoir plus
        </Link>
      </div>
    </aside>
  );
}
