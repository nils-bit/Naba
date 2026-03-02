'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [themeName, setThemeName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let parsed: URL;
    try {
      parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    const params = new URLSearchParams({ url: parsed.toString() });
    if (themeName.trim()) params.set('name', themeName.trim());
    router.push(`/migrate?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-lg bg-orange-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-orange-600 active:scale-95"
        >
          Migrate
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        {showAdvanced ? 'Hide options' : 'Advanced options'}
      </button>

      {showAdvanced && (
        <input
          type="text"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          placeholder="Custom theme name (optional)"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-orange-500"
        />
      )}
    </form>
  );
}
