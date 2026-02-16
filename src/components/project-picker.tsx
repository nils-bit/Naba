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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Valj projekt</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
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
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Sok projekt..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              Inga projekt hittades
            </p>
          ) : (
            filtered.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelect(project)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {project.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
