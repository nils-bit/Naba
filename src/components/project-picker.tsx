'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';

interface ProjectPickerProps {
  open: boolean;
  onSelect: (project: Project) => void;
  onClose: () => void;
}

export function ProjectPicker({ open, onSelect, onClose }: ProjectPickerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('archived', false)
        .order('name', { ascending: true });
      if (data) setProjects(data);
      setLoading(false);
    }
    load();
  }, [open, supabase]);

  if (!open) return null;

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-t-2xl w-full max-w-lg max-h-[70vh] flex flex-col animate-slide-up-sheet shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-black/[0.12]" />
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">
              Valj projekt
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#AEAEB2] hover:text-[#6E6E73] hover:bg-black/[0.04] transition-all duration-200"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {/* Search input with icon */}
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AEAEB2"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Sok projekt..."
              className="w-full pl-10 pr-4 py-3 bg-black/[0.04] border-none rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 transition-all duration-200"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-3 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-[#AEAEB2] py-8">
              Inga projekt hittades
            </p>
          ) : (
            <div className="stagger-children">
              {filtered.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelect(project)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-black/[0.04] active:scale-[0.98] transition-all duration-200 text-left"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium text-[#1D1D1F]">
                    {project.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
