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
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Project label */}
      <div className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: projectColor }}
        />
        <span className="text-lg font-medium text-gray-900">{projectName}</span>
      </div>

      {/* Tag */}
      {tag && (
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {tag}
        </span>
      )}

      {/* Elapsed time */}
      <div className="text-5xl font-mono font-bold text-gray-900 tabular-nums tracking-wider">
        {formatElapsed(elapsed)}
      </div>

      {/* Stop button */}
      <button
        onClick={onStop}
        className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
        aria-label="Stoppa timer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8"
        >
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>
    </div>
  );
}
