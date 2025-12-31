'use client';

import {cn} from '@/lib/utils';
import {CalendarDayCell} from './calendar-day-cell';
import type {DayMovementSummary} from '@/types/movements-calendar';

interface CalendarGridProps {
  weeks: DayMovementSummary[][];
  onDaySelect: (date: Date) => void;
  dayHeaders?: string[];
  className?: string;
}

const DEFAULT_DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  weeks,
  onDaySelect,
  dayHeaders = DEFAULT_DAY_HEADERS,
  className,
}: CalendarGridProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayHeaders.map((header) => (
          <div
            key={header}
            className="text-muted-foreground py-1 text-center text-[10px] font-medium uppercase"
          >
            {header}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => (
              <CalendarDayCell
                key={day.date}
                day={day}
                onClick={() => onDaySelect(new Date(day.date))}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
