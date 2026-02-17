'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';
import { ProjectPicker } from '@/components/project-picker';

interface ManualEntryProps {
  onSaved: () => void;
}

export function ManualEntry({ onSaved }: ManualEntryProps) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  function reset() {
    setProject(null);
    setDate(new Date().toISOString().slice(0, 10));
    setStartTime('09:00');
    setEndTime('10:00');
    setTag('');
    setNote('');
    setError('');
  }

  const handleClose = useCallback(() => {
    reset();
    setOpen(false);
  }, []);

  // UX-07: Escape key closes modal
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  async function handleSave() {
    if (!project) return;
    setError('');
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    if (end <= start) {
      setError('Sluttid måste vara efter starttid');
      setSaving(false);
      return;
    }

    const entry: Record<string, string> = {
      project_id: project.id,
      user_id: user.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };
    if (tag.trim()) entry.tag = tag.trim();
    if (note.trim()) entry.note = note.trim();

    if (tag.trim()) {
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

    await supabase.from('time_entries').insert(entry);
    setSaving(false);
    reset();
    setOpen(false);
    onSaved();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/72 backdrop-blur-xl border border-black/[0.06] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/90 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 shrink-0"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Lägg till manuellt
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop — UX-08: click outside closes */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-backdrop-in"
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <div className="relative w-full max-w-[640px] max-h-[85vh] bg-white/95 backdrop-blur-2xl rounded-t-2xl animate-slide-up-sheet shadow-[0_-8px_40px_rgba(0,0,0,0.15)] pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-black/[0.15]" />
            </div>

            <div className="px-5 pb-6 space-y-4 overflow-y-auto max-h-[calc(85vh-40px)]">
              <div className="flex items-center justify-between">
                {/* MOB-05: nowrap title */}
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] whitespace-nowrap">
                  Manuell tidsinmatning
                </h3>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-200 shrink-0 ml-3"
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

              {/* Project selector */}
              <button
                onClick={() => setPickerOpen(true)}
                className={`w-full flex items-center gap-3 h-12 px-4 rounded-xl text-sm transition-all duration-200 hover:bg-black/[0.06] text-left ${
                  !project && error ? 'bg-[#FF3B30]/5 ring-1 ring-[var(--danger)]/30' : 'bg-[var(--input-bg)]'
                }`}
              >
                {project ? (
                  <>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {project.name}
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--text-tertiary)]">Välj projekt...</span>
                )}
              </button>

              {/* UX-06 / MOB-04: Responsive grid — date full width on mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                    Slut
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              {/* Validation error */}
              {error && (
                <p className="text-xs text-[var(--danger)] font-medium animate-fade-in">
                  {error}
                </p>
              )}

              {/* Tag & note */}
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Tagg (valfri)"
                className="form-input text-sm"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anteckning (valfri)"
                className="form-input text-sm"
              />

              {/* Save button + UX-09: hint when disabled */}
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  disabled={!project || saving}
                  className="w-full h-12 bg-[var(--primary)] text-white rounded-xl text-sm font-medium disabled:opacity-50 shadow-sm shadow-[#007AFF]/20 hover-glow"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sparar...
                    </span>
                  ) : (
                    'Spara'
                  )}
                </button>
                {!project && !saving && (
                  <p className="text-xs text-center text-[var(--text-tertiary)]">
                    Välj ett projekt för att spara
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProjectPicker
        open={pickerOpen}
        onSelect={(p) => {
          setProject(p);
          setPickerOpen(false);
          setError('');
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
