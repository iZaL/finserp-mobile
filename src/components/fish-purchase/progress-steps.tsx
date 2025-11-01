"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-primary transition-all duration-300"
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
              className="relative flex flex-col items-center gap-2 flex-1"
            >
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center justify-center size-10 rounded-full border-2 transition-all z-10",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isComplete || isPast
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "bg-white dark:bg-gray-900 border-primary text-primary"
                    : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500",
                  isClickable ? "cursor-pointer hover:scale-110" : "cursor-not-allowed"
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
                  "text-xs font-medium text-center max-w-[80px] transition-colors",
                  isActive
                    ? "text-primary"
                    : isComplete || isPast
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-500 dark:text-gray-400"
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
