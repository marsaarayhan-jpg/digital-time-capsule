"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // YYYY-MM-DD
}

export default function CountdownTimer({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0); // Open at the start of the day
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setIsUnlocked(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      // Convert diff to time units
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second for a "live" feel
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        setIsUnlocked(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isUnlocked) {
    return (
      <div className="text-center py-4">
        <p className="font-serif italic text-3xl text-gold animate-pulse">The seal has been broken.</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <div className="flex gap-4 sm:gap-8 justify-center items-center">
      {units.map((unit, idx) => (
        <div key={idx} className="flex flex-col items-center min-w-[60px]">
          <div className="relative">
            <span className="font-serif font-light text-4xl sm:text-5xl text-parchment tabular-nums drop-shadow-sm">
              {String(unit.value).padStart(2, "0")}
            </span>
            {idx < units.length - 1 && (
              <span className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 text-gold/30 font-serif text-xl sm:text-2xl opacity-40">:</span>
            )}
          </div>
          <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-gold/40 mt-3 font-semibold">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
