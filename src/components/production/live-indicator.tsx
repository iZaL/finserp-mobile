'use client';

import {cn} from '@/lib/utils';

interface LiveIndicatorProps {
  label?: string;
  time?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dot' | 'badge' | 'full';
  className?: string;
}

export function LiveIndicator({
  label = 'LIVE',
  time,
  size = 'md',
  variant = 'badge',
  className,
}: LiveIndicatorProps) {
  const sizeClasses = {
    sm: {
      dot: 'size-2',
      text: 'text-xs',
      padding: 'px-1.5 py-0.5',
      gap: 'gap-1',
    },
    md: {
      dot: 'size-2.5',
      text: 'text-sm',
      padding: 'px-2 py-1',
      gap: 'gap-1.5',
    },
    lg: {
      dot: 'size-3',
      text: 'text-base',
      padding: 'px-3 py-1.5',
      gap: 'gap-2',
    },
  };

  const sizes = sizeClasses[size];

  if (variant === 'dot') {
    return (
      <span className={cn('relative inline-flex', sizes.dot, className)}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400',
          sizes.padding,
          sizes.gap,
          sizes.text,
          className
        )}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
        </span>
        {label}
        {time && (
          <span className="text-emerald-600/70 dark:text-emerald-400/70">
            {time}
          </span>
        )}
      </span>
    );
  }

  // variant === 'full'
  return (
    <div
      className={cn(
        'flex items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        sizes.padding,
        sizes.gap,
        className
      )}
    >
      <span className="relative flex size-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
      </span>
      <div className="flex flex-col">
        <span className={cn('font-semibold', sizes.text)}>{label}</span>
        {time && (
          <span
            className={cn(
              'text-emerald-600/70 dark:text-emerald-400/70',
              size === 'lg' ? 'text-sm' : 'text-xs'
            )}
          >
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

// Inactive/Upcoming indicator for night shift
interface UpcomingIndicatorProps {
  label?: string;
  time?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UpcomingIndicator({
  label = 'UPCOMING',
  time,
  size = 'md',
  className,
}: UpcomingIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'bg-muted text-muted-foreground inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        className
      )}
    >
      <span className="bg-muted-foreground/50 size-2 rounded-full" />
      {label}
      {time && <span className="opacity-70">{time}</span>}
    </span>
  );
}

// Completed indicator
interface CompletedIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompletedIndicator({
  label = 'COMPLETED',
  size = 'md',
  className,
}: CompletedIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-blue-500/10 font-medium text-blue-600 dark:text-blue-400',
        sizeClasses[size],
        className
      )}
    >
      <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}
