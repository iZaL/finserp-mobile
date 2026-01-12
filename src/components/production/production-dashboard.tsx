'use client';

import {useMemo} from 'react';
import {cn} from '@/lib/utils';
import {
  getProductionDayString,
  getCurrentShift,
  formatFactoryTime,
  type ProductionDayConfig,
} from '@/lib/utils/production-day';
import {FlowVisualization} from './flow-visualization';
import {ShiftCard, ShiftEmpty} from './shift-card';
import {LiveIndicator} from './live-indicator';
import type {
  ProductionShift,
  ProductionRunListItem,
} from '@/types/production-run';
import {Calendar, ChevronLeft, ChevronRight} from 'lucide-react';

/**
 * Aggregated metrics for a shift or day
 * All outputs are cumulative from multiple production runs/outputs
 */
interface AggregatedMetrics {
  fishInputKg: number;
  fishmealOutputKg: number;
  fishOilOutputKg: number;
  vehicleCount: number;
}

/**
 * Shift data with its runs and aggregated metrics
 */
interface ShiftData {
  shift: ProductionShift;
  runs: ProductionRunListItem[];
  metrics: AggregatedMetrics;
}

interface ProductionDashboardProps {
  /** Date in yyyy-MM-dd format (production day, not calendar day) */
  date: string;
  /** All shifts from backend */
  shifts: ProductionShift[];
  /** Factory timezone from backend */
  timezone: string;
  /** Shift data with runs and aggregated metrics */
  shiftData: ShiftData[];
  /** Loading state */
  isLoading?: boolean;
  /** Navigate to previous day */
  onPrevDay?: () => void;
  /** Navigate to next day */
  onNextDay?: () => void;
  /** Open date picker */
  onDatePick?: () => void;
  /** View shift details */
  onShiftClick?: (shift: ProductionShift) => void;
  /** View run details */
  onRunClick?: (run: ProductionRunListItem) => void;
  /** Start new production run */
  onStartRun?: () => void;
  className?: string;
}

