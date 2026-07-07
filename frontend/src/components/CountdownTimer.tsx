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
    minutes: 0,
    seconds: 0,
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
        return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      // Deeper calculation for Years and Months
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { years, months, days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.years === 0 && remaining.months === 0 && remaining.days === 0 && 
          remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
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
    { value: timeLeft.years, label: "Yrs" },
    { value: timeLeft.months, label: "Mths" },
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hrs" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div className="flex flex-wrap gap-3 sm:gap-6 justify-center items-center">
      {units.map((unit, idx) => (
        <div key={idx} className="flex flex-col items-center min-w-[50px] sm:min-w-[70px]">
          <div className="relative">
            <span className="font-serif font-light text-3xl sm:text-5xl text-parchment tabular-nums drop-shadow-sm">
              {String(unit.value).padStart(2, "0")}
            </span>
            {idx < units.length - 1 && (
              <span className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 text-gold/20 font-serif text-lg sm:text-2xl opacity-40">:</span>
            )}
          </div>
          <span className="font-sans text-[7px] sm:text-[8px] uppercase tracking-[0.2em] text-gold/40 mt-3 font-semibold">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
