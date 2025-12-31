'use client';

import {cn} from '@/lib/utils';

interface ActivityDotsProps {
  hasInbound: boolean;
  hasOutbound: boolean;
  hasTransfer: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ActivityDots({
  hasInbound,
  hasOutbound,
  hasTransfer,
  size = 'sm',
  className,
}: ActivityDotsProps) {
  const dotSize = size === 'sm' ? 'size-1.5' : 'size-2';
  const hasAny = hasInbound || hasOutbound || hasTransfer;

  if (!hasAny) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {hasInbound && (
        <span
          className={cn(dotSize, 'rounded-full bg-green-500')}
          aria-label="Inbound activity"
        />
      )}
      {hasOutbound && (
        <span
          className={cn(dotSize, 'rounded-full bg-red-500')}
          aria-label="Outbound activity"
        />
      )}
      {hasTransfer && (
        <span
          className={cn(dotSize, 'rounded-full bg-orange-500')}
          aria-label="Transfer activity"
        />
      )}
    </div>
  );
}
