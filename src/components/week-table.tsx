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
      <p className="text-sm text-gray-400 text-center py-8">
        Inga tidsregistreringar denna vecka
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="text-left px-3 py-2 font-medium">Projekt</th>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <th key={i} className="text-right px-2 py-2 font-medium w-16">
                {getDayName(i)}
              </th>
            ))}
            <th className="text-right px-3 py-2 font-medium w-16">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.projectName} className="border-b border-gray-200">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: row.projectColor }}
                  />
                  <span className="truncate">{row.projectName}</span>
                </div>
              </td>
              {row.days.map((h, i) => (
                <td key={i} className="text-right px-2 py-2 text-gray-600">
                  {fmtHours(h)}
                </td>
              ))}
              <td className="text-right px-3 py-2 font-medium text-gray-900">
                {fmtHours(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-medium">
            <td className="px-3 py-2 text-gray-900">Totalt</td>
            {dayTotals.map((h, i) => (
              <td key={i} className="text-right px-2 py-2 text-gray-900">
                {fmtHours(h)}
              </td>
            ))}
            <td className="text-right px-3 py-2 text-gray-900 font-bold">
              {fmtHours(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
