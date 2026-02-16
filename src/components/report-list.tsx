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
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-[#AEAEB2] text-center py-8">
        Inga sparade rapporter
      </p>
    );
  }

  return (
    <div className="space-y-2 stagger-children">
      {files.map((file) => (
        <div
          key={file.name}
          className="flex items-center justify-between bg-white/72 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-black/[0.06] shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[#1D1D1F] truncate">
              {file.name}
            </div>
            {file.created_at && (
              <div className="text-xs text-[#AEAEB2] mt-0.5">
                {new Date(file.created_at).toLocaleDateString('sv-SE')}
              </div>
            )}
          </div>
          <button
            onClick={() => handleDownload(file.name)}
            className="ml-3 p-2.5 rounded-xl text-[#007AFF] hover:text-[#0066D6] hover:bg-[#007AFF]/[0.06] transition-all duration-200 shrink-0 press-effect"
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
