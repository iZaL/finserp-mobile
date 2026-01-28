import {useMemo} from 'react';
import type {VehicleBooking, BookingFilters} from '@/types/vehicle-booking';
import {
  BOOKING_STATUS_PRIORITY,
  FACTORY_STATUS_PRIORITY,
  FACTORY_STATUSES,
} from '@/lib/constants/vehicle-booking';

export interface StatusCounts {
  pending: number;
  booked: number;
  received: number;
  exited: number;
  rejected: number;
}

interface UseVehicleBookingFiltersProps {
  bookings: VehicleBooking[];
  statusFilter: BookingFilters['status'];
  searchQuery: string;
}

interface UseVehicleBookingFiltersResult {
  filteredBookings: VehicleBooking[];
  vehiclesInsideFactory: VehicleBooking[];
  statusCounts: StatusCounts;
}

// Search filter function - single source of truth
function matchesSearchQuery(
  booking: VehicleBooking,
  searchQuery: string
): boolean {
  if (!searchQuery.trim()) return true;

  const query = searchQuery.toLowerCase();
  return (
    booking.vehicle_number.toLowerCase().includes(query) ||
    (booking.driver_name?.toLowerCase() || '').includes(query) ||
    (booking.driver_phone?.toLowerCase() || '').includes(query) ||
    (booking.supplier_name?.toLowerCase() || '').includes(query) ||
    (booking.supplier_phone?.toLowerCase() || '').includes(query)
  );
}

// Check if booking passes status filter
function matchesStatusFilter(
  booking: VehicleBooking,
  statusFilter: BookingFilters['status']
): boolean {
  if (statusFilter === 'all') return true;

  switch (statusFilter) {
    case 'pending':
      return booking.is_pending_approval;
    case 'booked':
      return (
        booking.status === 'booked' &&
        !booking.is_pending_approval &&
        booking.approval_status !== 'rejected'
      );
    case 'rejected':
      return (
        booking.status === 'rejected' || booking.approval_status === 'rejected'
      );
    case 'exited':
      // Show both offloaded and exited vehicles in the exited tab
      return booking.status === 'exited' || booking.status === 'offloaded';
    default:
      return booking.status === statusFilter;
  }
}

// Check if booking is inside factory
function isInsideFactory(booking: VehicleBooking): boolean {
  return FACTORY_STATUSES.includes(
    booking.status as (typeof FACTORY_STATUSES)[number]
  );
}

// Get timestamp for factory vehicle sorting
function getFactoryTimestamp(booking: VehicleBooking): string {
  if (booking.status === 'offloading' && booking.offloading_started_at) {
    return booking.offloading_started_at;
  }
  if (booking.status === 'offloaded' && booking.offloading_completed_at) {
    return booking.offloading_completed_at;
  }
  return booking.received_at || booking.created_at;
}

// Sort vehicles inside factory
function sortFactoryVehicles(bookings: VehicleBooking[]): VehicleBooking[] {
  return [...bookings].sort((a, b) => {
    const priorityA = FACTORY_STATUS_PRIORITY[a.status as keyof typeof FACTORY_STATUS_PRIORITY] ?? 99;
    const priorityB = FACTORY_STATUS_PRIORITY[b.status as keyof typeof FACTORY_STATUS_PRIORITY] ?? 99;

    // First sort by status priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Within same status, sort by relevant timestamp (oldest first - FIFO)
    const dateA = new Date(getFactoryTimestamp(a)).getTime();
    const dateB = new Date(getFactoryTimestamp(b)).getTime();
    return dateA - dateB;
  });
}

// Get booking priority for main list sorting
function getBookingPriority(booking: VehicleBooking): number {
  if (booking.approval_status === 'rejected') {
    return BOOKING_STATUS_PRIORITY.rejected;
  }
  return BOOKING_STATUS_PRIORITY[booking.status as keyof typeof BOOKING_STATUS_PRIORITY] ?? 99;
}

