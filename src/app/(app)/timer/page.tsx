'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, TimeEntry, TimeEntryWithProject } from '@/types/database';
import { ProjectPicker } from '@/components/project-picker';
import { TimerDisplay } from '@/components/timer-display';
import { TagInput } from '@/components/tag-input';
import { TodayEntries } from '@/components/today-entries';

export default function TimerPage() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const [todayEntries, setTodayEntries] = useState<TimeEntryWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTodayEntries = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const { data } = await supabase
      .from('time_entries')
      .select('*, projects(name, color)')
      .gte('start_time', todayIso)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false });

    if (data) setTodayEntries(data as TimeEntryWithProject[]);
  }, [supabase]);

  const fetchActiveEntry = useCallback(async () => {
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveEntry(data);
      // Fetch the associated project
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', data.project_id)
        .single();
      if (project) setActiveProject(project);
      if (data.tag) setTag(data.tag);
      if (data.note) setNote(data.note);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchActiveEntry(), fetchTodayEntries()]);
      setLoading(false);
    }
    init();
  }, [fetchActiveEntry, fetchTodayEntries]);

  async function handleStart(project: Project) {
    setPickerOpen(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('time_entries')
      .insert({
        project_id: project.id,
        user_id: user.id,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (data) {
      setActiveEntry(data);
      setActiveProject(project);
      setTag('');
      setNote('');
    }
  }

  async function handleStop() {
    if (!activeEntry) return;

    const now = new Date().toISOString();
    const updates: Record<string, string | null> = { end_time: now };

    // Save tag if provided
    if (tag.trim()) {
      updates.tag = tag.trim();
      // Create tag if it doesn't exist
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tag.trim())
          .eq('user_id', user.id)
          .maybeSingle();
        if (!existingTag) {
          await supabase
            .from('tags')
            .insert({ name: tag.trim(), user_id: user.id });
        }
      }
    }

    if (note.trim()) {
      updates.note = note.trim();
    }

    await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', activeEntry.id);

    setActiveEntry(null);
    setActiveProject(null);
    setTag('');
    setNote('');
    fetchTodayEntries();
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
      {activeEntry && activeProject ? (
        <div className="space-y-4">
          <TimerDisplay
            projectName={activeProject.name}
            projectColor={activeProject.color}
            startTime={new Date(activeEntry.start_time)}
            tag={tag || undefined}
            onStop={handleStop}
          />
          <div className="space-y-3 px-4">
            <TagInput value={tag} onChange={setTag} />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anteckning (valfri)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 py-12">
          <p className="text-gray-500 text-sm">Ingen timer igang</p>
          <button
            onClick={() => setPickerOpen(true)}
            className="w-24 h-24 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-lg"
            aria-label="Starta timer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-10 h-10"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <p className="text-gray-900 font-medium">Starta timer</p>
        </div>
      )}

      <ProjectPicker
        open={pickerOpen}
        onSelect={handleStart}
        onClose={() => setPickerOpen(false)}
      />

      {/* Today's entries */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Idag</h3>
        <TodayEntries entries={todayEntries} />
      </div>
    </div>
  );
}
