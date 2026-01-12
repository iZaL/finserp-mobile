'use client';

import {useMemo} from 'react';
import {cn} from '@/lib/utils';
import {formatShiftTime} from '@/lib/utils/production-day';
import {formatWeightCompact} from '@/lib/utils/weight';
import type {
  ProductionShift,
  ProductionRunListItem,
} from '@/types/production-run';

interface TimelineStripProps {
  shift: ProductionShift;
  runs: ProductionRunListItem[];
  currentTime?: string; // HH:mm format
  isActive?: boolean;
  onRunClick?: (run: ProductionRunListItem) => void;
  className?: string;
}

/**
 * Calculate the percentage position of a time within a shift
 * Handles overnight shifts (e.g., 19:15 - 07:15)
 */
function getTimePosition(
  time: string,
  shiftStart: string,
  shiftEnd: string
): number {
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const start = timeToMinutes(shiftStart);
  const end = timeToMinutes(shiftEnd);
  const current = timeToMinutes(time);

  // Handle overnight shift
  const isOvernight = end < start;

  if (isOvernight) {
    // Total duration spans midnight
    const totalDuration = 24 * 60 - start + end;

    if (current >= start) {
      // Before midnight
      return ((current - start) / totalDuration) * 100;
    } else if (current < end) {
      // After midnight
      return ((24 * 60 - start + current) / totalDuration) * 100;
    }
  } else {
    // Normal day shift
    const totalDuration = end - start;
    return Math.max(
      0,
      Math.min(100, ((current - start) / totalDuration) * 100)
    );
  }

  return 0;
}

/**
 * Extract time from datetime string
 */
function extractTime(datetime: string | null): string | null {
  if (!datetime) return null;
  try {
    const date = new Date(datetime);
    return date.toTimeString().slice(0, 5);
  } catch {
    return null;
  }
}

