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
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] mb-6">
        Rapporter
      </h2>

      {/* Generate report section */}
      <div className="glass-card p-5 mb-8">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#6E6E73] mb-5">
          Generera rapport
        </h3>

        {/* Week picker */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-2.5 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-all duration-200 press-effect"
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
            <span className="text-sm font-semibold text-[#1D1D1F]">
              Vecka {weekNum}, {year}
            </span>
            {weekOffset === 0 && (
              <span className="block text-xs text-[#007AFF] font-medium mt-0.5">
                Denna vecka
              </span>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-2.5 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-all duration-200 press-effect"
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
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#6E6E73] mb-3 px-1">
          Sparade rapporter
        </h3>
        <ReportList />
      </div>
    </div>
  );
}
