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
        <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {activeEntry && activeProject ? (
        <div className="space-y-4 animate-fade-in">
          <TimerDisplay
            projectName={activeProject.name}
            projectColor={activeProject.color}
            startTime={new Date(activeEntry.start_time)}
            tag={tag || undefined}
            onStop={handleStop}
          />
          <div className="space-y-3 px-2">
            <TagInput value={tag} onChange={setTag} />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anteckning (valfri)"
              className="w-full px-4 py-3 bg-white/72 backdrop-blur-xl border border-black/[0.06] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 py-16 animate-slide-up">
          <p className="text-[#6E6E73] text-sm">Ingen timer igang</p>

          {/* Things 3-style play button with pulsing ring */}
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full timer-circle animate-pulse-ring" />
            <button
              onClick={() => setPickerOpen(true)}
              className="relative w-24 h-24 rounded-full bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.93] text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-[#007AFF]/25"
              aria-label="Starta timer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-10 h-10 ml-1"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          </div>

          <p className="text-[#1D1D1F] font-medium text-sm">Starta timer</p>
        </div>
      )}

      <ProjectPicker
        open={pickerOpen}
        onSelect={handleStart}
        onClose={() => setPickerOpen(false)}
      />

      {/* Today's entries */}
      <div className="mt-10">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#6E6E73] mb-3 px-1">
          Idag
        </h3>
        <TodayEntries entries={todayEntries} />
      </div>
    </div>
  );
}