export function ProductionDashboard({
  date,
  shifts,
  timezone,
  shiftData,
  isLoading = false,
  onPrevDay,
  onNextDay,
  onDatePick,
  onShiftClick,
  onRunClick,
  onStartRun,
  className,
}: ProductionDashboardProps) {
  const config: ProductionDayConfig = {timezone, shifts};

  // Get current production day and time
  const now = new Date();
  const currentProductionDay = getProductionDayString(now, config);
  const currentTime = formatFactoryTime(now, 'HH:mm', timezone);
  const isToday = date === currentProductionDay;

  // Get current shift (if viewing today)
  const currentShift = isToday ? getCurrentShift(shifts, timezone) : null;

  // Calculate day totals (cumulative across all shifts)
  const dayTotals = useMemo(() => {
    return shiftData.reduce(
      (acc, {metrics}) => ({
        fishInputKg: acc.fishInputKg + metrics.fishInputKg,
        fishmealOutputKg: acc.fishmealOutputKg + metrics.fishmealOutputKg,
        fishOilOutputKg: acc.fishOilOutputKg + metrics.fishOilOutputKg,
        vehicleCount: acc.vehicleCount + metrics.vehicleCount,
      }),
      {fishInputKg: 0, fishmealOutputKg: 0, fishOilOutputKg: 0, vehicleCount: 0}
    );
  }, [shiftData]);

  // Total runs across all shifts
  const totalRuns = shiftData.reduce((acc, {runs}) => acc + runs.length, 0);
  const activeRuns = shiftData.reduce(
    (acc, {runs}) =>
      acc + runs.filter((r) => r.status === 'in_progress').length,
    0
  );

  // Determine shift status
  const getShiftStatus = (
    shift: ProductionShift
  ): 'active' | 'upcoming' | 'completed' => {
    if (!isToday) return 'completed';
    if (currentShift?.id === shift.id) return 'active';

    // Check if shift is before or after current
    const shiftStart = shift.start_time.slice(0, 5);
    const currentShiftStart = currentShift?.start_time.slice(0, 5) || '00:00';

    // For overnight shifts, logic is more complex
    if (shiftStart > currentShiftStart) {
      return 'upcoming';
    }
    return 'completed';
  };

  // Format date for display
  const displayDate = useMemo(() => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevDay}
          className="hover:bg-muted rounded-lg p-2 transition-all active:scale-95"
          aria-label="Previous day"
        >
          <ChevronLeft className="size-5" />
        </button>

        <button
          onClick={onDatePick}
          className="hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        >
          <Calendar className="text-muted-foreground size-4" />
          <span className="font-semibold">{displayDate}</span>
          {isToday && <LiveIndicator size="sm" variant="dot" />}
        </button>

        <button
          onClick={onNextDay}
          className="hover:bg-muted rounded-lg p-2 transition-all active:scale-95"
          aria-label="Next day"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Day Summary Card */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white dark:from-slate-800 dark:to-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">
            Daily Production
          </span>
          {isToday && activeRuns > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              {activeRuns} Active
            </span>
          )}
        </div>

        <FlowVisualization
          fishInputKg={dayTotals.fishInputKg}
          vehicleCount={dayTotals.vehicleCount}
          fishmealOutputKg={dayTotals.fishmealOutputKg}
          fishOilOutputKg={dayTotals.fishOilOutputKg}
          className="[&_*]:text-white [&_.text-muted-foreground]:text-slate-400"
        />

        <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3 text-sm">
          <span className="text-slate-400">
            {totalRuns} Production Run{totalRuns !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-400">
            {shifts.length} Shift{shifts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground text-sm">
              Loading production data...
            </span>
          </div>
        </div>
      )}

      {/* Shift Cards */}
      {!isLoading && (
        <div className="space-y-4">
          {shiftData.map(({shift, runs, metrics}) => {
            const status = getShiftStatus(shift);
            const hasActivity = runs.length > 0 || metrics.fishInputKg > 0;

            if (!hasActivity && status === 'upcoming') {
              return (
                <ShiftEmpty
                  key={shift.id}
                  shift={shift}
                  status="upcoming"
                  onStartRun={undefined}
                />
              );
            }

            if (!hasActivity && status !== 'active') {
              // Show mini card for empty completed shifts
              return (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  runs={runs}
                  metrics={metrics}
                  status={status}
                  variant="mini"
                  onShiftClick={() => onShiftClick?.(shift)}
                />
              );
            }

            return (
              <ShiftCard
                key={shift.id}
                shift={shift}
                runs={runs}
                metrics={metrics}
                status={status}
                currentTime={isToday ? currentTime : undefined}
                onShiftClick={() => onShiftClick?.(shift)}
                onRunClick={onRunClick}
                variant={status === 'active' ? 'full' : 'compact'}
              />
            );
          })}

          {/* Empty State */}
          {shiftData.length === 0 && (
            <div className="border-muted-foreground/20 rounded-xl border-2 border-dashed p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No production data for this day
              </p>
              {isToday && onStartRun && (
                <button
                  onClick={onStartRun}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  + Start Production Run
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button for active day */}
      {isToday && !isLoading && onStartRun && (
        <div className="fixed right-4 bottom-20 z-10">
          <button
            onClick={onStartRun}
            className={cn(
              'bg-primary flex items-center gap-2 rounded-full px-4 py-3',
              'text-primary-foreground text-sm font-semibold shadow-lg',
              'hover:bg-primary/90 transition-all active:scale-95'
            )}
          >
            <span className="text-lg">+</span>
            New Run
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for dashboard
 */
export function ProductionDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Date header skeleton */}
      <div className="flex items-center justify-between">
        <div className="bg-muted size-9 rounded-lg" />
        <div className="bg-muted h-9 w-40 rounded-lg" />
        <div className="bg-muted size-9 rounded-lg" />
      </div>

      {/* Summary card skeleton */}
      <div className="bg-muted h-40 rounded-xl" />

      {/* Shift cards skeleton */}
      <div className="bg-muted h-64 rounded-xl" />
      <div className="bg-muted h-32 rounded-xl" />
    </div>
  );
}
