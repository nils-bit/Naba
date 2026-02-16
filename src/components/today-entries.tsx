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
      <p className="text-sm text-gray-400 text-center py-6">
        Inga tidsregistreringar idag
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: entry.projects.color }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {entry.projects.name}
              </div>
              {entry.tag && (
                <div className="text-xs text-gray-500 truncate">{entry.tag}</div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <div className="text-xs text-gray-500">
              {formatTime(entry.start_time)}
              {entry.end_time ? ` - ${formatTime(entry.end_time)}` : ''}
            </div>
            {entry.end_time && (
              <div className="text-sm font-medium text-gray-700">
                {formatDurationShort(entry.start_time, entry.end_time)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
