'use client';

import * as React from 'react';
import {Card} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {useTranslations} from 'next-intl';
import type {DailyStats} from '@/types/vehicle-booking';
import {format} from 'date-fns';
import {ar} from 'date-fns/locale';

interface DailyStatsListProps {
  dailyStats: DailyStats[];
  locale?: string;
  onDayClick?: (date: string) => void;
}

export function DailyStatsList({
  dailyStats,
  locale = 'en',
  onDayClick,
}: DailyStatsListProps) {
  const t = useTranslations('vehicleBookings.rangeStats');

  if (!dailyStats || dailyStats.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground text-sm">{t('noDailyStats')}</p>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d, yyyy', {
      locale: locale === 'ar' ? ar : undefined,
    });
  };

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return t('noData');
    if (hours < 1) {
      return `${Math.round(hours * 60)} ${t('mins')}`;
    }
    return `${hours.toFixed(1)} ${t('hrs')}`;
  };

  const getCapacityVariant = (
    percent: number
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (percent >= 100) return 'destructive';
    if (percent >= 80) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-semibold">{t('dailyBreakdown')}</h3>
      <div className="max-h-[500px] space-y-2 overflow-y-auto">
        {dailyStats.map((day) => (
          <Card
            key={day.date}
            className="hover:bg-accent cursor-pointer p-2.5 transition-colors"
            onClick={() => onDayClick?.(day.date)}
          >
            {/* Date Header */}
            <div className="mb-1.5 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs leading-tight font-medium">
                  {formatDate(day.date)}
                </h4>
                <p className="text-muted-foreground text-[10px]">
                  {day.booking_count} {t('bookings')}
                </p>
              </div>
              <Badge
                variant={getCapacityVariant(day.capacity_percent)}
                className="h-5 shrink-0 px-1.5 text-[10px]"
              >
                {Math.round(day.capacity_percent)}%
              </Badge>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-[10px]">
              {/* Wait Time */}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{t('wait')}:</span>
                <span className="font-medium">
                  {formatHours(day.avg_wait_hours)}
                </span>
              </div>

              {/* Status Breakdown */}
              <div className="ml-auto flex items-center gap-2">
                {day.status_breakdown.exited > 0 && (
                  <span className="text-green-600" title="Exited">
                    ✓ {day.status_breakdown.exited}
                  </span>
                )}
                {day.status_breakdown.offloaded > 0 && (
                  <span className="text-emerald-600" title="Offloaded">
                    ⚙️ {day.status_breakdown.offloaded}
                  </span>
                )}
                {day.status_breakdown.offloading > 0 && (
                  <span className="text-orange-600" title="Offloading">
                    🚛 {day.status_breakdown.offloading}
                  </span>
                )}
                {day.status_breakdown.received > 0 && (
                  <span className="text-blue-600" title="Received">
                    → {day.status_breakdown.received}
                  </span>
                )}
                {day.status_breakdown.booked > 0 && (
                  <span className="text-amber-600" title="Booked">
                    ⊙ {day.status_breakdown.booked}
                  </span>
                )}
                {day.status_breakdown.rejected > 0 && (
                  <span className="text-red-600" title="Rejected">
                    ✗ {day.status_breakdown.rejected}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
