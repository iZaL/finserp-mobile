'use client';

import {getShiftTimeRange} from '@/lib/utils/production-day';
import {
  LiveIndicator,
  UpcomingIndicator,
  CompletedIndicator,
} from '../live-indicator';
import type {ProductionShift} from '@/types/production-run';
import {Sun, Moon, Clock} from 'lucide-react';
import {ProductionFlowVisual} from './production-flow-visual';

interface ShiftHeroProps {
  shift: ProductionShift;
  status: 'active' | 'upcoming' | 'completed';
  progress: number;
  metrics: {
    fishInputKg: number;
    fishmealOutputKg: number;
    fishOilOutputKg: number;
    vehicleCount: number;
  };
  /** Whether to show production stats (fish input, outputs). Default: true */
  showStats?: boolean;
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

export function ShiftHero({
  shift,
  status,
  metrics,
  showStats = true,
}: ShiftHeroProps) {
  const ShiftIcon = getShiftIcon(shift);
  const shiftColor = shift.color || '#6366f1';

  const hasData =
    metrics.fishInputKg > 0 ||
    metrics.fishmealOutputKg > 0 ||
    metrics.fishOilOutputKg > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${shiftColor}15 0%, ${shiftColor}05 100%)`,
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute -top-8 -right-8 size-28 rounded-full opacity-10"
        style={{backgroundColor: shiftColor}}
      />

      <div className="relative">
        {/* Top row: Shift name + Status badge */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="rounded-full p-1.5"
              style={{backgroundColor: `${shiftColor}20`}}
            >
              <ShiftIcon className="size-4" style={{color: shiftColor}} />
            </div>
            <div>
              <h2 className="text-lg leading-tight font-bold">{shift.name}</h2>
              <p className="text-muted-foreground text-xs">
                {getShiftTimeRange(shift)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {status === 'active' && <LiveIndicator variant="badge" />}
            {status === 'upcoming' && <UpcomingIndicator />}
            {status === 'completed' && <CompletedIndicator />}
          </div>
        </div>

        {/* Production Flow integrated - only show if user has permission */}
        {showStats && hasData && (
          <ProductionFlowVisual
            fishInputKg={metrics.fishInputKg}
            fishmealOutputKg={metrics.fishmealOutputKg}
            fishOilOutputKg={metrics.fishOilOutputKg}
            vehicleCount={metrics.vehicleCount}
            isActive={status === 'active'}
          />
        )}

        {/* Empty state when no data or no permission */}
        {showStats && !hasData && (
          <div className="text-muted-foreground py-4 text-center text-sm">
            No production data recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
