'use client';

import {cn} from '@/lib/utils';
import {ActivityDots} from './activity-dots';
import type {DayMovementSummary} from '@/types/movements-calendar';

interface CalendarDayCellProps {
  day: DayMovementSummary;
  onClick: () => void;
  className?: string;
}

function formatNetShort(net: number): string {
  const mt = Math.abs(net) / 1000;
  const sign = net >= 0 ? '+' : '-';
  if (mt >= 1) {
    return `${sign}${mt.toFixed(0)}`;
  }
  if (Math.abs(net) >= 100) {
    return `${sign}${(Math.abs(net) / 1000).toFixed(1)}`;
  }
  return '';
}

export function CalendarDayCell({
  day,
  onClick,
  className,
}: CalendarDayCellProps) {
  const hasMovements = day.movementCount > 0;
  const netText = formatNetShort(day.netMovement);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[52px] flex-col items-center justify-center rounded-lg p-1 transition-all',
        day.isSelected
          ? 'bg-blue-500 text-white'
          : day.isToday
            ? 'bg-blue-100'
            : 'hover:bg-muted/50',
        !day.isCurrentMonth && 'opacity-40',
        className
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          'text-sm font-medium',
          day.isSelected
            ? 'text-white'
            : day.isToday
              ? 'text-blue-600'
              : 'text-foreground'
        )}
      >
        {day.dayNumber}
      </span>

      {/* Activity dots */}
      {hasMovements && !day.isSelected && (
        <ActivityDots
          hasInbound={day.hasInbound}
          hasOutbound={day.hasOutbound}
          hasTransfer={day.hasTransfer}
          size="sm"
          className="mt-0.5"
        />
      )}

      {/* Show white dots when selected */}
      {hasMovements && day.isSelected && (
        <div className="mt-0.5 flex items-center justify-center gap-0.5">
          {day.hasInbound && (
            <span className="size-1 rounded-full bg-white/80" />
          )}
          {day.hasOutbound && (
            <span className="size-1 rounded-full bg-white/80" />
          )}
          {day.hasTransfer && (
            <span className="size-1 rounded-full bg-white/80" />
          )}
        </div>
      )}

      {/* Net movement text */}
      {hasMovements && netText && (
        <span
          className={cn(
            'text-[9px] font-medium',
            day.isSelected
              ? 'text-white/90'
              : day.netMovement >= 0
                ? 'text-green-600'
                : 'text-red-600'
          )}
        >
          {netText}
        </span>
      )}
    </button>
  );
}
