'use client';

import {cn} from '@/lib/utils';
import {Badge} from '@/components/ui/badge';
import type {
  CalendarMovementItem,
  MovementCategory,
} from '@/types/movements-calendar';

interface MovementItemProps {
  movement: CalendarMovementItem;
  className?: string;
}

const categoryColors: Record<MovementCategory, string> = {
  inbound: 'border-l-green-500',
  outbound: 'border-l-red-500',
  transfer: 'border-l-orange-500',
};

const categoryBadgeColors: Record<MovementCategory, string> = {
  inbound: 'bg-green-100 text-green-700 hover:bg-green-100',
  outbound: 'bg-red-100 text-red-700 hover:bg-red-100',
  transfer: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
};

function formatQuantity(quantity: number): string {
  const mt = quantity / 1000;
  if (mt >= 1) {
    return `${mt.toLocaleString(undefined, {maximumFractionDigits: 2})} MT`;
  }
  return `${quantity.toLocaleString(undefined, {maximumFractionDigits: 2})} kg`;
}

export function MovementItem({movement, className}: MovementItemProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border-l-4 p-4',
        categoryColors[movement.category],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {movement.time}
            </span>
            <Badge
              variant="secondary"
              className={cn('text-xs', categoryBadgeColors[movement.category])}
            >
              {movement.typeLabel}
            </Badge>
          </div>
          <p className="text-foreground truncate text-sm font-medium">
            {movement.type}
          </p>
          <p className="text-muted-foreground text-sm">
            {formatQuantity(movement.quantity)} {movement.productType}
          </p>
        </div>
        {movement.infoBadge && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {movement.infoBadge}
          </Badge>
        )}
      </div>
    </div>
  );
}
