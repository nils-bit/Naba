export type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface StepIndicatorProps {
  label: string;
  status: StepStatus;
  message?: string;
}

export function StepIndicator({ label, status, message }: StepIndicatorProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex-shrink-0">
        {status === 'pending' && (
          <div className="h-6 w-6 rounded-full border-2 border-zinc-700" />
        )}
        {status === 'active' && (
          <div className="h-6 w-6 rounded-full border-2 border-orange-500">
            <div className="h-full w-full animate-pulse rounded-full bg-orange-500/30" />
          </div>
        )}
        {status === 'complete' && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className={`font-medium ${status === 'pending' ? 'text-zinc-500' : status === 'error' ? 'text-red-400' : 'text-zinc-100'}`}>
          {label}
        </p>
        {message && (
          <p className={`mt-0.5 text-sm ${status === 'error' ? 'text-red-400/80' : 'text-zinc-400'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
