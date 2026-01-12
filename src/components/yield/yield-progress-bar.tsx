'use client';

import {cn} from '@/lib/utils';
import {
  type YieldRange,
  type YieldStatus,
  getYieldStatus,
  getYieldStatusBgColor,
  getYieldStatusColor,
  getYieldProgressPercent,
  formatYieldPercentage,
} from '@/lib/utils/yield';

interface YieldProgressBarProps {
  label: string;
  percentage: number;
  range: YieldRange;
  showRange?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function YieldProgressBar({
  label,
  percentage,
  range,
  showRange = true,
  size = 'md',
  className,
}: YieldProgressBarProps) {
  const status = getYieldStatus(percentage, range);
  const progressPercent = getYieldProgressPercent(percentage, range);
  const statusColor = getYieldStatusColor(status);
  const statusBgColor = getYieldStatusBgColor(status);

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className={cn('font-medium', textSizeClass)}>{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold', textSizeClass, statusColor)}>
            {formatYieldPercentage(percentage)}
          </span>
          <YieldStatusIcon status={status} size={size} />
        </div>
      </div>

      <div
        className={cn(
          'bg-muted relative w-full overflow-hidden rounded-full',
          heightClass
        )}
      >
        <div
          className={cn('h-full transition-all duration-500', statusBgColor)}
          style={{width: `${progressPercent}%`}}
        />
        {/* Expected range markers */}
        {showRange && (
          <>
            <div
              className="bg-muted-foreground/30 absolute top-0 h-full w-0.5"
              style={{left: `${getYieldProgressPercent(range.min, range)}%`}}
            />
            <div
              className="bg-muted-foreground/30 absolute top-0 h-full w-0.5"
              style={{left: `${getYieldProgressPercent(range.max, range)}%`}}
            />
          </>
        )}
      </div>

      {showRange && (
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>
            Expected: {range.min}-{range.max}%
          </span>
          <span>Target: {range.expected}%</span>
        </div>
      )}
    </div>
  );
}

interface YieldStatusIconProps {
  status: YieldStatus;
  size?: 'sm' | 'md' | 'lg';
}

function YieldStatusIcon({status, size = 'md'}: YieldStatusIconProps) {
  const sizeClass = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5',
  }[size];

  const colors = {
    good: 'text-emerald-500',
    warning: 'text-amber-500',
    bad: 'text-red-500',
  };

  return (
    <span className={cn(sizeClass, colors[status])}>
      {status === 'good' && (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === 'warning' && (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === 'bad' && (
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  );
}

export {YieldStatusIcon};
