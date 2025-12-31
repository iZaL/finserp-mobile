'use client';

import {cn} from '@/lib/utils';
import {DayCard} from './day-card';
import type {DayMovementSummary} from '@/types/movements-calendar';

interface DayCardsRowProps {
  days: DayMovementSummary[];
  onDaySelect: (date: Date) => void;
  className?: string;
}

export function DayCardsRow({days, onDaySelect, className}: DayCardsRowProps) {
  return (
    <div
      className={cn(
        'flex items-stretch justify-between gap-1 overflow-x-auto pb-2',
        className
      )}
    >
      {days.map((day) => (
        <DayCard
          key={day.date}
          day={day}
          onClick={() => onDaySelect(new Date(day.date))}
          className="flex-1"
        />
      ))}
    </div>
  );
}
