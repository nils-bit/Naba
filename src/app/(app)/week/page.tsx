'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TimeEntryWithProject } from '@/types/database';
import { getWeekRange, getWeekNumber } from '@/lib/time-utils';
import { WeekTable } from '@/components/week-table';

export default function WeekPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<TimeEntryWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + weekOffset * 7);
  const { start, end } = getWeekRange(currentDate);
  const weekNum = getWeekNumber(start);
  const year = start.getFullYear();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    const range = getWeekRange(d);
    const { data } = await supabase
      .from('time_entries')
      .select('*, projects(name, color)')
      .gte('start_time', range.start.toISOString())
      .lte('start_time', range.end.toISOString())
      .not('end_time', 'is', null)
      .order('start_time', { ascending: true });

    if (data) setEntries(data as TimeEntryWithProject[]);
    setLoading(false);
  }, [supabase, weekOffset]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 animate-fade-in">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all duration-200 press-effect"
          aria-label="Foregaende vecka"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
            Vecka {weekNum}, {year}
          </h2>
          {weekOffset === 0 && (
            <span className="text-xs text-[var(--primary)] font-medium">Denna vecka</span>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all duration-200 press-effect"
          aria-label="Nasta vecka"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-black/[0.06] flex gap-4">
            <div className="skeleton w-16 h-4 rounded" />
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="skeleton w-8 h-4 rounded" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-4 py-3 flex gap-4 border-b border-black/[0.04]">
              <div className="skeleton w-24 h-4 rounded" />
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div key={j} className="skeleton w-8 h-4 rounded" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <WeekTable entries={entries} weekStart={start} />
      )}
    </div>
  );
}
