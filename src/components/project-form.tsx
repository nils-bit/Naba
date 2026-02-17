'use client';

import { useState } from 'react';

const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

interface ProjectFormProps {
  initialName?: string;
  initialColor?: string;
  onSubmit: (name: string, color: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ProjectForm({
  initialName = '',
  initialColor = PRESET_COLORS[5],
  onSubmit,
  onCancel,
  submitLabel = 'Spara',
}: ProjectFormProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, color);
    if (!initialName) {
      setName('');
      setColor(PRESET_COLORS[5]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Projektnamn"
        required
        className="form-input text-sm"
      />
      <div>
        <span className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
          Färg
        </span>
        <div className="flex flex-wrap gap-2.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 min-w-[32px] rounded-full transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: c }}
              aria-label={`Välj färg ${c}`}
            >
              {color === c && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium shadow-sm shadow-[#007AFF]/15 hover-glow"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white/72 border border-black/[0.06] text-[var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-black/[0.04] transition-all duration-200"
          >
            Avbryt
          </button>
        )}
      </div>
    </form>
  );
}
