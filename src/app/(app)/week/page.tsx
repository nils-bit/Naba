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
    const { data } = await supabase
      .from('time_entries')
      .select('*, projects(name, color)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .not('end_time', 'is', null)
      .order('start_time', { ascending: true });

    if (data) setEntries(data as TimeEntryWithProject[]);
    setLoading(false);
  }, [supabase, start, end]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <h2 className="text-lg font-bold text-gray-900">
            Vecka {weekNum}, {year}
          </h2>
          {weekOffset === 0 && (
            <span className="text-xs text-blue-600 font-medium">Denna vecka</span>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <WeekTable entries={entries} weekStart={start} />
      )}
    </div>
  );
}
