import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {vehicleBookingService} from '@/lib/services/vehicle-booking';
import {vehicleBookingKeys} from '@/lib/query-keys';
import type {
  BookingFilters,
  CreateBookingRequest,
  UpdateBookingRequest,
  ReceiveBookingRequest,
  RejectBookingRequest,
  ApproveBookingRequest,
  RejectApprovalRequest,
  StartOffloadingRequest,
  CompleteOffloadingRequest,
  UpdateControlSettingsRequest,
  BulkActionRequest,
} from '@/types/vehicle-booking';
import {toast} from 'sonner';

/**
 * Hook to fetch paginated vehicle bookings with filters
 *
 * No caching - always fetches fresh data from backend
 */
export function useVehicleBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: vehicleBookingKeys.list(filters),
    queryFn: async ({signal}) => {
      return vehicleBookingService.getBookings(filters, {signal});
    },
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData, // Keep showing previous data while refetching
  });
}

/**
 * Hook to fetch single vehicle booking by ID
 *
 * No caching - always fetches fresh data from backend
 */
export function useVehicleBooking(id: number | null) {
  return useQuery({
    queryKey: vehicleBookingKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Vehicle booking ID is required');
      return vehicleBookingService.getBooking(id);
    },
    enabled: !!id,
    staleTime: 0, // Always consider data stale - refetch on every query
  });
}

/**
 * Hook to fetch booking activities (edit history)
 *
 * No caching - always fetches fresh data from backend
 */
export function useBookingActivities(id: number | null) {
  return useQuery({
    queryKey: vehicleBookingKeys.activities(id!),
    queryFn: async ({signal}) => {
      if (!id) throw new Error('Vehicle booking ID is required');
      return vehicleBookingService.getBookingActivities(id, {signal});
    },
    enabled: !!id,
    staleTime: 0, // Always consider data stale - refetch on every query
  });
}

/**
 * Hook to fetch daily booking statistics
 *
 * No caching - always fetches fresh data from backend
 */
export function useBookingStats(date?: string) {
  return useQuery({
    queryKey: vehicleBookingKeys.stats(date),
    queryFn: async ({signal}) => {
      return vehicleBookingService.getStats(date, {signal});
    },
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData, // Keep showing previous data while refetching
  });
}

/**
 * Hook to fetch range statistics
 *
 * No caching - always fetches fresh data from backend
 */
export function useRangeStats(
  dateFrom: string,
  dateTo: string,
  enabled = true
) {
  return useQuery({
    queryKey: vehicleBookingKeys.rangeStats(dateFrom, dateTo),
    queryFn: async ({signal}) => {
      return vehicleBookingService.getRangeStats(dateFrom, dateTo, {signal});
    },
    enabled,
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch daily capacity info
 *
 * No caching - always fetches fresh data from backend
 */
export function useDailyCapacity(date?: string) {
  return useQuery({
    queryKey: vehicleBookingKeys.dailyCapacity(date),
    queryFn: async ({signal}) => {
      return vehicleBookingService.getDailyCapacity(date, {signal});
    },
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData, // Keep showing previous data while refetching
  });
}

/**
 * Hook to fetch vehicle booking settings
 *
 * No caching - always fetches fresh data from backend
 */
export function useVehicleBookingSettings() {
  return useQuery({
    queryKey: vehicleBookingKeys.settings(),
    queryFn: async ({signal}) => {
      return vehicleBookingService.getSettings({signal});
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  });
}

/**
 * Hook to fetch vehicle suggestions/templates
 *
 * No caching - always fetches fresh data from backend
 */
export function useVehicleSuggestions(query: string, enabled = true) {
  return useQuery({
    queryKey: vehicleBookingKeys.suggestions(query),
    queryFn: async () => {
      return vehicleBookingService.getSuggestions(query);
    },
    enabled: enabled && query.length > 0,
    staleTime: 0, // Always consider data stale - refetch on every query
  });
}

/**
 * Hook to fetch quick picks (frequently used vehicles)
 *
 * No caching - always fetches fresh data from backend
 */
export function useQuickPicks() {
  return useQuery({
    queryKey: vehicleBookingKeys.quickPicks(),
    queryFn: async () => {
      return vehicleBookingService.getQuickPicks();
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  });
}

/**
 * Hook to fetch bills gallery
 *
 * No caching - always fetches fresh data from backend
 */
export function useBillsGallery(filters?: {
  search?: string;
  page?: number;
  file_type?: 'all' | 'images' | 'pdfs';
  status?: string;
  date_from?: string;
  date_to?: string;
  entry_date_from?: string;
  entry_date_to?: string;
}) {
  return useQuery({
    queryKey: vehicleBookingKeys.billsGallery(filters),
    queryFn: async ({signal}) => {
      return vehicleBookingService.getBillsGallery(filters, {signal});
    },
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData,
  });
}

/**
 * Combined hook to fetch all required data for vehicle booking dashboard
 * Fetches data in parallel for optimal performance
 */
export function useVehicleBookingDashboard(filters?: BookingFilters) {
  const bookingsQuery = useVehicleBookings(filters);
  const capacityQuery = useDailyCapacity();
  const settingsQuery = useVehicleBookingSettings();

  return {
    bookings: bookingsQuery.data?.data || [],
    bookingsMeta: bookingsQuery.data,
    capacity: capacityQuery.data,
    settings: settingsQuery.data,
    isLoading:
      bookingsQuery.isLoading ||
      capacityQuery.isLoading ||
      settingsQuery.isLoading,
    isError:
      bookingsQuery.isError || capacityQuery.isError || settingsQuery.isError,
    error: bookingsQuery.error || capacityQuery.error || settingsQuery.error,
    refetch: () => {
      bookingsQuery.refetch();
      capacityQuery.refetch();
      settingsQuery.refetch();
    },
  };
}

/**
 * Hook to create a new vehicle booking
 * Invalidates all vehicle booking queries to ensure fresh data on next access
 * Also refetches active queries for immediate updates if page is already mounted
 */
export function useCreateVehicleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      return vehicleBookingService.createBooking(data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle booking created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vehicle booking');
    },
  });
}

/**
 * Hook to update a vehicle booking
 * Invalidates relevant queries and refetches active ones for immediate updates
 */
export function useUpdateVehicleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateBookingRequest;
    }) => {
      return vehicleBookingService.updateBooking(id, data);
    },
    onSuccess: async (_, variables) => {
      // Invalidate list queries and detail queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.lists()});
      queryClient.invalidateQueries({
        queryKey: vehicleBookingKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: vehicleBookingKeys.activities(variables.id),
      });
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.lists(),
        type: 'active',
      });
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.detail(variables.id),
        type: 'active',
      });
      toast.success('Vehicle booking updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vehicle booking');
    },
  });
}