export function TimelineStrip({
  shift,
  runs,
  currentTime,
  isActive = false,
  onRunClick,
  className,
}: TimelineStripProps) {
  const shiftStart = formatShiftTime(shift.start_time);
  const shiftEnd = formatShiftTime(shift.end_time);

  // Calculate NOW marker position
  const nowPosition = useMemo(() => {
    if (!currentTime || !isActive) return null;
    return getTimePosition(currentTime, shiftStart, shiftEnd);
  }, [currentTime, isActive, shiftStart, shiftEnd]);

  // Calculate run positions
  const runPositions = useMemo(() => {
    return runs.map((run) => {
      const startTime = extractTime(run.started_at);
      const endTime = extractTime(run.completed_at);

      // Default positions
      let left = 0;
      let width = 20; // Default width for planned runs

      if (startTime) {
        left = getTimePosition(startTime, shiftStart, shiftEnd);

        if (endTime) {
          // Completed run
          const right = getTimePosition(endTime, shiftStart, shiftEnd);
          width = Math.max(5, right - left);
        } else if (run.status === 'in_progress' && currentTime) {
          // In-progress run extends to NOW
          const right = getTimePosition(currentTime, shiftStart, shiftEnd);
          width = Math.max(5, right - left);
        } else {
          // Started but no end - use estimated width
          width = 15;
        }
      }

      return {run, left, width};
    });
  }, [runs, shiftStart, shiftEnd, currentTime]);

  // Generate time markers
  const timeMarkers = useMemo(() => {
    const markers: {time: string; position: number}[] = [];
    const startMinutes =
      parseInt(shiftStart.split(':')[0]) * 60 +
      parseInt(shiftStart.split(':')[1]);
    const endMinutes =
      parseInt(shiftEnd.split(':')[0]) * 60 + parseInt(shiftEnd.split(':')[1]);

    const isOvernight = endMinutes < startMinutes;
    const totalDuration = isOvernight
      ? 24 * 60 - startMinutes + endMinutes
      : endMinutes - startMinutes;

    // Add start marker
    markers.push({time: shiftStart, position: 0});

    // Add intermediate markers every ~3 hours
    const interval = 180; // 3 hours in minutes
    let currentMinutes = startMinutes + interval;

    while (true) {
      if (currentMinutes >= 24 * 60) {
        currentMinutes -= 24 * 60;
      }

      const elapsed = isOvernight
        ? currentMinutes < startMinutes
          ? 24 * 60 - startMinutes + currentMinutes
          : currentMinutes - startMinutes
        : currentMinutes - startMinutes;

      if (elapsed >= totalDuration - 60) break; // Stop before end

      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      markers.push({
        time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
        position: (elapsed / totalDuration) * 100,
      });

      currentMinutes += interval;
      if (markers.length > 6) break; // Safety limit
    }

    // Add end marker
    markers.push({time: shiftEnd, position: 100});

    return markers;
  }, [shiftStart, shiftEnd]);

  const getRunStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/80 border-emerald-600';
      case 'in_progress':
        return 'bg-blue-500/80 border-blue-600 animate-pulse';
      case 'planned':
        return 'bg-amber-500/50 border-amber-600 border-dashed';
      case 'canceled':
        return 'bg-muted border-muted-foreground/30';
      default:
        return 'bg-muted border-muted-foreground/30';
    }
  };

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '●';
      case 'planned':
        return '○';
      case 'canceled':
        return '✕';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Time markers */}
      <div className="relative h-4">
        {timeMarkers.map((marker, i) => (
          <span
            key={i}
            className="text-muted-foreground absolute -translate-x-1/2 text-[10px]"
            style={{left: `${marker.position}%`}}
          >
            {marker.time}
          </span>
        ))}
      </div>

      {/* Timeline track */}
      <div className="bg-muted/50 relative h-12 overflow-hidden rounded-lg">
        {/* Background grid lines */}
        {timeMarkers.slice(1, -1).map((marker, i) => (
          <div
            key={i}
            className="bg-muted-foreground/10 absolute top-0 h-full w-px"
            style={{left: `${marker.position}%`}}
          />
        ))}

        {/* Runs */}
        {runPositions.map(({run, left, width}) => (
          <button
            key={run.id}
            onClick={() => onRunClick?.(run)}
            className={cn(
              'absolute top-1.5 h-9 rounded-md border transition-all',
              'flex items-center justify-center gap-1 px-2',
              'hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
              'text-xs font-medium text-white',
              getRunStatusStyles(run.status)
            )}
            style={{
              left: `${left}%`,
              width: `${Math.max(width, 8)}%`,
              minWidth: '40px',
            }}
            title={`${run.name} - ${formatWeightCompact(run.total_actual)}`}
          >
            <span>{getRunStatusIcon(run.status)}</span>
            <span className="truncate">
              {run.name.replace(/^Run\s*/i, 'R')}
            </span>
          </button>
        ))}

        {/* NOW marker */}
        {nowPosition !== null && isActive && (
          <div
            className="pointer-events-none absolute top-0 z-10 h-full"
            style={{left: `${nowPosition}%`}}
          >
            <div className="relative h-full">
              {/* Line */}
              <div className="absolute top-0 left-0 h-full w-0.5 bg-red-500" />
              {/* Dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-red-500" />
                </span>
              </div>
              {/* NOW label */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <span className="rounded bg-red-500 px-1 text-[10px] font-bold text-white">
                  NOW
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {runs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              {isActive ? 'No runs yet' : 'No activity'}
            </span>
          </div>
        )}
      </div>

      {/* Legend for runs (compact) */}
      {runs.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {runs.map((run) => (
            <button
              key={run.id}
              onClick={() => onRunClick?.(run)}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5',
                'hover:bg-muted transition-colors',
                run.status === 'in_progress' &&
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                run.status === 'completed' &&
                  'text-emerald-600 dark:text-emerald-400',
                run.status === 'planned' &&
                  'text-amber-600 dark:text-amber-400',
                run.status === 'canceled' && 'text-muted-foreground'
              )}
            >
              <span>{getRunStatusIcon(run.status)}</span>
              <span>{run.name}</span>
              <span className="text-muted-foreground">
                {formatWeightCompact(run.total_actual)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
interface TimelineCompactProps {
  shift: ProductionShift;
  runsCount: number;
  completedCount: number;
  isActive?: boolean;
  progress?: number; // 0-100
  className?: string;
}

export function TimelineCompact({
  shift,
  runsCount,
  completedCount,
  isActive = false,
  progress = 0,
  className,
}: TimelineCompactProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{formatShiftTime(shift.start_time)}</span>
        <span>
          {completedCount}/{runsCount} runs
        </span>
        <span>{formatShiftTime(shift.end_time)}</span>
      </div>
      <div className="bg-muted relative h-2 overflow-hidden rounded-full">
        {/* Progress fill */}
        <div
          className={cn(
            'h-full transition-all duration-500',
            isActive ? 'bg-blue-500' : 'bg-emerald-500'
          )}
          style={{width: `${progress}%`}}
        />
        {/* NOW marker */}
        {isActive && (
          <div
            className="absolute top-0 h-full w-1 bg-red-500"
            style={{left: `${progress}%`}}
          />
        )}
      </div>
    </div>
  );
}
