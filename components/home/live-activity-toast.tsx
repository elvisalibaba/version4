"use client";

import { useEffect, useState } from "react";

const messages = [
  "Jean a Kinshasa vient de commencer \"Revez, Osez, Creez\".",
  "Nadia a Abidjan lit \"Leadership et impact\".",
  "Eric a Douala a ajoute \"Foi et discipline\" a sa bibliotheque.",
  "Ruth a Kigali lit \"Renaitre chaque jour\" dans le lecteur Holistique.",
  "Ibrahim a Dakar a ouvert \"Puissance interieure\".",
];

export function LiveActivityToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const show = () => {
      setVisible(true);
      const timeout = setTimeout(() => setVisible(false), 6000);
      return timeout;
    };

    let timeoutId = show();
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
      clearTimeout(timeoutId);
      timeoutId = show();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 hidden sm:block">
      <div
        className={`ios-surface rounded-2xl px-4 py-3 text-xs text-slate-700 shadow-lg transition-all ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <p className="font-semibold">Activite en direct</p>
        <p className="mt-1">{messages[index]}</p>
      </div>
    </div>
  );
}