// Get date for status-specific sorting
function getDateForStatus(booking: VehicleBooking): string {
  if (booking.status === 'exited' && booking.exited_at) {
    return booking.exited_at;
  }
  if (booking.status === 'rejected' && booking.rejected_at) {
    return booking.rejected_at;
  }
  if (booking.approval_status === 'rejected' && booking.approved_at) {
    return booking.approved_at;
  }
  if (booking.status === 'booked' && booking.approved_at) {
    return booking.approved_at;
  }
  return booking.entry_datetime || booking.created_at;
}

// Sort filtered bookings
function sortFilteredBookings(
  bookings: VehicleBooking[],
  statusFilter: BookingFilters['status']
): VehicleBooking[] {
  return [...bookings].sort((a, b) => {
    // For exited tab, prioritize bookings without fish purchases (bills)
    if (statusFilter === 'exited') {
      const aHasBill = !!a.fish_purchase_id;
      const bHasBill = !!b.fish_purchase_id;

      // Bookings without bills come first
      if (!aHasBill && bHasBill) return -1;
      if (aHasBill && !bHasBill) return 1;

      // Within same group, sort by offloading completion date (most recent first)
      const dateA = new Date(
        a.offloading_completed_at || a.exited_at || a.created_at
      ).getTime();
      const dateB = new Date(
        b.offloading_completed_at || b.exited_at || b.created_at
      ).getTime();
      return dateB - dateA;
    }

    const priorityA = getBookingPriority(a);
    const priorityB = getBookingPriority(b);

    // First sort by status priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Within same priority group, sort by state-specific date
    const dateA = new Date(getDateForStatus(a)).getTime();
    const dateB = new Date(getDateForStatus(b)).getTime();

    // For exited status, sort by most recent first (descending)
    if (a.status === 'exited' && b.status === 'exited') {
      return dateB - dateA;
    }

    // For booked, pending, and rejected: sort oldest first (ascending) - FIFO
    return dateA - dateB;
  });
}

export function useVehicleBookingFilters({
  bookings,
  statusFilter,
  searchQuery,
}: UseVehicleBookingFiltersProps): UseVehicleBookingFiltersResult {
  // Memoized filtered bookings
  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter((booking) => {
      // Apply status filter
      if (!matchesStatusFilter(booking, statusFilter)) return false;

      // Exclude factory vehicles from main list (shown separately)
      // But allow offloaded vehicles when exited filter is active
      if (statusFilter === 'exited') {
        if (booking.status === 'received' || booking.status === 'offloading') {
          return false;
        }
      } else {
        if (isInsideFactory(booking)) return false;
      }

      // Apply search filter
      return matchesSearchQuery(booking, searchQuery);
    });

    return sortFilteredBookings(filtered, statusFilter);
  }, [bookings, statusFilter, searchQuery]);

  // Memoized vehicles inside factory
  const vehiclesInsideFactory = useMemo(() => {
    const factoryVehicles = bookings.filter((booking) => {
      if (!isInsideFactory(booking)) return false;
      return matchesSearchQuery(booking, searchQuery);
    });

    return sortFactoryVehicles(factoryVehicles);
  }, [bookings, searchQuery]);

  // Memoized status counts
  const statusCounts = useMemo<StatusCounts>(() => {
    return {
      // Bookings waiting for approval
      pending: bookings.filter((b) => b.is_pending_approval).length,

      // Bookings that are approved and waiting to be received
      booked: bookings.filter(
        (b) =>
          b.status === 'booked' &&
          !b.is_pending_approval &&
          b.approval_status !== 'rejected'
      ).length,

      // Bookings currently in factory (received + offloading + offloaded)
      received: bookings.filter((b) => isInsideFactory(b)).length,

      // Bookings that finished offloading and exited
      exited: bookings.filter(
        (b) => b.status === 'exited' || b.status === 'offloaded'
      ).length,

      // Bookings rejected at gate OR rejected at approval stage
      rejected: bookings.filter(
        (b) => b.status === 'rejected' || b.approval_status === 'rejected'
      ).length,
    };
  }, [bookings]);

  return {
    filteredBookings,
    vehiclesInsideFactory,
    statusCounts,
  };
}
