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
  BulkActionRequest,
} from "@/types/vehicle-booking"
import { toast } from "sonner"

/**
 * Hook to fetch paginated vehicle bookings with filters
 * Uses placeholderData to keep previous data while fetching for smooth transitions
 *
 * Real-time updates:
 * - Refetches every 30 seconds when tab is active
 * - Stops polling when tab is inactive (saves battery/bandwidth)
 * - Shows cached data immediately, updates in background
 */
export function useVehicleBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: vehicleBookingKeys.list(filters),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getBookings(filters, { signal })
    },
    // Removed placeholderData to allow optimistic updates to show immediately
    // The cache will be updated instantly by mutations, no need to hold old data
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: false, // Stop polling when tab is inactive (save battery)
  })
}

/**
 * Hook to fetch single vehicle booking by ID
 *
 * Real-time updates:
 * - Refetches every 15 seconds when viewing details
 * - Critical for tracking status changes (received, offloading, exited)
 */
export function useVehicleBooking(id: number | null) {
  return useQuery({
    queryKey: vehicleBookingKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error("Vehicle booking ID is required")
      return vehicleBookingService.getBooking(id)
    },
    enabled: !!id,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for real-time status tracking
    refetchIntervalInBackground: false, // Stop when not viewing
  })
}

/**
 * Hook to fetch booking activities (edit history)
 */
export function useBookingActivities(id: number | null) {
  return useQuery({
    queryKey: vehicleBookingKeys.activities(id!),
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Vehicle booking ID is required")
      return vehicleBookingService.getBookingActivities(id, { signal })
    },
    enabled: !!id,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds to see new activities
    refetchIntervalInBackground: false,
  })
}

/**
 * Hook to fetch daily booking statistics
 *
 * Real-time updates for dashboard stats
 */
export function useBookingStats(date?: string) {
  return useQuery({
    queryKey: vehicleBookingKeys.stats(date),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getStats(date, { signal })
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time stats
    refetchIntervalInBackground: false,
  })
}

/**
 * Hook to fetch range statistics
 */
export function useRangeStats(dateFrom: string, dateTo: string, enabled = true) {
  return useQuery({
    queryKey: vehicleBookingKeys.rangeStats(dateFrom, dateTo),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getRangeStats(dateFrom, dateTo, { signal })
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to fetch daily capacity info
 *
 * Real-time capacity tracking - CRITICAL for operations
 */
export function useDailyCapacity(date?: string) {
  return useQuery({
    queryKey: vehicleBookingKeys.dailyCapacity(date),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getDailyCapacity(date, { signal })
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds - capacity is critical
    refetchIntervalInBackground: false,
  })
}

/**
 * Hook to fetch vehicle booking settings
 *
 * Settings change rarely, so we use longer staleTime
 */
export function useVehicleBookingSettings() {
  return useQuery({
    queryKey: vehicleBookingKeys.settings(),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getSettings({ signal })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
    // No polling for settings - only refetch on mount/focus
  })
}

/**
 * Hook to fetch vehicle suggestions/templates
 */
export function useVehicleSuggestions(query: string, enabled = true) {
  return useQuery({
    queryKey: vehicleBookingKeys.suggestions(query),
    queryFn: async () => {
      return vehicleBookingService.getSuggestions(query)
    },
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch quick picks (frequently used vehicles)
 */
export function useQuickPicks() {
  return useQuery({
    queryKey: vehicleBookingKeys.quickPicks(),
    queryFn: async () => {
      return vehicleBookingService.getQuickPicks()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch bills gallery
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
    staleTime: 2 * 60 * 1000, // 2 minutes
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
 */
export function useCreateVehicleBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      return vehicleBookingService.createBooking(data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch bookings list
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.lists() })
      // Invalidate capacity and stats
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.dailyCapacity() })
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.stats() })
      // Add the new booking to cache
      queryClient.setQueryData(vehicleBookingKeys.detail(data.id), data)
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
      return vehicleBookingService.updateBooking(id, data)
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: vehicleBookingKeys.detail(id) })

      // Snapshot previous value
      const previousBooking = queryClient.getQueryData<VehicleBooking>(
        vehicleBookingKeys.detail(id)
      )

      // Optimistically update
      if (previousBooking) {
        queryClient.setQueryData<VehicleBooking>(vehicleBookingKeys.detail(id), {
          ...previousBooking,
          ...data,
        })
      }

      return { previousBooking }
    },
    onSuccess: (data, variables) => {
      // Update cache with server response
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.lists() })
      // Invalidate activities
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.activities(variables.id) })
      toast.success("Vehicle booking updated successfully")
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousBooking) {
        queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), context.previousBooking)
      }
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
      return vehicleBookingService.deleteBooking(id)
    },
    onSuccess: () => {
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.all })
      toast.success("Vehicle booking deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete vehicle booking")
    },
  })
}

