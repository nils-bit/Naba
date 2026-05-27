'use client';

import { useState } from 'react';

interface Props {
  onDeploy: (token: string, portalId: string) => void;
  disabled?: boolean;
}

export function DeployForm({ onDeploy, disabled }: Props) {
  const [token, setToken] = useState('');
  const [portalId, setPortalId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (token.trim() && portalId.trim()) {
      onDeploy(token.trim(), portalId.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Deploy to HubSpot
      </h3>

      <div className="space-y-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="HubSpot Private App Token"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-orange-500"
          disabled={disabled}
        />
        <input
          type="text"
          value={portalId}
          onChange={(e) => setPortalId(e.target.value)}
          placeholder="Portal ID"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-orange-500"
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !token.trim() || !portalId.trim()}
        className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Deploy to HubSpot
      </button>

      <p className="text-xs text-zinc-500">
        Create a private app at Settings &rarr; Integrations &rarr; Private Apps with CMS scopes.
      </p>
    </form>
  );
}
