'use client';

import {useTranslations} from 'next-intl';
import {Badge} from '@/components/ui/badge';
import {
  AlertTriangle,
  Gauge,
  Shield,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import type {DailyCapacity} from '@/types/vehicle-booking';
import {cn} from '@/lib/utils';

interface CapacityCardProps {
  capacity: DailyCapacity | null;
  loading?: boolean;
  allowOverride?: boolean;
}

export function CapacityCard({
  capacity,
  loading,
  allowOverride,
}: CapacityCardProps) {
  const t = useTranslations('vehicleBookings.capacity');

  // Format tons: remove decimal if zero, keep if non-zero
  const formatTons = (value: number): string => {
    const formatted = value % 1 === 0 ? Math.floor(value) : value.toFixed(1);
    return `${formatted}`;
  };

  // Use backend-calculated data exclusively (no frontend calculations)
  const bookedBoxes = Number(capacity?.booked_boxes || 0);
  const receivedBoxes = Number(capacity?.received_boxes || 0);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-muted size-14 animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-2 w-full animate-pulse rounded-full" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!capacity) {
    return null;
  }

  // Use backend-calculated remaining capacity and percentages (ensure numbers)
  const remainingBoxes = Number(capacity?.remaining_capacity_boxes || 0);
  const limitTons = Number(capacity?.daily_limit_tons || 0);
  const remainingTons = Number(capacity?.remaining_capacity_tons || 0);
  const totalBookedTons = Number(capacity?.total_booked_tons || 0);

  // Calculate usage percent based on TONS (not boxes) for accurate progress
  const usagePercent = limitTons > 0 ? (totalBookedTons / limitTons) * 100 : 0;

  const isWarning = usagePercent >= 80 && usagePercent < 100;
  const isDanger = usagePercent >= 100;

  // Determine colors based on status
  const getStatusColor = () => {
    if (isDanger)
      return {
        ring: 'text-red-500',
        bg: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
      };
    if (isWarning)
      return {
        ring: 'text-amber-500',
        bg: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
      };
    return {
      ring: 'text-emerald-500',
      bg: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  };

  const statusColor = getStatusColor();

  // SVG circular progress
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(usagePercent, 100) / 100) * circumference;
  const isOverflow = usagePercent > 100;

  // Format percentage for display (handle large numbers)
  const formatPercent = (percent: number) => {
    if (percent >= 1000) return `${(percent / 100).toFixed(0)}x`;
    return `${percent.toFixed(0)}%`;
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      {/* Main content */}
      <div className="p-4">
        {/* Header with circular gauge */}
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative flex size-16 items-center justify-center">
            <svg className="size-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className={
                  isOverflow ? 'text-red-100 dark:text-red-950' : 'text-muted'
                }
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn('transition-all duration-500', statusColor.ring)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  'leading-none font-bold',
                  statusColor.text,
                  usagePercent >= 100 ? 'text-sm' : 'text-lg'
                )}
              >
                {formatPercent(usagePercent)}
              </span>
              {isOverflow && (
                <span className="text-[9px] font-medium text-red-500">
                  OVER
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{t('title')}</h3>
              {allowOverride !== undefined && (
                <Badge
                  variant="outline"
                  className={cn(
                    'px-1.5 py-0 text-[10px]',
                    allowOverride
                      ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  <Shield className="mr-0.5 size-2.5" />
                  {allowOverride ? t('overrideEnabled') : t('overrideDisabled')}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {formatTons(totalBookedTons)} / {formatTons(limitTons)} {t('mt')}{' '}
              used
            </p>
            {/* Linear progress bar */}
            <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  statusColor.bg
                )}
                style={{width: `${Math.min(usagePercent, 100)}%`}}
              />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {/* Daily Limit */}
          <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/30">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Gauge className="size-3.5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {t('limit')}
              </span>
            </div>
            <p className="mt-1 text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatTons(limitTons)}
              <span className="ml-0.5 text-xs font-normal">{t('mt')}</span>
            </p>
            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
              {(capacity?.daily_limit_boxes || 0).toLocaleString()} {t('boxes')}
            </p>
          </div>

          {/* Booked */}
          <div className="rounded-lg bg-orange-50 p-2.5 dark:bg-orange-950/30">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <TrendingUp className="size-3.5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {t('booked')}
              </span>
            </div>
            <p className="mt-1 text-lg font-bold text-orange-700 dark:text-orange-300">
              {formatTons(Number(capacity?.booked_tons || 0))}
              <span className="ml-0.5 text-xs font-normal">{t('mt')}</span>
            </p>
            <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">
              {bookedBoxes.toLocaleString()} {t('boxes')}
            </p>
          </div>

          {/* Received */}
          <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-3.5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {t('received')}
              </span>
            </div>
            <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {formatTons(Number(capacity?.received_tons || 0))}
              <span className="ml-0.5 text-xs font-normal">{t('mt')}</span>
            </p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
              {receivedBoxes.toLocaleString()} {t('boxes')}
            </p>
          </div>

          {/* Remaining */}
          <div
            className={cn(
              'rounded-lg p-2.5',
              isDanger
                ? 'bg-red-50 dark:bg-red-950/30'
                : isWarning
                  ? 'bg-amber-50 dark:bg-amber-950/30'
                  : 'bg-slate-50 dark:bg-slate-950/30'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-1',
                isDanger
                  ? 'text-red-600 dark:text-red-400'
                  : isWarning
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
              )}
            >
              <TrendingDown className="size-3.5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {t('remaining')}
              </span>
            </div>
            <p
              className={cn(
                'mt-1 text-lg font-bold',
                isDanger
                  ? 'text-red-700 dark:text-red-300'
                  : isWarning
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {isDanger && remainingTons <= 0 ? '-' : ''}
              {formatTons(Math.abs(remainingTons))}
              <span className="ml-0.5 text-xs font-normal">{t('mt')}</span>
            </p>
            <p
              className={cn(
                'text-[10px]',
                isDanger
                  ? 'text-red-600/70 dark:text-red-400/70'
                  : isWarning
                    ? 'text-amber-600/70 dark:text-amber-400/70'
                    : 'text-slate-600/70 dark:text-slate-400/70'
              )}
            >
              {isDanger && remainingBoxes <= 0 ? '-' : ''}
              {Math.abs(remainingBoxes).toLocaleString()} {t('boxes')}
            </p>
          </div>
        </div>
      </div>

      {/* Warning/Danger Alert */}
      {(isDanger || isWarning) && (
        <div
          className={cn(
            'flex items-center gap-2 border-t px-4 py-2.5',
            isDanger
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
              : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
          )}
        >
          <AlertTriangle
            className={cn(
              'size-4 shrink-0',
              isDanger
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'
            )}
          />
          <div>
            <p
              className={cn(
                'text-xs font-medium',
                isDanger
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-amber-700 dark:text-amber-300'
              )}
            >
              {isDanger ? t('exceeded') : t('approaching')}
            </p>
            <p
              className={cn(
                'text-[10px]',
                isDanger
                  ? 'text-red-600/80 dark:text-red-400/80'
                  : 'text-amber-600/80 dark:text-amber-400/80'
              )}
            >
              {isDanger
                ? t('exceededDescription')
                : t('approachingDescription', {count: remainingBoxes})}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
