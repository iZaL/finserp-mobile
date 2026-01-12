'use client';

import {cn} from '@/lib/utils';
import {Truck, Wheat, Droplet, ArrowRight, Package} from 'lucide-react';
import {formatWeightTon, formatWeightCompact} from '@/lib/utils/weight';
import {
  getYieldStatus,
  FISHMEAL_YIELD,
  FISH_OIL_YIELD,
  type YieldStatus,
} from '@/lib/utils/yield';

interface YieldRange {
  min: number;
  max: number;
  expected: number;
}

interface FlowVisualizationProps {
  fishInputKg: number;
  vehicleCount?: number;
  fishmealOutputKg: number;
  fishOilOutputKg: number;
  /** Custom yield range for fishmeal from backend */
  fishmealYieldRange?: YieldRange;
  /** Custom yield range for fish oil from backend */
  fishOilYieldRange?: YieldRange;
  variant?: 'horizontal' | 'compact';
  /** Show fish input section (default: true) */
  showInput?: boolean;
  /** Show yield percentages (default: true) */
  showYield?: boolean;
  className?: string;
}

export function FlowVisualization({
  fishInputKg,
  vehicleCount,
  fishmealOutputKg,
  fishOilOutputKg,
  fishmealYieldRange,
  fishOilYieldRange,
  variant = 'horizontal',
  showInput = true,
  showYield = true,
  className,
}: FlowVisualizationProps) {
  // Use custom ranges from backend or fall back to defaults
  const fishmealRange = fishmealYieldRange || FISHMEAL_YIELD;
  const fishOilRange = fishOilYieldRange || FISH_OIL_YIELD;

  // Calculate individual yields and their status
  const fishmealYield =
    fishInputKg > 0 ? (fishmealOutputKg / fishInputKg) * 100 : 0;
  const fishOilYield =
    fishInputKg > 0 ? (fishOilOutputKg / fishInputKg) * 100 : 0;
  const fishmealStatus = getYieldStatus(fishmealYield, fishmealRange);
  const fishOilStatus = getYieldStatus(fishOilYield, fishOilRange);

  // Status-based colors for yield bars
  const getBarColor = (status: YieldStatus) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'bad':
        return 'bg-red-500';
    }
  };

  const getTextColor = (status: YieldStatus) => {
    switch (status) {
      case 'good':
        return 'text-emerald-500';
      case 'warning':
        return 'text-amber-500';
      case 'bad':
        return 'text-red-500';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between gap-2', className)}>
        {/* Input - only show if showInput is true */}
        {showInput && (
          <>
            <div className="flex items-center gap-1.5">
              <Truck className="size-4 text-blue-500" />
              <span className="font-semibold">
                {formatWeightCompact(fishInputKg)}
              </span>
            </div>
            <ArrowRight className="text-muted-foreground size-4" />
          </>
        )}

        {/* Output with individual yields */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Wheat className="size-4 text-amber-500" />
            <span className="font-medium">
              {formatWeightCompact(fishmealOutputKg)}
            </span>
            {showYield && fishInputKg > 0 && (
              <span
                className={cn(
                  'text-xs font-medium',
                  getTextColor(fishmealStatus)
                )}
              >
                {fishmealYield.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Droplet className="size-4 text-cyan-500" />
            <span className="font-medium">
              {formatWeightCompact(fishOilOutputKg)}
            </span>
            {showYield && fishInputKg > 0 && (
              <span
                className={cn(
                  'text-xs font-medium',
                  getTextColor(fishOilStatus)
                )}
              >
                {fishOilYield.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-stretch gap-4">
        {/* Input Card - only show if showInput is true */}
        {showInput && (
          <>
            <div className="flex-1 rounded-xl bg-blue-500/10 p-4">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Truck className="size-5" />
                <span className="text-sm font-medium tracking-wide uppercase">
                  Fish Input
                </span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">
                  {formatWeightTon(fishInputKg)}
                </span>
                {vehicleCount !== undefined && vehicleCount > 0 && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center">
              <div className="flex h-full items-center">
                <div className="via-muted-foreground h-0.5 w-8 bg-gradient-to-r from-blue-500 to-amber-500" />
                <ArrowRight className="-ml-1 size-5 text-amber-500" />
              </div>
            </div>
          </>
        )}

        {/* Output Card */}
        <div className="flex-1 rounded-xl bg-gradient-to-br from-amber-500/10 to-cyan-500/10 p-4">
          <div className="flex items-center gap-2">
            <Package className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
              Output
            </span>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Wheat className="size-4 text-amber-500" />
              <span className="font-semibold">
                {formatWeightTon(fishmealOutputKg)}
              </span>
              <span className="text-muted-foreground text-xs">Fishmeal</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplet className="size-4 text-cyan-500" />
              <span className="font-semibold">
                {formatWeightTon(fishOilOutputKg)}
              </span>
              <span className="text-muted-foreground text-xs">Fish Oil</span>
            </div>
          </div>
        </div>
      </div>

      {/* Yield Bars - Separate for each product type with status colors */}
      {showYield && fishInputKg > 0 && (
        <div className="space-y-3 rounded-lg bg-white/10 p-3">
          {/* Fishmeal Yield */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wheat className="size-3.5 text-amber-400" />
                <span className="text-sm font-medium">Fishmeal</span>
                <span className="text-xs opacity-60">
                  ({fishmealRange.min}-{fishmealRange.max}%)
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  getTextColor(fishmealStatus)
                )}
              >
                {fishmealYield.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  getBarColor(fishmealStatus)
                )}
                style={{width: `${Math.min(fishmealYield * 3, 100)}%`}}
              />
            </div>
          </div>

          {/* Fish Oil Yield */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Droplet className="size-3.5 text-cyan-400" />
                <span className="text-sm font-medium">Fish Oil</span>
                <span className="text-xs opacity-60">
                  ({fishOilRange.min}-{fishOilRange.max}%)
                </span>
              </div>
              <span
                className={cn('text-sm font-bold', getTextColor(fishOilStatus))}
              >
                {fishOilYield.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  getBarColor(fishOilStatus)
                )}
                style={{width: `${Math.min(fishOilYield * 8, 100)}%`}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Smaller inline version for list items
interface FlowInlineProps {
  fishInputKg: number;
  fishmealOutputKg: number;
  fishOilOutputKg: number;
  className?: string;
}

export function FlowInline({
  fishInputKg,
  fishmealOutputKg,
  fishOilOutputKg,
  className,
}: FlowInlineProps) {
  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <span className="text-muted-foreground">
        {formatWeightCompact(fishInputKg)}
      </span>
      <ArrowRight className="text-muted-foreground/50 size-3" />
      <span className="text-amber-600 dark:text-amber-400">
        {formatWeightCompact(fishmealOutputKg)}
      </span>
      <span className="text-muted-foreground/50">+</span>
      <span className="text-cyan-600 dark:text-cyan-400">
        {formatWeightCompact(fishOilOutputKg)}
      </span>
    </div>
  );
}

// Empty state for no production
interface FlowEmptyProps {
  message?: string;
  className?: string;
}

export function FlowEmpty({className}: FlowEmptyProps) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center justify-center gap-4 py-8',
        className
      )}
    >
      <div className="flex items-center gap-2 opacity-50">
        <Truck className="size-5" />
        <span>--</span>
      </div>
      <ArrowRight className="size-4 opacity-30" />
      <div className="flex items-center gap-4 opacity-50">
        <div className="flex items-center gap-1">
          <Wheat className="size-4" />
          <span>--</span>
        </div>
        <div className="flex items-center gap-1">
          <Droplet className="size-4" />
          <span>--</span>
        </div>
      </div>
    </div>
  );
}
