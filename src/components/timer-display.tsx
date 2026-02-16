'use client';

import { useEffect, useState } from 'react';

interface TimerDisplayProps {
  projectName: string;
  projectColor: string;
  startTime: Date;
  tag?: string;
  onStop: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0'),
  ].join(':');
}

export function TimerDisplay({
  projectName,
  projectColor,
  startTime,
  tag,
  onStop,
}: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    function tick() {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <div className="flex flex-col items-center gap-5 py-10 animate-fade-in">
      {/* Project pill badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06]"
        style={{ backgroundColor: `${projectColor}12` }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: projectColor }}
        />
        <span className="text-sm font-medium text-[#1D1D1F]">{projectName}</span>
      </div>

      {/* Tag */}
      {tag && (
        <span className="text-xs text-[#6E6E73] bg-black/[0.03] px-3 py-1 rounded-full">
          {tag}
        </span>
      )}

      {/* Elapsed time - luxury clock style */}
      <div className="relative">
        {/* Subtle pulsing ring behind the timer */}
        <div className="absolute inset-0 -m-6 rounded-full bg-[#007AFF]/[0.04] animate-pulse-ring" />
        <div className="relative text-6xl font-extralight tracking-widest text-[#1D1D1F] font-[var(--font-geist-mono)] tabular-nums animate-timer-pulse">
          {formatElapsed(elapsed)}
        </div>
      </div>

      {/* Stop button */}
      <button
        onClick={onStop}
        className="w-18 h-18 rounded-full bg-[#FF3B30] hover:bg-[#E0342B] active:scale-[0.93] text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-[#FF3B30]/20 mt-2"
        style={{ width: '72px', height: '72px' }}
        aria-label="Stoppa timer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    </div>
  );
}
