import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isCompleted: false });
    };

    calculateTimeLeft(); // Initial run
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft.isCompleted) {
    return (
      <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        Matured
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded px-1.5 py-1 min-w-[34px]">
        <span className="font-bold text-gray-800 text-sm leading-tight">{timeLeft.days}</span>
        <span className="text-[9px] text-gray-500 uppercase font-sans tracking-wider">days</span>
      </div>
      <span className="text-gray-400 font-bold">:</span>
      <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded px-1.5 py-1 min-w-[34px]">
        <span className="font-bold text-gray-800 text-sm leading-tight">{timeLeft.hours}</span>
        <span className="text-[9px] text-gray-500 uppercase font-sans tracking-wider">hrs</span>
      </div>
      <span className="text-gray-400 font-bold">:</span>
      <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded px-1.5 py-1 min-w-[34px]">
        <span className="font-bold text-gray-800 text-sm leading-tight">{timeLeft.minutes}</span>
        <span className="text-[9px] text-gray-500 uppercase font-sans tracking-wider">mins</span>
      </div>
    </div>
  );
}
