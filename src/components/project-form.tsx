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
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Projektnamn"
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 mr-1">Farg:</span>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${
              color === c ? 'border-gray-800 scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Valj farg ${c}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Avbryt
          </button>
        )}
      </div>
    </form>
  );
}
