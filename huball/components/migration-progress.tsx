import type { MigrationState } from '@/lib/types';
import { StepIndicator, type StepStatus } from './step-indicator';

interface MigrationProgressProps {
  state: MigrationState;
}

const STEPS = [
  { key: 'crawling', label: 'Crawling website' },
  { key: 'analyzing', label: 'Analyzing design system' },
  { key: 'generating', label: 'Generating HubSpot theme' },
] as const;

const STEP_ORDER = ['connecting', 'crawling', 'analyzing', 'generating', 'complete'] as const;

function getStepStatus(stepKey: string, currentStatus: string): StepStatus {
  if (currentStatus === 'error') {
    const currentIdx = STEP_ORDER.indexOf(currentStatus as (typeof STEP_ORDER)[number]);
    const stepIdx = STEP_ORDER.indexOf(stepKey as (typeof STEP_ORDER)[number]);
    if (stepIdx < currentIdx) return 'complete';
    return 'error';
  }

  const currentIdx = STEP_ORDER.indexOf(currentStatus as (typeof STEP_ORDER)[number]);
  const stepIdx = STEP_ORDER.indexOf(stepKey as (typeof STEP_ORDER)[number]);

  if (stepIdx < currentIdx) return 'complete';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

function getLatestMessage(state: MigrationState, stepKey: string): string | undefined {
  const msgs = state.messages.filter((m) => m.step === stepKey);
  return msgs.length > 0 ? msgs[msgs.length - 1].message : undefined;
}

export function MigrationProgress({ state }: MigrationProgressProps) {
  return (
    <div className="space-y-5">
      {STEPS.map(({ key, label }) => (
        <StepIndicator
          key={key}
          label={label}
          status={getStepStatus(key, state.status)}
          message={getLatestMessage(state, key)}
        />
      ))}
    </div>
  );
}
