"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // YYYY-MM-DD
}

export default function CountdownTimer({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
  });
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setIsUnlocked(true);
        return { years: 0, months: 0, days: 0, hours: 0 };
      }

      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      return { years, months, days, hours };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000 * 60 * 60);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isUnlocked) {
    return (
      <div className="text-center">
        <p className="font-serif italic text-2xl text-sienna animate-fade-in">It is time.</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.years, label: "Years" },
    { value: timeLeft.months, label: "Months" },
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
  ];

  return (
    <div className="flex gap-6 sm:gap-10 justify-center items-end">
      {units.map((unit, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="relative">
            <span className="font-serif font-light text-5xl sm:text-6xl text-dark-text tabular-nums">
              {String(unit.value).padStart(2, "0")}
            </span>
            {idx < units.length - 1 && (
              <span className="absolute -right-4 sm:-right-6 bottom-2 text-2xl text-warm-brown/30 font-serif">·</span>
            )}
          </div>
          <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-espresso/35 mt-2">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
