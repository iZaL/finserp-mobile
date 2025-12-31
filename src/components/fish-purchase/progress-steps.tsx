'use client';

import {Check} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {LucideIcon} from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  activeStep: string;
  isStepComplete: (stepId: string) => boolean;
  onStepClick?: (stepId: string) => void;
}

export function ProgressSteps({
  steps,
  activeStep,
  isStepComplete,
  onStepClick,
}: ProgressStepsProps) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between">
        {/* Progress Line */}
        <div className="absolute top-5 right-0 left-0 h-0.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{
              width: `${(activeIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isComplete = isStepComplete(step.id);
          const isPast = index < activeIndex;
          const isClickable = onStepClick && (isComplete || isPast || isActive);

          return (
            <div
              key={step.id}
              className="relative flex flex-1 flex-col items-center gap-2"
            >
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  'z-10 flex size-10 items-center justify-center rounded-full border-2 transition-all',
                  'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
                  isComplete || isPast
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isActive
                      ? 'border-primary text-primary bg-white dark:bg-gray-900'
                      : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-500',
                  isClickable
                    ? 'cursor-pointer hover:scale-110'
                    : 'cursor-not-allowed'
                )}
              >
                {isComplete || isPast ? (
                  <Check className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </button>

              {/* Step Label */}
              <span
                className={cn(
                  'max-w-[80px] text-center text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : isComplete || isPast
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
