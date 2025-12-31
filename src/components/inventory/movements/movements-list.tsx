'use client';

import {Package} from 'lucide-react';
import {cn} from '@/lib/utils';
import {MovementItem} from './movement-item';
import type {CalendarMovementItem} from '@/types/movements-calendar';

interface MovementsListProps {
  title: string;
  movements: CalendarMovementItem[];
  emptyMessage?: string;
  className?: string;
}

export function MovementsList({
  title,
  movements,
  emptyMessage = 'No movements on this day',
  className,
}: MovementsListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>

      {movements.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
          <Package className="mb-2 size-10 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {movements.map((movement) => (
            <MovementItem key={movement.id} movement={movement} />
          ))}
        </div>
      )}
    </div>
  );
}
