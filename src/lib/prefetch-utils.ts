import { QueryClient } from "@tanstack/react-query"
import { vehicleBookingKeys, fishPurchaseKeys } from "@/lib/query-keys"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import { fishPurchaseService } from "@/lib/services/fish-purchase"

/**
 * Prefetch utilities for warming up React Query cache
 * Use these to proactively load data that users are likely to need next
 */

/**
 * Prefetch vehicle booking dashboard data
 * Call this when user is likely to navigate to vehicle bookings page
 * (e.g., from home page, or when hovering over the link)
 */
export async function prefetchVehicleBookingDashboard(queryClient: QueryClient) {
  await Promise.all([
    // Prefetch bookings list
    queryClient.prefetchQuery({
      queryKey: vehicleBookingKeys.list({
        status: "all",
        date_filter: "current",
        per_page: 50,
      }),
      queryFn: async ({ signal }) => {
        return vehicleBookingService.getBookings(
          {
            status: "all",
            date_filter: "current",
            per_page: 50,
          },
          { signal }
        )
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),

    // Prefetch daily capacity
    queryClient.prefetchQuery({
      queryKey: vehicleBookingKeys.dailyCapacity(),
      queryFn: async ({ signal }) => {
        return vehicleBookingService.getDailyCapacity(undefined, { signal })
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    }),

    // Prefetch settings
    queryClient.prefetchQuery({
      queryKey: vehicleBookingKeys.settings(),
      queryFn: async ({ signal }) => {
        return vehicleBookingService.getSettings({ signal })
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),
  ])
}

/**
 * Prefetch fish purchase form data
 * OPTIMIZED: Uses single API call instead of 6 separate calls
 * Call this when user is likely to create/edit a fish purchase
 * (e.g., from fish purchases list page, or when clicking "New Purchase")
 */
export async function prefetchFishPurchaseFormData(queryClient: QueryClient) {
  // Use the optimized combined endpoint - reduces 6 requests to 1
  await queryClient.prefetchQuery({
    queryKey: fishPurchaseKeys.formData(),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getFormData({ signal })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Prefetch vehicle booking quick picks
 * Call this when user opens the new booking form
 */
export async function prefetchQuickPicks(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: vehicleBookingKeys.quickPicks(),
    queryFn: async () => {
      return vehicleBookingService.getQuickPicks()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Prefetch specific vehicle booking details
 * Call this when user hovers over or focuses on a booking card
 */
export async function prefetchVehicleBookingDetails(
  queryClient: QueryClient,
  bookingId: number
) {
  await Promise.all([
    // Prefetch booking details
    queryClient.prefetchQuery({
      queryKey: vehicleBookingKeys.detail(bookingId),
      queryFn: async () => {
        return vehicleBookingService.getBooking(bookingId)
      },
      staleTime: 1 * 60 * 1000, // 1 minute
    }),

    // Prefetch booking activities
    queryClient.prefetchQuery({
      queryKey: vehicleBookingKeys.activities(bookingId),
      queryFn: async ({ signal }) => {
        return vehicleBookingService.getBookingActivities(bookingId, { signal })
      },
      staleTime: 30 * 1000, // 30 seconds
    }),
  ])
}

/**
 * Prefetch fish purchase details
 * Call this when user hovers over or focuses on a fish purchase card
 */
export async function prefetchFishPurchaseDetails(
  queryClient: QueryClient,
  purchaseId: number
) {
  await queryClient.prefetchQuery({
    queryKey: fishPurchaseKeys.detail(purchaseId),
    queryFn: async () => {
      return fishPurchaseService.getFishPurchase(purchaseId)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Prefetch calendar stats data
 * Call this when user is likely to navigate to calendar page
 */
export async function prefetchCalendarStats(
  queryClient: QueryClient,
  dateFrom: string,
  dateTo: string
) {
  await queryClient.prefetchQuery({
    queryKey: vehicleBookingKeys.rangeStats(dateFrom, dateTo),
    queryFn: async ({ signal }) => {
      return vehicleBookingService.getRangeStats(dateFrom, dateTo, { signal })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Batch prefetch for common user flows
 * Call this after initial app load to warm up the cache
 */
export async function prefetchCommonData(queryClient: QueryClient) {
  // Prefetch vehicle booking dashboard in background
  // This runs silently and doesn't block the UI
  prefetchVehicleBookingDashboard(queryClient).catch((error) => {
    // Silently fail - prefetching is optimization, not critical
    console.debug("Prefetch failed:", error)
  })

  // Prefetch fish purchase form data in background
  prefetchFishPurchaseFormData(queryClient).catch((error) => {
    console.debug("Prefetch failed:", error)
  })
}