/**
 * Hook to delete a vehicle booking
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useDeleteVehicleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return vehicleBookingService.deleteBooking(id);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle booking deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle booking');
    },
  });
}

/**
 * Hook to receive a vehicle
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useReceiveVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ReceiveBookingRequest;
    }) => {
      return vehicleBookingService.receiveVehicle(id, data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle received successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to receive vehicle');
    },
  });
}

/**
 * Hook to reject a vehicle
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useRejectVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: RejectBookingRequest;
    }) => {
      return vehicleBookingService.rejectVehicle(id, data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle rejected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject vehicle');
    },
  });
}

/**
 * Hook to exit a vehicle
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useExitVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return vehicleBookingService.exitVehicle(id);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle exited successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to exit vehicle');
    },
  });
}

/**
 * Hook to unreceive a vehicle (undo receive)
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useUnreceiveVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return vehicleBookingService.unreceiveVehicle(id);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle unreceived successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unreceive vehicle');
    },
  });
}

/**
 * Hook to start offloading
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useStartOffloading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: StartOffloadingRequest;
    }) => {
      return vehicleBookingService.startOffloading(id, data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Offloading started successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start offloading');
    },
  });
}

/**
 * Hook to complete offloading
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useCompleteOffloading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CompleteOffloadingRequest;
    }) => {
      return vehicleBookingService.completeOffloading(id, data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Offloading completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete offloading');
    },
  });
}

/**
 * Hook to approve vehicle booking
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useApproveVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: ApproveBookingRequest;
    }) => {
      return vehicleBookingService.approveVehicle(id, data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Vehicle approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve vehicle');
    },
  });
}

/**
 * Hook to reject vehicle booking approval
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useRejectApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: RejectApprovalRequest;
    }) => {
      return vehicleBookingService.rejectApproval(id, data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Approval rejected successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject approval');
    },
  });
}

/**
 * Hook for bulk actions
 * Invalidates all vehicle booking queries and refetches active ones for immediate updates
 */
export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkActionRequest) => {
      return vehicleBookingService.bulkAction(data);
    },
    onSuccess: async () => {
      // Invalidate all vehicle booking queries (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.all});
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.all,
        type: 'active',
      });
      toast.success('Bulk action completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to perform bulk action');
    },
  });
}
/**
 * Hook to update daily limit
 */
export function useUpdateDailyLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({date, limit}: {date: string; limit: number}) => {
      return vehicleBookingService.updateDailyLimit(date, limit);
    },
    onSuccess: async () => {
      // Invalidate and refetch daily capacity queries
      queryClient.invalidateQueries({
        queryKey: vehicleBookingKeys.dailyCapacity(),
      });
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.dailyCapacity(),
        type: 'active',
      });
      toast.success('Daily limit updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update daily limit');
    },
  });
}

/**
 * Hook to update control settings
 */
export function useUpdateControlSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateControlSettingsRequest) => {
      return vehicleBookingService.updateControlSettings(data);
    },
    onSuccess: async () => {
      // Invalidate and refetch settings queries
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.settings()});
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.settings(),
        type: 'active',
      });
      toast.success('Settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });
}

/**
 * Hook to upload media attachment
 * Invalidates relevant queries and refetches active ones for immediate updates
 */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({vehicleId, file}: {vehicleId: number; file: File}) => {
      return vehicleBookingService.uploadMedia(vehicleId, file);
    },
    onSuccess: async () => {
      // Invalidate list queries and bills gallery (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.lists()});
      queryClient.invalidateQueries({
        queryKey: vehicleBookingKeys.billsGallery(),
      });
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.lists(),
        type: 'active',
      });
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.billsGallery(),
        type: 'active',
      });
      toast.success('Media uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload media');
    },
  });
}

/**
 * Hook to delete media attachment
 * Invalidates relevant queries and refetches active ones for immediate updates
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: number) => {
      return vehicleBookingService.deleteMedia(mediaId);
    },
    onSuccess: async () => {
      // Invalidate list queries and bills gallery (marks them as stale)
      queryClient.invalidateQueries({queryKey: vehicleBookingKeys.lists()});
      queryClient.invalidateQueries({
        queryKey: vehicleBookingKeys.billsGallery(),
      });
      // Also refetch active queries for immediate updates if page is already mounted
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.lists(),
        type: 'active',
      });
      await queryClient.refetchQueries({
        queryKey: vehicleBookingKeys.billsGallery(),
        type: 'active',
      });
      toast.success('Media deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete media');
    },
  });
}
