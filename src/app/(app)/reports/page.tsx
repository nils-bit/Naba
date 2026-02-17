'use client';

import { useState } from 'react';
import { getWeekNumber, getWeekRange } from '@/lib/time-utils';
import { GenerateReportButton } from '@/components/generate-report-button';
import { ReportList } from '@/components/report-list';

export default function ReportsPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + weekOffset * 7);
  const { start } = getWeekRange(currentDate);
  const weekNum = getWeekNumber(start);
  const year = start.getFullYear();

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 animate-fade-in">
      <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] mb-6">
        Rapporter
      </h2>

      {/* Generate report section */}
      <div className="glass-card p-5 mb-8">
        <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-5">
          Generera rapport
        </h3>

        {/* Week picker */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover-icon"
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
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Vecka {weekNum}, {year}
            </span>
            {weekOffset === 0 && (
              <span className="block text-xs text-[var(--primary)] font-medium mt-0.5">
                Denna vecka
              </span>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] hover-icon"
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

        <GenerateReportButton weekOffset={weekOffset} />
      </div>

      {/* Previously generated reports */}
      <div>
        <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3 px-1">
          Sparade rapporter
        </h3>
        <ReportList />
      </div>
    </div>
  );
}
