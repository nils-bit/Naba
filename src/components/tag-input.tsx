'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tag } from '@/types/database';

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadTags() {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      if (data) setTags(data);
    }
    loadTags();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = tags.filter(
    (t) =>
      value.length > 0 &&
      t.name.toLowerCase().includes(value.toLowerCase()) &&
      t.name.toLowerCase() !== value.toLowerCase()
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#AEAEB2"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Tagg (valfri)"
          className="w-full pl-10 pr-4 py-3 bg-white/72 backdrop-blur-xl border border-black/[0.06] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:border-transparent transition-all duration-200"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/90 backdrop-blur-2xl border border-black/[0.06] rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto animate-fade-in">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onChange(tag.name);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#1D1D1F] hover:bg-black/[0.04] transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
