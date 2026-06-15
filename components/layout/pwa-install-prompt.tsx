"use client";

import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const DISMISS_STORAGE_KEY = "hb-pwa-install-dismissed";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7;

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

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay);
  const [isDismissed, setIsDismissed] = useState(hasRecentlyDismissedPrompt);
  const isAndroid = isAndroidDevice();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }

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

  if (isInstalled || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <aside className="hb-install-banner" aria-label="Installer Holistique Books">
      <button type="button" onClick={dismissPrompt} className="hb-install-close" aria-label="Fermer">
        <X className="h-4 w-4" />
      </button>
      <div className="hb-install-icon">
        <MonitorSmartphone className="h-5 w-5" />
      </div>
      <div className="hb-install-copy">
        <p className="hb-install-kicker">{isAndroid ? "Application Android" : "Application web"}</p>
        <p className="hb-install-title">Installer Holistique Books</p>
        <p className="hb-install-text">
          {isAndroid
            ? "Ajoutez l icone a votre ecran d accueil et ouvrez Holistique Books dans sa propre fenetre."
            : "Ouvrez Holistique Books dans une fenetre separee, comme une application installee."}
        </p>
      </div>
      <button type="button" onClick={handleInstall} className="hb-install-button">
        <Download className="h-4 w-4" />
        Installer
      </button>
    </aside>
  );
}
