'use client';

import {cn} from '@/lib/utils';
import {formatShiftTime, getShiftTimeRange} from '@/lib/utils/production-day';
import {formatWeightCompact} from '@/lib/utils/weight';
import {FlowVisualization} from './flow-visualization';
import {TimelineStrip, TimelineCompact} from './timeline-strip';
import {
  LiveIndicator,
  UpcomingIndicator,
  CompletedIndicator,
} from './live-indicator';
import type {
  ProductionShift,
  ProductionRunListItem,
} from '@/types/production-run';
import {ChevronRight, Sun, Moon, Clock, Plus} from 'lucide-react';

interface ShiftMetrics {
  fishInputKg: number;
  fishmealOutputKg: number;
  fishOilOutputKg: number;
  vehicleCount?: number;
}

interface ShiftCardProps {
  shift: ProductionShift;
  runs: ProductionRunListItem[];
  metrics: ShiftMetrics;
  status: 'active' | 'upcoming' | 'completed';
  currentTime?: string; // HH:mm format
  onShiftClick?: () => void;
  onRunClick?: (run: ProductionRunListItem) => void;
  onAddOutput?: () => void;
  /** Whether to show full stats (fish input, yield). Default: true */
  showStats?: boolean;
  variant?: 'full' | 'compact' | 'mini';
  className?: string;
}

function getShiftIcon(shift: ProductionShift) {
  const code = shift.code?.toLowerCase() || '';
  const name = shift.name?.toLowerCase() || '';

  if (
    code.includes('day') ||
    name.includes('day') ||
    (shift.start_time >= '05:00' && shift.start_time <= '12:00')
  ) {
    return Sun;
  }
  if (code.includes('night') || name.includes('night')) {
    return Moon;
  }
  return Clock;
}

