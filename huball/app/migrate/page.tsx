'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useCallback, Suspense } from 'react';
import { useMigrationSSE } from '@/lib/use-migration-sse';
import { MigrationProgress } from '@/components/migration-progress';
import { DesignSystemPreview } from '@/components/design-system-preview';
import { ComponentList } from '@/components/component-list';
import { ThemeFileTree } from '@/components/theme-file-tree';
import { DeployForm } from '@/components/deploy-form';
import { DeployStatusView } from '@/components/deploy-status';
import type { DeployStatus } from '@/lib/types';

function MigrateContent() {
  const params = useSearchParams();
  const url = params.get('url');
  const themeName = params.get('name') || undefined;

  const state = useMigrationSSE(url, themeName);
  const [deploy, setDeploy] = useState<DeployStatus>({
    status: 'idle',
    message: '',
    designManagerUrl: null,
  });

  const handleDeploy = useCallback(
    async (token: string, portalId: string) => {
      if (!state.sessionId) return;

      setDeploy({ status: 'deploying', message: 'Starting deployment...', designManagerUrl: null });

      try {
        const res = await fetch('/api/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: state.sessionId, token, portalId }),
        });

        if (!res.ok || !res.body) {
          setDeploy({ status: 'error', message: 'Deploy request failed', designManagerUrl: null });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === 'progress') {
                setDeploy((d) => ({ ...d, message: data.message }));
              } else if (currentEvent === 'complete') {
                setDeploy({
                  status: 'complete',
                  message: 'Deployed!',
                  designManagerUrl: data.designManagerUrl,
                });
              } else if (currentEvent === 'error') {
                setDeploy({ status: 'error', message: data.message, designManagerUrl: null });
              }
            }
          }
        }
      } catch (err) {
        setDeploy({
          status: 'error',
          message: err instanceof Error ? err.message : 'Deploy failed',
          designManagerUrl: null,
        });
      }
    },
    [state.sessionId],
  );

  if (!url) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">No URL provided. Go back and enter a URL.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <a href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          &larr; Back
        </a>
        <h1 className="mt-2 text-2xl font-bold">
          Migrating <span className="text-orange-400">{new URL(url).hostname}</span>
        </h1>
      </div>

      {/* Progress */}
      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <MigrationProgress state={state} />
      </section>

      {/* Error */}
      {state.status === 'error' && (
        <section className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{state.error}</p>
          <a
            href="/"
            className="mt-2 inline-block text-sm text-orange-400 hover:text-orange-300"
          >
            Try again
          </a>
        </section>
      )}

      {/* Results — shown once analysis is done */}
      {state.analysisSummary && (
        <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <DesignSystemPreview analysis={state.analysisSummary} />
        </section>
      )}

      {state.analysisSummary?.componentTypes && (
        <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ComponentList componentTypes={state.analysisSummary.componentTypes} />
        </section>
      )}

      {/* Theme file tree — shown once generation is done */}
      {state.themeSummary && (
        <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <ThemeFileTree summary={state.themeSummary} />
        </section>
      )}

      {/* Deploy — shown when migration is complete */}
      {state.status === 'complete' && deploy.status !== 'complete' && (
        <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <DeployForm onDeploy={handleDeploy} disabled={deploy.status === 'deploying'} />
          <div className="mt-4">
            <DeployStatusView status={deploy} />
          </div>
        </section>
      )}

      {deploy.status === 'complete' && (
        <section className="mb-8">
          <DeployStatusView status={deploy} />
        </section>
      )}
    </main>
  );
}

export default function MigratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <MigrateContent />
    </Suspense>
  );
}
