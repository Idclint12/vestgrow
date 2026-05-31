import React from 'react';

interface InvestmentProgressBarProps {
  startDate: string;
  endDate: string;
}

export default function InvestmentProgressBar({ startDate, endDate }: InvestmentProgressBarProps) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();

  const total = end - start;
  const elapsed = now - start;

  let progress = 0;
  if (total > 0) {
    progress = (elapsed / total) * 100;
  }

  // Cap progress between 0 and 100
  progress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-[11px] mb-1">
        <span className="text-gray-500 font-medium font-sans">Accumulation progress</span>
        <span className="font-mono text-emerald-800 font-semibold">{progress.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
        <div
          className="bg-emerald-700 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