/**
 * Hook to receive a vehicle
 * Uses immediate refetch for instant UI updates
 */
export function useReceiveVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReceiveBookingRequest }) => {
      return vehicleBookingService.receiveVehicle(id, data)
    },
    onSuccess: async (data, variables) => {
      // Update with real server data
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)

      // Immediately refetch all active queries to show updated data instantly
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.dailyCapacity(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

      toast.success("Vehicle received successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to receive vehicle")
    },
  })
}

/**
 * Hook to reject a vehicle
 * Uses immediate refetch for instant UI updates
 */
export function useRejectVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RejectBookingRequest }) => {
      return vehicleBookingService.rejectVehicle(id, data)
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.dailyCapacity(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

      toast.success("Vehicle rejected successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject vehicle")
    },
  })
}

/**
 * Hook to exit a vehicle
 * Uses immediate refetch for instant UI updates
 */
export function useExitVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      return vehicleBookingService.exitVehicle(id)
    },
    onSuccess: async (data, id) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.dailyCapacity(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

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
      return vehicleBookingService.unreceiveVehicle(id)
    },
    onSuccess: async (data, id) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.dailyCapacity(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

      toast.success("Vehicle unreceived successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unreceive vehicle")
    },
  })
}

/**
 * Hook to start offloading
 */
export function useStartOffloading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: StartOffloadingRequest }) => {
      return vehicleBookingService.startOffloading(id, data)
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

      toast.success("Offloading started successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start offloading")
    },
  })
}

/**
 * Hook to complete offloading
 */
export function useCompleteOffloading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CompleteOffloadingRequest }) => {
      return vehicleBookingService.completeOffloading(id, data)
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

      toast.success("Offloading completed successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete offloading")
    },
  })
}

/**
 * Hook to approve vehicle booking
 */
export function useApproveVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ApproveBookingRequest }) => {
      return vehicleBookingService.approveVehicle(id, data)
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.dailyCapacity(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

      toast.success("Vehicle approved successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve vehicle")
    },
  })
}

/**
 * Hook to reject vehicle booking approval
 */
export function useRejectApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RejectApprovalRequest }) => {
      return vehicleBookingService.rejectApproval(id, data)
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.id), data)

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.lists(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.dailyCapacity(),
          type: 'active'
        }),
        queryClient.refetchQueries({
          queryKey: vehicleBookingKeys.stats(),
          type: 'active'
        })
      ])

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
      return vehicleBookingService.bulkAction(data)
    },
    onSuccess: () => {
      // Invalidate all related queries after bulk action
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.dailyCapacity() })
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.stats() })
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
      return vehicleBookingService.updateDailyLimit(date, limit)
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.dailyCapacity(variables.date), data)
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.dailyCapacity() })
      toast.success("Daily limit updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update daily limit")
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
      return vehicleBookingService.uploadMedia(vehicleId, file)
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(variables.vehicleId), data)
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.billsGallery() })
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
      return vehicleBookingService.deleteMedia(mediaId)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(vehicleBookingKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vehicleBookingKeys.billsGallery() })
      toast.success("Media deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete media")
    },
  })
}