export function ShiftCard({
  shift,
  runs,
  metrics,
  status,
  currentTime,
  onShiftClick,
  onRunClick,
  onAddOutput,
  showStats = true,
  variant = 'full',
  className,
}: ShiftCardProps) {
  const ShiftIcon = getShiftIcon(shift);
  const totalOutputKg = metrics.fishmealOutputKg + metrics.fishOilOutputKg;
  const yieldPercentage =
    metrics.fishInputKg > 0 ? (totalOutputKg / metrics.fishInputKg) * 100 : 0;

  const completedRuns = runs.filter((r) => r.status === 'completed').length;
  const inProgressRuns = runs.filter((r) => r.status === 'in_progress').length;

  // Calculate timeline progress for compact view
  const timelineProgress = (() => {
    if (status === 'upcoming') return 0;
    if (status === 'completed') return 100;

    if (!currentTime) return 50;

    const [h, m] = currentTime.split(':').map(Number);
    const currentMinutes = h * 60 + m;
    const [sh, sm] = shift.start_time.split(':').map(Number);
    const [eh, em] = shift.end_time.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    const isOvernight = endMinutes < startMinutes;
    const totalDuration = isOvernight
      ? 24 * 60 - startMinutes + endMinutes
      : endMinutes - startMinutes;

    let elapsed;
    if (isOvernight && currentMinutes < startMinutes) {
      elapsed = 24 * 60 - startMinutes + currentMinutes;
    } else {
      elapsed = currentMinutes - startMinutes;
    }

    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  })();

  if (variant === 'mini') {
    return (
      <div
        className={cn(
          'rounded-lg p-3 transition-colors',
          status === 'active' && 'bg-primary/5 border-primary/20 border',
          status === 'upcoming' && 'bg-muted/30',
          status === 'completed' && 'bg-emerald-500/5',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <ShiftIcon
            className={cn(
              'size-5',
              status === 'active' && 'text-primary',
              status === 'upcoming' && 'text-muted-foreground',
              status === 'completed' && 'text-emerald-500'
            )}
          />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{shift.name}</span>
              {status === 'active' && <LiveIndicator size="sm" variant="dot" />}
            </div>
            <span className="text-muted-foreground text-xs">
              {formatWeightCompact(totalOutputKg)} output
            </span>
          </div>
          {showStats && (
            <span
              className={cn(
                'text-sm font-semibold',
                yieldPercentage >= 25 && 'text-emerald-500',
                yieldPercentage >= 20 &&
                  yieldPercentage < 25 &&
                  'text-amber-500',
                yieldPercentage < 20 && yieldPercentage > 0 && 'text-red-500'
              )}
            >
              {yieldPercentage > 0 ? `${yieldPercentage.toFixed(1)}%` : '--'}
            </span>
          )}
          {onShiftClick && (
            <button
              onClick={onShiftClick}
              className="hover:bg-muted rounded p-1"
            >
              <ChevronRight className="text-muted-foreground size-4" />
            </button>
          )}
        </div>
        {onAddOutput && (
          <button
            onClick={onAddOutput}
            className="bg-primary/10 text-primary hover:bg-primary/20 mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium"
          >
            <Plus className="size-3" />
            Add Output
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-xl p-4 transition-colors',
          status === 'active' && 'bg-primary/5 border-primary/20 border',
          status === 'upcoming' && 'bg-muted/30 border border-transparent',
          status === 'completed' &&
            'border border-emerald-500/20 bg-emerald-500/5',
          className
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShiftIcon
              className={cn(
                'size-5',
                status === 'active' && 'text-primary',
                status === 'upcoming' && 'text-muted-foreground',
                status === 'completed' && 'text-emerald-500'
              )}
            />
            <span className="font-semibold">{shift.name}</span>
            <span className="text-muted-foreground text-xs">
              {getShiftTimeRange(shift)}
            </span>
          </div>
          {status === 'active' && <LiveIndicator size="sm" />}
          {status === 'upcoming' && <UpcomingIndicator size="sm" />}
          {status === 'completed' && <CompletedIndicator size="sm" />}
        </div>

        {/* Flow + Yield compact */}
        <FlowVisualization
          fishInputKg={metrics.fishInputKg}
          fishmealOutputKg={metrics.fishmealOutputKg}
          fishOilOutputKg={metrics.fishOilOutputKg}
          variant="compact"
          showInput={showStats}
          showYield={showStats}
          className="mb-3"
        />

        {/* Timeline compact */}
        <TimelineCompact
          shift={shift}
          runsCount={runs.length}
          completedCount={completedRuns}
          isActive={status === 'active'}
          progress={timelineProgress}
        />

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {onAddOutput && (
            <button
              onClick={onAddOutput}
              className="bg-primary/10 text-primary hover:bg-primary/20 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium"
            >
              <Plus className="size-3.5" />
              Add Output
            </button>
          )}
          {onShiftClick && (
            <button
              onClick={onShiftClick}
              className="bg-muted text-muted-foreground hover:bg-muted/80 flex-1 rounded-lg py-2 text-sm font-medium"
            >
              View {runs.length} Run{runs.length !== 1 ? 's' : ''} →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border transition-colors',
        status === 'active' &&
          'from-primary/5 to-primary/10 border-primary/30 bg-gradient-to-br',
        status === 'upcoming' && 'bg-muted/20 border-muted-foreground/10',
        status === 'completed' &&
          'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          status === 'active' && 'bg-primary/10',
          status === 'completed' && 'bg-emerald-500/10'
        )}
        style={
          shift.color
            ? {
                backgroundColor: `${shift.color}15`,
                borderColor: `${shift.color}30`,
              }
            : undefined
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              status === 'active' && 'bg-primary/20',
              status === 'upcoming' && 'bg-muted',
              status === 'completed' && 'bg-emerald-500/20'
            )}
            style={
              shift.color ? {backgroundColor: `${shift.color}30`} : undefined
            }
          >
            <ShiftIcon
              className="size-5"
              style={shift.color ? {color: shift.color} : undefined}
            />
          </div>
          <div>
            <h3 className="font-semibold">{shift.name}</h3>
            <p className="text-muted-foreground text-xs">
              {getShiftTimeRange(shift)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'active' && (
            <LiveIndicator time={currentTime} variant="badge" />
          )}
          {status === 'upcoming' && <UpcomingIndicator />}
          {status === 'completed' && <CompletedIndicator />}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Flow Visualization with Yield */}
        <FlowVisualization
          fishInputKg={metrics.fishInputKg}
          vehicleCount={metrics.vehicleCount}
          fishmealOutputKg={metrics.fishmealOutputKg}
          fishOilOutputKg={metrics.fishOilOutputKg}
          showInput={showStats}
          showYield={showStats}
        />

        {/* Timeline */}
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-sm font-medium">
              Production Runs
            </span>
            <span className="text-muted-foreground text-xs">
              {completedRuns} completed
              {inProgressRuns > 0 && ` • ${inProgressRuns} in progress`}
            </span>
          </div>
          <TimelineStrip
            shift={shift}
            runs={runs}
            currentTime={currentTime}
            isActive={status === 'active'}
            onRunClick={onRunClick}
          />
        </div>
      </div>

      {/* Footer Actions */}
      {(onAddOutput || onShiftClick) && (
        <div className="flex border-t">
          {onAddOutput && (
            <button
              onClick={onAddOutput}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                'text-primary hover:bg-primary/5',
                onShiftClick && 'border-r'
              )}
            >
              <Plus className="size-4" />
              Add Output
            </button>
          )}
          {onShiftClick && (
            <button
              onClick={onShiftClick}
              className="text-muted-foreground hover:bg-muted/50 flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors"
            >
              View Details
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Empty shift state
interface ShiftEmptyProps {
  shift: ProductionShift;
  status: 'active' | 'upcoming';
  onStartRun?: () => void;
  className?: string;
}

export function ShiftEmpty({
  shift,
  status,
  onStartRun,
  className,
}: ShiftEmptyProps) {
  const ShiftIcon = getShiftIcon(shift);

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed p-6 text-center',
        status === 'active' && 'border-primary/30 bg-primary/5',
        status === 'upcoming' && 'border-muted-foreground/20 bg-muted/10',
        className
      )}
    >
      <ShiftIcon
        className={cn(
          'mx-auto mb-3 size-10',
          status === 'active' && 'text-primary/50',
          status === 'upcoming' && 'text-muted-foreground/30'
        )}
      />
      <h3 className="mb-1 font-semibold">{shift.name}</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        {getShiftTimeRange(shift)}
      </p>

      {status === 'active' ? (
        <>
          <p className="text-muted-foreground mb-4 text-sm">
            No production runs yet
          </p>
          {onStartRun && (
            <button
              onClick={onStartRun}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium"
            >
              + Start Production Run
            </button>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Starts at {formatShiftTime(shift.start_time)}
        </p>
      )}
    </div>
  );
}
