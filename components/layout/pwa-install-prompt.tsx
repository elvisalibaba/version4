"use client";

import { useEffect, useState } from "react";
import { Download, MonitorSmartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_STORAGE_KEY = "hb-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(display-mode: standalone)").matches;
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    function handleBeforeInstallPrompt(event: Event) {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      if (window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1") {
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

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
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
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
      setIsDismissed(true);
    }

    setDeferredPrompt(null);
  }

  function dismissPrompt() {
    setIsDismissed(true);
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
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
        <p className="hb-install-kicker">Application web</p>
        <p className="hb-install-title">Installer Holistique Books sur ce navigateur</p>
        <p className="hb-install-text">Disponible sur Chrome, Edge, Opera et les navigateurs compatibles pour une ouverture comme une vraie application.</p>
      </div>
      <button type="button" onClick={handleInstall} className="hb-install-button">
        <Download className="h-4 w-4" />
        Installer
      </button>
    </aside>
  );
}
