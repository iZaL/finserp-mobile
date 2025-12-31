'use client';

import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface MonthNavigatorProps {
  formattedMonth: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday?: () => void;
  todayLabel?: string;
  className?: string;
}

export function MonthNavigator({
  formattedMonth,
  onPrevious,
  onNext,
  onToday,
  todayLabel = 'Today',
  className,
}: MonthNavigatorProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Button variant="ghost" size="icon" onClick={onPrevious}>
        <ChevronLeft className="size-5" />
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formattedMonth}</span>
        {onToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="h-7 px-2 text-xs"
          >
            {todayLabel}
          </Button>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={onNext}>
        <ChevronRight className="size-5" />
      </Button>
    </div>
  );
}
