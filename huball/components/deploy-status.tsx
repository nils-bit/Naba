import type { DeployStatus } from '@/lib/types';

interface Props {
  status: DeployStatus;
}

export function DeployStatusView({ status }: Props) {
  if (status.status === 'idle') return null;

  return (
    <div className="space-y-3">
      {status.status === 'deploying' && (
        <div className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <span className="text-sm text-zinc-300">{status.message}</span>
        </div>
      )}

      {status.status === 'complete' && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-4 text-center">
          <p className="mb-2 text-lg font-semibold text-green-400">Deployed!</p>
          {status.designManagerUrl && (
            <a
              href={status.designManagerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
            >
              Open Design Manager &rarr;
            </a>
          )}
        </div>
      )}

      {status.status === 'error' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
          <p className="text-sm text-red-400">{status.message}</p>
        </div>
      )}
    </div>
  );
}
