import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import { vehicleBookingKeys } from "@/lib/query-keys"
import type {
  VehicleBooking,
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
} from "@/types/vehicle-booking"
import { toast } from "sonner"

/**
 * Hook to fetch paginated vehicle bookings with filters
 *
 * No caching - always fetches fresh data from backend
 */
export function useVehicleBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: vehicleBookingKeys.list(filters),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getBookings(filters, { signal })
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  })
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
      if (!id) throw new Error("Vehicle booking ID is required")
      return vehicleBookingService.getBooking(id)
    },
    enabled: !!id,
    staleTime: 0, // Always consider data stale - refetch on every query
  })
}

/**
 * Hook to fetch booking activities (edit history)
 *
 * No caching - always fetches fresh data from backend
 */
export function useBookingActivities(id: number | null) {
  return useQuery({
    queryKey: vehicleBookingKeys.activities(id!),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Vehicle booking ID is required")
      return vehicleBookingService.getBookingActivities(id, { signal })
    },
    enabled: !!id,
    staleTime: 0, // Always consider data stale - refetch on every query
  })
}

/**
 * Hook to fetch daily booking statistics
 *
 * No caching - always fetches fresh data from backend
 */
export function useBookingStats(date?: string) {
  return useQuery({
    queryKey: vehicleBookingKeys.stats(date),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getStats(date, { signal })
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  })
}

/**
 * Hook to fetch range statistics
 *
 * No caching - always fetches fresh data from backend
 */
export function useRangeStats(dateFrom: string, dateTo: string, enabled = true) {
  return useQuery({
    queryKey: vehicleBookingKeys.rangeStats(dateFrom, dateTo),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getRangeStats(dateFrom, dateTo, { signal })
    },
    enabled,
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to fetch daily capacity info
 *
 * No caching - always fetches fresh data from backend
 */
export function useDailyCapacity(date?: string) {
  return useQuery({
    queryKey: vehicleBookingKeys.dailyCapacity(date),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getDailyCapacity(date, { signal })
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  })
}

/**
 * Hook to fetch vehicle booking settings
 *
 * No caching - always fetches fresh data from backend
 */
export function useVehicleBookingSettings() {
  return useQuery({
    queryKey: vehicleBookingKeys.settings(),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getSettings({ signal })
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  })
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
      return vehicleBookingService.getSuggestions(query)
    },
    enabled: enabled && query.length > 0,
    staleTime: 0, // Always consider data stale - refetch on every query
  })
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
      return vehicleBookingService.getQuickPicks()
    },
    staleTime: 0, // Always consider data stale - refetch on every query
  })
}

/**
 * Hook to fetch bills gallery
 *
 * No caching - always fetches fresh data from backend
 */
export function useBillsGallery(
  filters?: {
    search?: string
    page?: number
    file_type?: "all" | "images" | "pdfs"
    status?: string
    date_from?: string
    date_to?: string
    entry_date_from?: string
    entry_date_to?: string
  }
) {
  return useQuery({
    queryKey: vehicleBookingKeys.billsGallery(filters),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getBillsGallery(filters, { signal })
    },
    staleTime: 0, // Always consider data stale - refetch on every query
    placeholderData: keepPreviousData,
  })
}

/**
 * Combined hook to fetch all required data for vehicle booking dashboard
 * Fetches data in parallel for optimal performance
 */
export function useVehicleBookingDashboard(filters?: BookingFilters) {
  const bookingsQuery = useVehicleBookings(filters)
  const capacityQuery = useDailyCapacity()
  const settingsQuery = useVehicleBookingSettings()

  return {
    bookings: bookingsQuery.data?.data || [],
    bookingsMeta: bookingsQuery.data,
    capacity: capacityQuery.data,
    settings: settingsQuery.data,
    isLoading: bookingsQuery.isLoading || capacityQuery.isLoading || settingsQuery.isLoading,
    isError: bookingsQuery.isError || capacityQuery.isError || settingsQuery.isError,
    error: bookingsQuery.error || capacityQuery.error || settingsQuery.error,
    refetch: () => {
      bookingsQuery.refetch()
      capacityQuery.refetch()
      settingsQuery.refetch()
    },
  }
}

/**
 * Hook to create a new vehicle booking
 * Refetches all data from API after mutation
 */
export function useCreateVehicleBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const result = await vehicleBookingService.createBooking(data)
      // Refetch immediately after API success, before onSuccess callbacks
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle booking created successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create vehicle booking")
    },
  })
}

/**
 * Hook to update a vehicle booking
 */
