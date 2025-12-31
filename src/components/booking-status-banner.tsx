'use client';

import {useTranslations} from 'next-intl';
import {AlertCircle} from 'lucide-react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {cn} from '@/lib/utils';

interface BookingStatusBannerProps {
  isEnabled: boolean;
  className?: string;
}

/**
 * Booking Status Banner Component
 * Displays a prominent banner when vehicle bookings are closed
 * Shows green success banner when bookings are open (optional display)
 */
export function BookingStatusBanner({
  isEnabled,
  className,
}: BookingStatusBannerProps) {
  const t = useTranslations();

  // Only show banner when bookings are closed
  if (isEnabled) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className={cn(
        'animate-in slide-in-from-top-2 border-2',
        'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
        'border-red-200 dark:border-red-800',
        'py-3', // Reduced padding
        className
      )}
    >
      <AlertCircle className="h-4 w-4 !text-red-600 dark:!text-red-400" />
      <AlertTitle className="mb-1 text-sm font-semibold !text-red-900 dark:!text-red-100">
        {t('bookingStatus.closed')}
      </AlertTitle>
      <AlertDescription className="text-xs !text-red-800 dark:!text-red-200">
        {t('bookingStatus.closedDescription')}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact version for smaller spaces
 */
export function CompactBookingStatusBanner({
  isEnabled,
  className,
}: BookingStatusBannerProps) {
  const t = useTranslations();

  if (isEnabled) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-800 dark:bg-red-950/20',
        'animate-in slide-in-from-top-2',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
      <div className="flex-1">
        <p className="font-semibold text-red-900 dark:text-red-100">
          {t('bookingStatus.closed')}
        </p>
        <p className="text-xs text-red-800 opacity-90 dark:text-red-200">
          {t('bookingStatus.closedDescription')}
        </p>
      </div>
    </div>
  );
}
