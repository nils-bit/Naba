'use client';

import { useEffect, useState } from 'react';

interface TimerDisplayProps {
  projectName: string;
  projectColor: string;
  startTime: Date;
  tag?: string;
  onStop: () => void;
}

function formatElapsed(seconds: number): { hm: string; s: string } {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  const hm = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  return { hm, s: `:${sec.toString().padStart(2, '0')}` };
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

  const { hm, s } = formatElapsed(elapsed);

  return (
    <div className="flex flex-col items-center gap-5 py-10 animate-fade-in relative">
      {/* Subtle red radial gradient background */}
      <div className="absolute inset-0 -m-4 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(255,59,48,0.04)_0%,transparent_70%)]" />

      {/* Project pill badge */}
      <div
        className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] max-w-[90%]"
        style={{ backgroundColor: `${projectColor}12` }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: projectColor }}
        />
        <span className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 text-center">{projectName}</span>
      </div>

      {/* Elapsed time - hours:minutes prominent, seconds dimmed */}
      <div className="relative font-extralight tracking-widest text-[var(--text-primary)] whitespace-nowrap tabular-nums" style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', fontSize: 'clamp(48px, 14vw, 64px)' }}>
        {hm}<span className="opacity-50">{s}</span>
      </div>

      {/* Stop button */}
      <button
        onClick={onStop}
        className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#FF453A] to-[#FF3B30] hover:from-[#E0342B] hover:to-[#D62D24] active:scale-[0.93] text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-[#FF3B30]/25 mt-2"
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

      {/* Tag — below stop button */}
      {tag && (
        <span className="relative text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] px-3 py-1 rounded-full">
          {tag}
        </span>
      )}
    </div>
  );
}
