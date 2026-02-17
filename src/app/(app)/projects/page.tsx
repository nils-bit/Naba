'use client';

import { useEffect, useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';
import { ProjectForm } from '@/components/project-form';
import { ProjectList } from '@/components/project-list';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setProjects(data);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate(name: string, color: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('projects')
      .insert({ name, color, user_id: user.id, archived: false })
      .select()
      .single();
    if (data) {
      setProjects((prev) => [...prev, data]);
    }
  }

  async function handleUpdate(id: string, name: string, color: string) {
    const { data } = await supabase
      .from('projects')
      .update({ name, color })
      .eq('id', id)
      .select()
      .single();
    if (data) {
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    }
  }

  async function handleArchive(id: string, archived: boolean) {
    const { data } = await supabase
      .from('projects')
      .update({ archived })
      .eq('id', id)
      .select()
      .single();
    if (data) {
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    }
  }

  if (loading) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-6">
        <div className="skeleton w-32 h-8 rounded" />
        <div className="glass-card p-5 space-y-4">
          <div className="skeleton w-24 h-4 rounded" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton w-7 h-7 rounded-full" />
            ))}
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <div className="skeleton w-4 h-4 rounded-full" />
            <div className="skeleton flex-1 h-4 rounded" />
            <div className="skeleton w-6 h-6 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 animate-fade-in">
      <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] mb-6">
        Projekt
      </h2>

      {showForm ? (
        <div className="glass-card p-5 mb-6 animate-slide-up">
          <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-4">
            Nytt projekt
          </h3>
          <ProjectForm
            onSubmit={(name, color) => {
              handleCreate(name, color);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
            submitLabel="Lägg till"
          />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-6 py-3.5 border-2 border-dashed border-black/[0.1] rounded-2xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-black/[0.2] hover:bg-[var(--hover-bg)] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nytt projekt
        </button>
      )}

      <ProjectList
        projects={projects}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
      />
    </div>
  );
}
