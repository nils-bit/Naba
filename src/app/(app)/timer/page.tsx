'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project, TimeEntry, TimeEntryWithProject } from '@/types/database';
import { ProjectPicker } from '@/components/project-picker';
import { TimerDisplay } from '@/components/timer-display';
import { TagInput } from '@/components/tag-input';
import { TodayEntries } from '@/components/today-entries';
import { ManualEntry } from '@/components/manual-entry';

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
      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-4">
        {/* Hero skeleton */}
        <div className="flex flex-col items-center gap-5 py-12">
          <div className="skeleton w-24 h-4 rounded-full" />
          <div className="skeleton w-[72px] h-[72px] rounded-full" />
          <div className="skeleton w-20 h-4 rounded-full" />
        </div>
        {/* Entry skeletons */}
        <div className="skeleton w-16 h-4 rounded mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 bg-white/72 rounded-2xl px-4 py-3.5 border border-black/[0.06]">
            <div className="skeleton w-1 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton w-28 h-4 rounded" />
              <div className="skeleton w-16 h-3 rounded" />
            </div>
            <div className="space-y-2">
              <div className="skeleton w-12 h-4 rounded ml-auto" />
              <div className="skeleton w-20 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6">
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
              className="form-input text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="animate-slide-up">
          <div className="flex flex-col items-center gap-5 py-12">
            <p className="text-[var(--text-secondary)] text-sm">Ingen timer igång</p>

            <button
              onClick={() => setPickerOpen(true)}
              className="w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#0A84FF] to-[#007AFF] text-white flex items-center justify-center shadow-lg shadow-[#007AFF]/30 hover-glow"
              aria-label="Starta timer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-7 h-7 ml-0.5"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            <p className="text-[var(--text-primary)] font-medium text-sm">Starta timer</p>
          </div>

          <div className="flex justify-center mb-6">
            <ManualEntry onSaved={fetchTodayEntries} />
          </div>
        </div>
      )}

      <ProjectPicker
        open={pickerOpen}
        onSelect={handleStart}
        onClose={() => setPickerOpen(false)}
      />

      {/* Today's entries */}
      <div className="mt-10">
        <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3 px-1">
          Idag
        </h3>
        <TodayEntries entries={todayEntries} />
      </div>
    </div>
  );
}
