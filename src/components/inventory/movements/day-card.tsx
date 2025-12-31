'use client';

import {cn} from '@/lib/utils';
import {ActivityDots} from './activity-dots';
import type {DayMovementSummary} from '@/types/movements-calendar';

interface DayCardProps {
  day: DayMovementSummary;
  onClick: () => void;
  className?: string;
}

function formatNetMovement(net: number): string {
  const mt = Math.abs(net) / 1000;
  const sign = net >= 0 ? '+' : '-';
  if (mt >= 1) {
    return `${sign}${mt.toLocaleString(undefined, {maximumFractionDigits: 1})} MT`;
  }
  if (Math.abs(net) >= 1) {
    return `${sign}${Math.abs(net).toLocaleString(undefined, {maximumFractionDigits: 0})} kg`;
  }
  return '';
}

export function DayCard({day, onClick, className}: DayCardProps) {
  const hasMovements = day.movementCount > 0;
  const netText = formatNetMovement(day.netMovement);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-w-[48px] flex-col items-center justify-center rounded-lg p-2 transition-all',
        'border-2',
        day.isSelected
          ? 'border-blue-500 bg-blue-50'
          : day.isToday
            ? 'border-blue-200 bg-blue-50/50'
            : 'bg-muted/50 hover:bg-muted border-transparent',
        !day.isCurrentMonth && 'opacity-50',
        className
      )}
    >
      {/* Day name */}
      <span className="text-muted-foreground text-[10px] font-medium uppercase">
        {day.dayName}
      </span>

      {/* Day number */}
      <span
        className={cn(
          'text-lg font-semibold',
          day.isSelected ? 'text-blue-600' : 'text-foreground'
        )}
      >
        {day.dayNumber}
      </span>

      {/* Activity dots */}
      <ActivityDots
        hasInbound={day.hasInbound}
        hasOutbound={day.hasOutbound}
        hasTransfer={day.hasTransfer}
        size="sm"
        className="mt-1"
      />

      {/* Net movement */}
      {hasMovements && netText && (
        <span
          className={cn(
            'mt-1 text-[10px] font-medium',
            day.netMovement >= 0 ? 'text-green-600' : 'text-red-600'
          )}
        >
          {netText}
        </span>
      )}
    </button>
  );
}
