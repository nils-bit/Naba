'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MigrationState, MigrationStatus } from './types';

const initialState: MigrationState = {
  status: 'connecting',
  sessionId: null,
  crawlSummary: null,
  analysisSummary: null,
  themeSummary: null,
  error: null,
  messages: [],
};

export function useMigrationSSE(url: string | null, themeName?: string) {
  const [state, setState] = useState<MigrationState>(initialState);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!url || startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, themeName }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: 'Migration failed' }));
          if (!cancelled) {
            setState((s) => ({ ...s, status: 'error', error: err.error || 'Migration failed' }));
          }
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
              if (!cancelled) {
                handleEvent(currentEvent, data, setState);
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && !cancelled) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: err instanceof Error ? err.message : 'Connection failed',
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
      startedRef.current = false;
      controller.abort();
    };
  }, [url, themeName]);

  return state;
}

function handleEvent(
  event: string,
  data: Record<string, unknown>,
  setState: React.Dispatch<React.SetStateAction<MigrationState>>,
) {
  if (event === 'progress') {
    const step = data.step as string;
    const message = data.message as string;

    setState((s) => ({
      ...s,
      status: step as MigrationStatus,
      messages: [...s.messages, { step, message, timestamp: Date.now() }],
      // Populate summaries from progress data
      crawlSummary:
        step === 'crawling' && data.data
          ? {
              componentCount: (data.data as Record<string, unknown>).componentCount as number,
              colorCount: (data.data as Record<string, unknown>).colorCount as number,
              fontCount: (data.data as Record<string, unknown>).fontCount as number,
              pageTitle: ((data.data as Record<string, unknown>).pageTitle as string) || '',
            }
          : s.crawlSummary,
      analysisSummary:
        step === 'analyzing' && data.data
          ? {
              colors: (data.data as Record<string, unknown>).colors as MigrationState['analysisSummary'] extends null ? never : NonNullable<MigrationState['analysisSummary']>['colors'],
              fonts: (data.data as Record<string, unknown>).fonts as NonNullable<MigrationState['analysisSummary']>['fonts'],
              spacing: (data.data as Record<string, unknown>).spacing as NonNullable<MigrationState['analysisSummary']>['spacing'],
              componentTypes: (data.data as Record<string, unknown>).componentTypes as string[],
            }
          : s.analysisSummary,
    }));
  } else if (event === 'complete') {
    setState((s) => ({
      ...s,
      status: 'complete',
      sessionId: data.sessionId as string,
      themeSummary: {
        moduleCount: data.moduleCount as number,
        templateCount: data.templateCount as number,
        moduleNames: data.moduleNames as string[],
        themeName: data.themeName as string,
      },
    }));
  } else if (event === 'error') {
    setState((s) => ({
      ...s,
      status: 'error',
      error: data.message as string,
    }));
  }
}
