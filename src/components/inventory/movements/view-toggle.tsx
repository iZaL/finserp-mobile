'use client';

import {cn} from '@/lib/utils';
import type {CalendarViewMode} from '@/types/movements-calendar';

interface ViewToggleProps {
  value: CalendarViewMode;
  onChange: (value: CalendarViewMode) => void;
  weekLabel?: string;
  monthLabel?: string;
}

export function ViewToggle({
  value,
  onChange,
  weekLabel = 'Week',
  monthLabel = 'Month',
}: ViewToggleProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="bg-muted inline-flex rounded-full p-1">
        <button
          type="button"
          onClick={() => onChange('week')}
          className={cn(
            'rounded-full px-6 py-2 text-sm font-medium transition-all',
            value === 'week'
              ? 'text-foreground bg-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {weekLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange('month')}
          className={cn(
            'rounded-full px-6 py-2 text-sm font-medium transition-all',
            value === 'month'
              ? 'text-foreground bg-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {monthLabel}
        </button>
      </div>
    </div>
  );
}
