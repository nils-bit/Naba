'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';
import { ProjectForm } from '@/components/project-form';
import { ProjectList } from '@/components/project-list';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setProjects(data);
    setLoading(false);
  }, [supabase]);

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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Projekt</h2>

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Nytt projekt</h3>
        <ProjectForm onSubmit={handleCreate} submitLabel="Lagg till" />
      </div>

      <ProjectList
        projects={projects}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
      />
    </div>
  );
}
