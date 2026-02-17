'use client';

import type { TimeEntryWithProject } from '@/types/database';
import { getDayName } from '@/lib/time-utils';

interface WeekTableProps {
  entries: TimeEntryWithProject[];
  weekStart: Date;
}

interface ProjectRow {
  projectName: string;
  projectColor: string;
  days: number[]; // hours for Mon-Sun (7 elements)
  total: number;
}

function getWeekDayIndex(date: Date): number {
  const day = date.getDay();
  // Convert from Sun=0..Sat=6 to Mon=0..Sun=6
  return day === 0 ? 6 : day - 1;
}

function computeRows(entries: TimeEntryWithProject[], weekStart: Date): ProjectRow[] {
  const projectMap = new Map<
    string,
    { name: string; color: string; days: number[] }
  >();

  for (const entry of entries) {
    if (!entry.end_time) continue;

    const key = entry.project_id;
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        name: entry.projects.name,
        color: entry.projects.color,
        days: [0, 0, 0, 0, 0, 0, 0],
      });
    }
    const row = projectMap.get(key)!;

    const start = new Date(entry.start_time);
    const end = new Date(entry.end_time);
    const hours = (end.getTime() - start.getTime()) / 3600000;
    const dayIndex = getWeekDayIndex(start);
    if (dayIndex >= 0 && dayIndex < 7) {
      row.days[dayIndex] += hours;
    }
  }

  return Array.from(projectMap.values())
    .map((row) => ({
      projectName: row.name,
      projectColor: row.color,
      days: row.days,
      total: row.days.reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.projectName.localeCompare(b.projectName));
}

function fmtHours(h: number): string {
  if (h === 0) return '';
  return h.toFixed(1).replace(/\.0$/, '') + 'h';
}

export function WeekTable({ entries, weekStart }: WeekTableProps) {
  const rows = computeRows(entries, weekStart);

  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    for (let i = 0; i < 7; i++) {
      dayTotals[i] += row.days[i];
    }
  }
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--text-tertiary)]">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-sm text-[var(--text-tertiary)]">
          Ingen tid registrerad denna vecka
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                Projekt
              </th>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <th
                  key={i}
                  className="text-right px-2 py-3 text-xs font-medium text-[var(--text-secondary)] w-16"
                >
                  {getDayName(i)}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--text-secondary)] w-16">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.projectName}
                className={`border-b border-black/[0.04] transition-colors duration-150 ${
                  rowIndex % 2 === 1 ? 'bg-black/[0.02]' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.projectColor }}
                    />
                    <span className="text-[var(--text-primary)] font-medium truncate">
                      {row.projectName}
                    </span>
                  </div>
                </td>
                {row.days.map((h, i) => (
                  <td key={i} className="text-right px-2 py-3 text-[var(--text-secondary)] tabular-nums">
                    {fmtHours(h)}
                  </td>
                ))}
                <td className="text-right px-4 py-3 font-semibold text-[var(--text-primary)] tabular-nums">
                  {fmtHours(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--primary)]/[0.04]">
              <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">Totalt</td>
              {dayTotals.map((h, i) => (
                <td key={i} className="text-right px-2 py-3 font-semibold text-[var(--text-primary)] tabular-nums">
                  {fmtHours(h)}
                </td>
              ))}
              <td className="text-right px-4 py-3 font-bold text-[var(--primary)] tabular-nums">
                {fmtHours(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
