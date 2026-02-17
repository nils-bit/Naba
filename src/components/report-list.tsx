'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ReportFile {
  name: string;
  created_at: string;
}

export function ReportList() {
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadReports() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.storage
        .from('reports')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (data) {
        setFiles(
          data
            .filter((f) => f.name.endsWith('.xlsx'))
            .map((f) => ({
              name: f.name,
              created_at: f.created_at,
            }))
        );
      }
      setLoading(false);
    }
    loadReports();
  }, [supabase]);

  async function handleDownload(filename: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.storage
      .from('reports')
      .download(`${user.id}/${filename}`);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 bg-white/72 rounded-2xl px-4 py-3.5 border border-black/[0.06]">
            <div className="flex-1 space-y-2">
              <div className="skeleton w-40 h-4 rounded" />
              <div className="skeleton w-20 h-3 rounded" />
            </div>
            <div className="skeleton w-10 h-10 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--text-tertiary)]">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p className="text-sm text-[var(--text-tertiary)]">Inga sparade rapporter</p>
        <p className="text-xs text-[var(--text-tertiary)]">Generera din första rapport ovan</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {files.map((file) => (
        <div
          key={file.name}
          className="flex items-center justify-between bg-white/72 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-black/[0.06] shadow-sm hover-lift"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
              {file.name}
            </div>
            {file.created_at && (
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {new Date(file.created_at).toLocaleDateString('sv-SE')}
              </div>
            )}
          </div>
          <button
            onClick={() => handleDownload(file.name)}
            className="ml-3 p-2.5 rounded-xl text-[var(--primary)] hover:text-[var(--primary-hover)] hover:bg-[var(--primary)]/[0.06] shrink-0 hover-icon"
            aria-label={`Ladda ner ${file.name}`}
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
