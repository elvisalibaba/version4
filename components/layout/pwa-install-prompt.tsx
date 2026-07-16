"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const DISMISS_STORAGE_KEY = "hb-pwa-install-dismissed";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const CACHE_PREFIX = "hb-";

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

function hasRecentlyDismissedPrompt() {
  if (typeof window === "undefined") {
    return true;
  }

  const dismissedAt = Number(window.localStorage.getItem(DISMISS_STORAGE_KEY));
  return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_TTL_MS;
}

function isAndroidDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /android/i.test(window.navigator.userAgent);
}

function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isClassicIos = /iPad|iPhone|iPod/i.test(userAgent);
  const isTouchMac = /Macintosh/i.test(userAgent) && window.navigator.maxTouchPoints > 1;
  return isClassicIos || isTouchMac;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  // Keep the server render and the browser's first render identical. Reading
  // localStorage in the initializer can otherwise cause a hydration mismatch.
  const [isDismissed, setIsDismissed] = useState(true);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV !== "production") {
        void navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
          .catch(() => undefined);

        if ("caches" in window) {
          void window.caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => window.caches.delete(key))))
            .catch(() => undefined);
        }

        return;
      }

      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }

    const frame = window.requestAnimationFrame(() => {
      setIsInstalled(isStandaloneDisplay());
      setIsDismissed(hasRecentlyDismissedPrompt());
      setIsAndroid(isAndroidDevice());
      setIsIos(isIosDevice());
    });

    function handleBeforeInstallPrompt(event: Event) {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      if (isStandaloneDisplay() || hasRecentlyDismissedPrompt()) {
        return;
      }
      setDeferredPrompt(installEvent);
      setIsDismissed(false);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    function handleDisplayModeChange() {
      setIsInstalled(isStandaloneDisplay());
    }

    standaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      window.localStorage.removeItem(DISMISS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
      setIsDismissed(true);
    }

    setDeferredPrompt(null);
  }

  function dismissPrompt() {
    setIsDismissed(true);
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
  }

  const canInstallPwa = Boolean(deferredPrompt) || isIos;

  if (isInstalled || isDismissed || !canInstallPwa) {
    return null;
  }

  return (
    <aside className="hb-install-banner" aria-label="Installer Holistique Books sur ce téléphone">
      <button type="button" onClick={dismissPrompt} className="hb-install-close" aria-label="Fermer">
        <X className="h-4 w-4" />
      </button>
      <div className="hb-install-icon">
        <MonitorSmartphone className="h-5 w-5" />
      </div>
      <div className="hb-install-copy">
        <p className="hb-install-kicker">{isAndroid ? "Android" : isIos ? "iPhone / iPad" : "Application"}</p>
        <p className="hb-install-title">Holistique sur votre telephone</p>
        <p className="hb-install-text">
          {isIos
            ? "Dans Safari, touchez Partager puis Sur l’écran d’accueil."
            : "Ajoutez l’icône à votre écran d’accueil et ouvrez Holistique dans sa propre fenêtre."}
        </p>
        <p className="hb-install-note">Prêt en moins d&apos;une minute.</p>
      </div>
      <div className="hb-install-actions">
        {deferredPrompt ? (
          <button type="button" onClick={handleInstall} className="hb-install-button">
            <MonitorSmartphone className="h-4 w-4" />
            Ajouter l&apos;app
          </button>
        ) : null}
        {isAndroid ? <span className="hb-install-speed">Installation rapide Android</span> : null}
        {isIos ? <span className="hb-install-speed">Safari • Partager • Sur l&apos;écran d&apos;accueil</span> : null}
      </div>
    </aside>
  );
}
