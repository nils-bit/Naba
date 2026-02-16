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
      <p className="text-sm text-[#AEAEB2] text-center py-8">
        Inga tidsregistreringar idag
      </p>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between bg-white/72 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-black/[0.06] shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Color indicator as left accent */}
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: entry.projects.color }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#1D1D1F] truncate">
                {entry.projects.name}
              </div>
              {entry.tag && (
                <div className="text-xs text-[#6E6E73] truncate">{entry.tag}</div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <div className="text-xs text-[#AEAEB2]">
              {formatTime(entry.start_time)}
              {entry.end_time ? ` - ${formatTime(entry.end_time)}` : ''}
            </div>
            {entry.end_time && (
              <div className="text-sm font-semibold text-[#1D1D1F]">
                {formatDurationShort(entry.start_time, entry.end_time)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
