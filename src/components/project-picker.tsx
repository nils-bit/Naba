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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col animate-slide-up shadow-[0_8px_40px_rgba(0,0,0,0.15)]">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              Välj projekt
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
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
              placeholder="Sök projekt..."
              className="w-full pl-10 pr-4 h-12 bg-[var(--input-bg)] border-none rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 transition-all duration-200"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-3 pb-4">
          {loading ? (
            <div className="space-y-1 px-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="skeleton w-4 h-4 rounded-full" />
                  <div className="skeleton flex-1 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[var(--text-tertiary)]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm text-[var(--text-tertiary)]">
                Inga projekt hittades
              </p>
            </div>
          ) : (
            <div className="stagger-children">
              {filtered.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelect(project)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-[var(--hover-bg)] active:scale-[0.98] transition-all duration-200 text-left"
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
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
