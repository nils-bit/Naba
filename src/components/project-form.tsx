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
        className="w-full px-4 py-3 bg-white/80 border border-black/[0.06] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:border-transparent transition-all duration-200"
      />
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[#6E6E73] mr-1">
          Farg
        </span>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full transition-all duration-200 ${
              color === c
                ? 'ring-2 ring-offset-2 ring-[#1D1D1F] scale-110'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Valj farg ${c}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.97] text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm shadow-[#007AFF]/15"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white/72 border border-black/[0.06] text-[#6E6E73] rounded-xl text-sm font-medium hover:bg-black/[0.04] transition-all duration-200"
          >
            Avbryt
          </button>
        )}
      </div>
    </form>
  );
}
