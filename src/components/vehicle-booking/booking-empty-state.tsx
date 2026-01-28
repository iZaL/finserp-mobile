import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {Truck, Plus} from 'lucide-react';
import type {BookingFilters} from '@/types/vehicle-booking';

interface BookingEmptyStateProps {
  statusFilter: BookingFilters['status'];
  searchQuery: string;
  hasBookings: boolean;
  canCreate: boolean;
  onCreateBooking: () => void;
}

type EmptyStateConfig = {
  titleKey: string;
  descriptionKey: string;
  showCreate?: boolean;
};

const EMPTY_STATE_CONFIG: Record<string, EmptyStateConfig> = {
  search: {
    titleKey: 'noResultsFound',
    descriptionKey: 'noResultsDescription',
  },
  noBookings: {
    titleKey: 'noBookingsFound',
    descriptionKey: 'noBookingsDescription',
    showCreate: true,
  },
  pending: {
    titleKey: 'noPendingApprovals',
    descriptionKey: 'noPendingApprovalsDescription',
  },
  booked: {
    titleKey: 'noBookedVehicles',
    descriptionKey: 'noBookedVehiclesDescription',
  },
  received: {
    titleKey: 'noVehiclesInFactory',
    descriptionKey: 'noVehiclesInFactoryDescription',
  },
  exited: {
    titleKey: 'noExitedVehicles',
    descriptionKey: 'noExitedVehiclesDescription',
  },
  rejected: {
    titleKey: 'noRejectedBookings',
    descriptionKey: 'noRejectedBookingsDescription',
  },
  default: {
    titleKey: 'noResultsFound',
    descriptionKey: 'noResultsDescription',
  },
};

function getEmptyStateConfig(
  statusFilter: BookingFilters['status'],
  searchQuery: string,
  hasBookings: boolean
): EmptyStateConfig {
  // Search results empty
  if (searchQuery) {
    return EMPTY_STATE_CONFIG.search;
  }

  // No bookings at all
  if (!hasBookings) {
    return EMPTY_STATE_CONFIG.noBookings;
  }

  // Status-specific empty states
  if (statusFilter && statusFilter in EMPTY_STATE_CONFIG) {
    return EMPTY_STATE_CONFIG[statusFilter];
  }

  return EMPTY_STATE_CONFIG.default;
}

export function BookingEmptyState({
  statusFilter,
  searchQuery,
  hasBookings,
  canCreate,
  onCreateBooking,
}: BookingEmptyStateProps) {
  const t = useTranslations('vehicleBookings');
  const config = getEmptyStateConfig(statusFilter, searchQuery, hasBookings);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center shadow-sm dark:from-slate-900/50 dark:to-slate-800/50">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-700/50">
        <Truck className="size-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t(config.titleKey)}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t(config.descriptionKey)}
      </p>
      {config.showCreate && canCreate && (
        <Button
          onClick={onCreateBooking}
          className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="mr-2 size-4" />
          {t('createBooking')}
        </Button>
      )}
    </div>
  );
}
