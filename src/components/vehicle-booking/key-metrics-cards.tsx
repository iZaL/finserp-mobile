'use client';

import * as React from 'react';
import {Card} from '@/components/ui/card';
import {Truck, Weight} from 'lucide-react';
import {useTranslations} from 'next-intl';
import type {RangeStats} from '@/types/vehicle-booking';

interface KeyMetricsCardsProps {
  stats: RangeStats | undefined;
  isLoading?: boolean;
}

export function KeyMetricsCards({stats, isLoading}: KeyMetricsCardsProps) {
  const t = useTranslations('vehicleBookings.rangeStats');

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted h-28 animate-pulse rounded-lg" />
        <div className="bg-muted h-28 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Vehicles Offloaded */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-950 dark:to-blue-900">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Truck className="size-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {stats.completed_vehicles.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {t('vehiclesOffloaded')}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400">
            {t('outOf')} {stats.total_vehicles.toLocaleString()}{' '}
            {t('totalVehicles')}
          </p>
        </div>
      </Card>

      {/* Total Tons */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 dark:border-emerald-800 dark:from-emerald-950 dark:to-emerald-900">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Weight className="size-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            {stats.total_tons.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </p>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {t('tonsProcessed')}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
            {t('totalBoxes', {count: stats.total_boxes})}
          </p>
        </div>
      </Card>
    </div>
  );
}
