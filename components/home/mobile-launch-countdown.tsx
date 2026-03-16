"use client";

import { useEffect, useMemo, useState } from "react";

type MobileLaunchCountdownProps = {
  targetAt: string;
};

function getTimeLeft(targetAt: string) {
  const target = new Date(targetAt);
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => value.toString().padStart(2, "0");

  return {
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    isExpired: diff <= 0,
  };
}

export function MobileLaunchCountdown({ targetAt }: MobileLaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetAt));

  useEffect(() => {
    const update = () => setTimeLeft(getTimeLeft(targetAt));

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [targetAt]);

  const countdown = useMemo(
    () => [
      { label: "Heures", value: timeLeft.hours },
      { label: "Mins", value: timeLeft.minutes },
      { label: "Secs", value: timeLeft.seconds },
    ],
    [timeLeft.hours, timeLeft.minutes, timeLeft.seconds],
  );

  if (timeLeft.isExpired) {
    return <p className="hb-mobile-helper">Lancement en cours. La version mobile arrive dans quelques instants.</p>;
  }

  return (
    <div className="hb-mobile-countdown-wrap">
      <div className="hb-countdown">
        {countdown.map((item) => (
          <div key={item.label} className="hb-countdown-card">
            <span className="text-lg font-semibold text-slate-900">{item.value}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
