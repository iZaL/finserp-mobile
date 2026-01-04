'use client';

import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Play,
  ClipboardList,
  Package,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import {cn} from '@/lib/utils';

export type WorkflowState =
  | 'no_run'
  | 'recording'
  | 'batching'
  | 'transferring';

interface WorkflowProgressProps {
  currentState: WorkflowState;
}

const steps = [
  {key: 'run', icon: Play, href: '/production-runs'},
  {key: 'output', icon: ClipboardList, href: '/production-outputs'},
  {key: 'batch', icon: Package, href: '/batches'},
  {key: 'transfer', icon: ArrowRightLeft, href: '/batches/movements'},
] as const;

const stateToStepIndex: Record<WorkflowState, number> = {
  no_run: -1,
  recording: 0,
  batching: 1,
  transferring: 2,
};

export function WorkflowProgress({currentState}: WorkflowProgressProps) {
  const router = useRouter();
  const t = useTranslations('productionHub.workflow');

  const currentStepIndex = stateToStepIndex[currentState];

  return (
    <div className="bg-card w-full rounded-xl border p-4">
      <div className="flex w-full items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              {/* Step circle */}
              <button
                onClick={() => router.push(step.href)}
                className="flex flex-col items-center transition-transform hover:scale-105 active:scale-95"
              >
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted &&
                      'border-emerald-500 bg-emerald-500 text-white',
                    isActive && 'border-primary bg-primary/10 text-primary',
                    isFuture &&
                      'border-muted-foreground/30 bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-xs font-medium',
                    isActive && 'text-primary',
                    isFuture && 'text-muted-foreground',
                    isCompleted && 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {t(step.key)}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    index < currentStepIndex
                      ? 'bg-emerald-500'
                      : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
