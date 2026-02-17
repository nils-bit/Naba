'use client';

import { useState } from 'react';

interface GenerateReportButtonProps {
  weekOffset: number;
  onGenerated?: () => void;
}

export function GenerateReportButton({ weekOffset, onGenerated }: GenerateReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekOffset }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'tidsrapport.xlsx';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', message: `Rapport nedladdad: ${filename}` });
      onGenerated?.();
    } catch (err) {
      console.error('Report download error:', err);
      setFeedback({ type: 'error', message: 'Kunde inte generera rapport. Försök igen.' });
    } finally {
      setLoading(false);
      // Clear feedback after 4 seconds
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-3.5 bg-[var(--primary)] text-white rounded-xl font-medium text-sm disabled:opacity-50 shadow-sm shadow-[#007AFF]/20 flex items-center justify-center gap-2.5 hover-glow"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Genererar...</span>
          </>
        ) : (
          <>
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Ladda ner rapport</span>
          </>
        )}
      </button>

      {/* Inline feedback */}
      {feedback && (
        <div
          className={`text-center text-sm font-medium py-2 px-4 rounded-xl animate-fade-in ${
            feedback.type === 'success'
              ? 'text-[var(--success)] bg-[#34C759]/10'
              : 'text-[var(--danger)] bg-[#FF3B30]/10'
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
