import type {BookingFilters} from '@/types/vehicle-booking';

// Status priorities for sorting bookings list
export const BOOKING_STATUS_PRIORITY = {
  booked: 1, // Highest priority - ready for reception (actionable)
  pending: 2, // Second priority - awaiting approval
  exited: 3, // Third priority - completed vehicles
  rejected: 4, // Lowest priority - rejected vehicles
} as const;

// Status priorities for sorting vehicles inside factory
export const FACTORY_STATUS_PRIORITY = {
  offloading: 1, // Highest priority - actively being processed
  received: 2, // Second priority - waiting to start
  offloaded: 3, // Lowest priority - ready to exit
} as const;

// Factory statuses (vehicles currently inside factory)
export const FACTORY_STATUSES = [
  'received',
  'offloading',
  'offloaded',
] as const;

export type FactoryStatus = (typeof FACTORY_STATUSES)[number];

// Check if a status is a factory status
export function isFactoryStatus(status: string): status is FactoryStatus {
  return FACTORY_STATUSES.includes(status as FactoryStatus);
}

// Status filter tabs configuration
export const STATUS_FILTER_TABS: Array<{
  value: BookingFilters['status'];
  labelKey: string;
}> = [
  {value: 'all', labelKey: 'filters.all'},
  {value: 'pending', labelKey: 'filters.pending'},
  {value: 'booked', labelKey: 'filters.booked'},
  {value: 'received', labelKey: 'filters.received'},
  {value: 'exited', labelKey: 'filters.exited'},
  {value: 'rejected', labelKey: 'filters.rejected'},
];
