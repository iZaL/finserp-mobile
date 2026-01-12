'use client';

import {cn} from '@/lib/utils';
import {formatWeightCompact} from '@/lib/utils/weight';
import {Package} from 'lucide-react';

interface BagStackVisualProps {
  packageType?: string;
  packageCount: number;
  weightPerPackage?: number;
  totalWeight: number;
  className?: string;
}

function Bag({index, total}: {index: number; total: number}) {
  // Calculate slight rotation and offset for natural stacking look
  const rotation = ((index % 3) - 1) * 2;
  const offsetX = ((index % 3) - 1) * 2;
  const isTop = index >= total - 3;

  return (
    <div
      className={cn(
        'relative flex h-10 w-12 items-center justify-center rounded-sm',
        'bg-gradient-to-br from-amber-400 to-amber-500',
        'shadow-sm',
        isTop && 'shadow-md'
      )}
      style={{
        transform: `rotate(${rotation}deg) translateX(${offsetX}px)`,
      }}
    >
      {/* Bag texture lines */}
      <div className="absolute inset-1 rounded-sm border border-amber-600/20" />
      <div className="absolute top-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-amber-600/30" />
      <Package className="size-4 text-amber-800/50" />
    </div>
  );
}

export function BagStackVisual({
  packageType,
  packageCount,
  weightPerPackage,
  totalWeight,
  className,
}: BagStackVisualProps) {
  const maxVisibleBags = 12;
  const visibleBags = Math.min(packageCount, maxVisibleBags);
  const extraBags = packageCount - maxVisibleBags;

  return (
    <div className={cn('rounded-xl bg-amber-500/5 p-4', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500/20 p-2">
            <Package className="size-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold">Fishmeal Bags</h4>
            {packageType && (
              <p className="text-muted-foreground text-xs">{packageType}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-amber-600">{packageCount}</p>
          <p className="text-muted-foreground text-xs">bags</p>
        </div>
      </div>

      {/* Visual bag stack */}
      {packageCount > 0 ? (
        <div className="mb-4">
          <div
            className="mx-auto grid max-w-[200px] gap-1"
            style={{gridTemplateColumns: 'repeat(3, 1fr)'}}
          >
            {Array.from({length: visibleBags}).map((_, i) => (
              <div key={i} className="flex justify-center">
                <Bag index={i} total={visibleBags} />
              </div>
            ))}
          </div>

          {extraBags > 0 && (
            <div className="mt-2 text-center">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-700">
                + {extraBags} more bag{extraBags !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground mb-4 py-6 text-center text-sm">
          No bags packaged yet
        </div>
      )}

      {/* Stats */}
      <div className="border-t border-amber-500/20 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Weight</span>
          <span className="font-semibold">
            {formatWeightCompact(totalWeight)}
          </span>
        </div>
        {weightPerPackage && weightPerPackage > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Per Bag</span>
            <span className="font-medium">
              {formatWeightCompact(weightPerPackage)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
