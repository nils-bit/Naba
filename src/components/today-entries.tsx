'use client';

import { useState } from 'react';
import type { TimeEntryWithProject } from '@/types/database';

interface TodayEntriesProps {
  entries: TimeEntryWithProject[];
  onDelete?: (id: string) => void;
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

export function TodayEntries({ entries, onDelete }: TodayEntriesProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        <div key={entry.id} className="group relative">
          <div
            className="flex items-stretch bg-white/72 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden hover-lift"
          >
            {/* Color indicator — full-height 4px bar */}
            <div
              className="w-[4px] shrink-0 rounded-l-2xl"
              style={{ backgroundColor: entry.projects.color }}
            />
            <div className="flex items-center justify-between flex-1 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                  {entry.projects.name}
                </div>
                {entry.tag && (
                  <div className="text-xs text-[var(--text-secondary)] truncate">{entry.tag}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <div className="text-right">
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
                {/* Delete button — visible on hover (desktop) or always on mobile */}
                {onDelete && (
                  <button
                    onClick={() => setConfirmDeleteId(entry.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/5 transition-all duration-200 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Ta bort"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Confirm delete overlay */}
          {confirmDeleteId === entry.id && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl border border-[var(--danger)]/20 flex items-center justify-center gap-3 animate-fade-in z-10">
              <span className="text-sm text-[var(--text-primary)]">Ta bort?</span>
              <button
                onClick={() => {
                  onDelete?.(entry.id);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-[var(--danger)] text-white text-sm font-medium hover:bg-[var(--danger-hover)] transition-colors"
              >
                Ta bort
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] text-sm font-medium hover:bg-black/[0.06] transition-colors"
              >
                Avbryt
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