export function useUpdateVehicleBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBookingRequest }) => {
      const result = await vehicleBookingService.updateBooking(id, data)
      await Promise.all([
        queryClient.refetchQueries({ queryKey: vehicleBookingKeys.lists() }),
        queryClient.refetchQueries({ queryKey: vehicleBookingKeys.activities(id) })
      ])
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle booking updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update vehicle booking")
    },
  })
}

/**
 * Hook to delete a vehicle booking
 */
export function useDeleteVehicleBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await vehicleBookingService.deleteBooking(id)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle booking deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete vehicle booking")
    },
  })
}

/**
 * Hook to receive a vehicle
 * Uses targeted cache invalidation for better performance
 */
export function useReceiveVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReceiveBookingRequest }) => {
      const result = await vehicleBookingService.receiveVehicle(id, data)
      // Refetch immediately after API success, before onSuccess callbacks
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle received successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to receive vehicle")
    },
  })
}

/**
 * Hook to reject a vehicle
 * Refetches all data from API after mutation
 */
export function useRejectVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RejectBookingRequest }) => {
      const result = await vehicleBookingService.rejectVehicle(id, data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle rejected successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject vehicle")
    },
  })
}

/**
 * Hook to exit a vehicle
 * Uses targeted cache invalidation for better performance
 */
export function useExitVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await vehicleBookingService.exitVehicle(id)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle exited successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to exit vehicle")
    },
  })
}

/**
 * Hook to unreceive a vehicle (undo receive)
 * Uses immediate refetch for instant UI updates
 */
export function useUnreceiveVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const result = await vehicleBookingService.unreceiveVehicle(id)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle unreceived successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unreceive vehicle")
    },
  })
}

/**
 * Hook to start offloading
 * Refetches list immediately for instant UI update
 */
export function useStartOffloading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: StartOffloadingRequest }) => {
      const result = await vehicleBookingService.startOffloading(id, data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Offloading started successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start offloading")
    },
  })
}

/**
 * Hook to complete offloading
 * Refetches all data from API after mutation
 */
export function useCompleteOffloading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CompleteOffloadingRequest }) => {
      const result = await vehicleBookingService.completeOffloading(id, data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Offloading completed successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete offloading")
    },
  })
}

/**
 * Hook to approve vehicle booking
 * Refetches list immediately for instant UI update
 */
export function useApproveVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ApproveBookingRequest }) => {
      const result = await vehicleBookingService.approveVehicle(id, data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Vehicle approved successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve vehicle")
    },
  })
}

/**
 * Hook to reject vehicle booking approval
 * Refetches all data from API after mutation
 */
export function useRejectApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RejectApprovalRequest }) => {
      const result = await vehicleBookingService.rejectApproval(id, data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Approval rejected successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject approval")
    },
  })
}

/**
 * Hook for bulk actions
 */
export function useBulkAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkActionRequest) => {
      const result = await vehicleBookingService.bulkAction(data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.all, type: 'active' })
      return result
    },
    onSuccess: () => {
      toast.success("Bulk action completed successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to perform bulk action")
    },
  })
}
/**
 * Hook to update daily limit
 */
export function useUpdateDailyLimit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ date, limit }: { date: string; limit: number }) => {
      const result = await vehicleBookingService.updateDailyLimit(date, limit)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.dailyCapacity() })
      return result
    },
    onSuccess: () => {
      toast.success("Daily limit updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update daily limit")
    },
  })
}

/**
 * Hook to update control settings
 */
export function useUpdateControlSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateControlSettingsRequest) => {
      const result = await vehicleBookingService.updateControlSettings(data)
      await queryClient.refetchQueries({ queryKey: vehicleBookingKeys.settings() })
      return result
    },
    onSuccess: () => {
      toast.success("Settings updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update settings")
    },
  })
}

/**
 * Hook to upload media attachment
 */
export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ vehicleId, file }: { vehicleId: number; file: File }) => {
      const result = await vehicleBookingService.uploadMedia(vehicleId, file)
      await Promise.all([
        queryClient.refetchQueries({ queryKey: vehicleBookingKeys.lists() }),
        queryClient.refetchQueries({ queryKey: vehicleBookingKeys.billsGallery() })
      ])
      return result
    },
    onSuccess: () => {
      toast.success("Media uploaded successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload media")
    },
  })
}

/**
 * Hook to delete media attachment
 */
export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mediaId: number) => {
      const result = await vehicleBookingService.deleteMedia(mediaId)
      await Promise.all([
        queryClient.refetchQueries({ queryKey: vehicleBookingKeys.lists() }),
        queryClient.refetchQueries({ queryKey: vehicleBookingKeys.billsGallery() })
      ])
      return result
    },
    onSuccess: () => {
      toast.success("Media deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete media")
    },
  })
}
