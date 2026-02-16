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
      <p className="text-sm text-[#AEAEB2] text-center py-10">
        Inga tidsregistreringar denna vecka
      </p>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-black/[0.06]">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#6E6E73]">
                Projekt
              </th>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <th
                  key={i}
                  className="text-right px-2 py-3 text-xs font-medium uppercase tracking-wider text-[#6E6E73] w-16"
                >
                  {getDayName(i)}
                </th>
              ))}
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#6E6E73] w-16">
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
                    <span className="text-[#1D1D1F] font-medium truncate">
                      {row.projectName}
                    </span>
                  </div>
                </td>
                {row.days.map((h, i) => (
                  <td key={i} className="text-right px-2 py-3 text-[#6E6E73] tabular-nums">
                    {fmtHours(h)}
                  </td>
                ))}
                <td className="text-right px-4 py-3 font-semibold text-[#1D1D1F] tabular-nums">
                  {fmtHours(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#007AFF]/[0.04]">
              <td className="px-4 py-3 font-semibold text-[#1D1D1F]">Totalt</td>
              {dayTotals.map((h, i) => (
                <td key={i} className="text-right px-2 py-3 font-semibold text-[#1D1D1F] tabular-nums">
                  {fmtHours(h)}
                </td>
              ))}
              <td className="text-right px-4 py-3 font-bold text-[#007AFF] tabular-nums">
                {fmtHours(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
