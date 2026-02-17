'use client';

import type { TimeEntryWithProject } from '@/types/database';

interface TodayEntriesProps {
  entries: TimeEntryWithProject[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function formatDurationShort(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const mins = Math.round((end - start) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function TodayEntries({ entries }: TodayEntriesProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--text-tertiary)]">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p className="text-sm text-[var(--text-tertiary)]">
          Inga tidsregistreringar idag
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-stretch bg-white/72 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden hover-lift"
        >
          {/* Color indicator — full-height 4px bar */}
          <div
            className="w-[4px] shrink-0 rounded-l-2xl"
            style={{ backgroundColor: entry.projects.color }}
          />
          <div className="flex items-center justify-between flex-1 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                {entry.projects.name}
              </div>
              {entry.tag && (
                <div className="text-xs text-[var(--text-secondary)] truncate">{entry.tag}</div>
              )}
            </div>
            <div className="text-right shrink-0 ml-3">
              {entry.end_time && (
                <div className="text-base font-bold text-[var(--text-primary)] tabular-nums">
                  {formatDurationShort(entry.start_time, entry.end_time)}
                </div>
              )}
              <div className="text-xs text-[var(--text-tertiary)]">
                {formatTime(entry.start_time)}
                {entry.end_time ? ` – ${formatTime(entry.end_time)}` : ''}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
