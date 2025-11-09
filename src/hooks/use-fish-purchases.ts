import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fishPurchaseService } from "@/lib/services/fish-purchase"
import { offlineQueueService } from "@/lib/offline-queue"
import { fishPurchaseKeys } from "@/lib/query-keys"
import type {
  FishPurchase,
  FishPurchaseFilters,
  CreateFishPurchaseRequest,
  UpdateFishPurchaseRequest,
  UpdateStatusRequest,
} from "@/types/fish-purchase"
import type { AdvancePaymentRequest } from "@/types/payment"
import type { PaginatedResponse } from "@/types/shared"
import { toast } from "sonner"
import { useNetworkStatus } from "./use-network-status"

/**
 * Hook to fetch paginated fish purchases with filters
 */
export function useFishPurchases(filters?: FishPurchaseFilters) {
  return useQuery({
    queryKey: fishPurchaseKeys.list(filters),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getFishPurchases(filters, { signal })
    },
    // Keep data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook to fetch single fish purchase by ID
 */
export function useFishPurchase(id: number | null) {
  return useQuery({
    queryKey: fishPurchaseKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error("Fish purchase ID is required")
      return fishPurchaseService.getFishPurchase(id)
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook to create a new fish purchase
 */
export function useCreateFishPurchase() {
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()

  return useMutation({
    mutationFn: async (data: CreateFishPurchaseRequest) => {
      if (!isOnline) {
        // Queue for offline sync
        await offlineQueueService.queueMutation(
          "POST",
          "/fish-purchases",
          data
        )
        throw new Error("Queued for offline sync")
      }
      return fishPurchaseService.createFishPurchase(data)
    },
    onSuccess: (data) => {
      // Invalidate and refetch fish purchases list
      queryClient.invalidateQueries({ queryKey: fishPurchaseKeys.lists() })
      // Add the new purchase to cache
      queryClient.setQueryData(fishPurchaseKeys.detail(data.id), data)
      toast.success("Fish purchase created successfully")
    },
    onError: (error: Error) => {
      if (error.message === "Queued for offline sync") {
        toast.success("Fish purchase queued for sync when online")
      } else {
        toast.error(error.message || "Failed to create fish purchase")
      }
    },
  })
}

/**
 * Hook to update a fish purchase
 */
export function useUpdateFishPurchase() {
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: UpdateFishPurchaseRequest
    }) => {
      if (!isOnline) {
        // Queue for offline sync
        await offlineQueueService.queueMutation(
          "PUT",
          `/fish-purchases/${id}`,
          data
        )
        throw new Error("Queued for offline sync")
      }
      return fishPurchaseService.updateFishPurchase(id, data)
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: fishPurchaseKeys.detail(id) })

      // Snapshot previous value
      const previousPurchase = queryClient.getQueryData<FishPurchase>(
        fishPurchaseKeys.detail(id)
      )

      // Optimistically update
      if (previousPurchase) {
        queryClient.setQueryData<FishPurchase>(
          fishPurchaseKeys.detail(id),
          { ...previousPurchase, ...data }
        )
      }

      return { previousPurchase }
    },
    onSuccess: (data, variables) => {
      // Update cache with server response
      queryClient.setQueryData(fishPurchaseKeys.detail(variables.id), data)
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: fishPurchaseKeys.lists() })
      toast.success("Fish purchase updated successfully")
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousPurchase) {
        queryClient.setQueryData(
          fishPurchaseKeys.detail(variables.id),
          context.previousPurchase
        )
      }
      if (error.message === "Queued for offline sync") {
        toast.success("Update queued for sync when online")
      } else {
        toast.error(error.message || "Failed to update fish purchase")
      }
    },
  })
}

/**
 * Hook to delete a fish purchase
 */
export function useDeleteFishPurchase() {
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()

  return useMutation({
    mutationFn: async (id: number) => {
      if (!isOnline) {
        // Queue for offline sync
        await offlineQueueService.queueMutation(
          "DELETE",
          `/fish-purchases/${id}`,
          null
        )
        throw new Error("Queued for offline sync")
      }
      return fishPurchaseService.deleteFishPurchase(id)
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: fishPurchaseKeys.lists() })

      // Snapshot previous value
      const previousPurchases = queryClient.getQueryData<PaginatedResponse<FishPurchase>>(
        fishPurchaseKeys.list()
      )

      // Optimistically remove from list
      if (previousPurchases) {
        queryClient.setQueryData<PaginatedResponse<FishPurchase>>(
          fishPurchaseKeys.list(),
          {
            ...previousPurchases,
            data: previousPurchases.data.filter((p) => p.id !== id),
          }
        )
      }

      return { previousPurchases }
    },
    onSuccess: () => {
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: fishPurchaseKeys.all })
      toast.success("Fish purchase deleted successfully")
    },
    onError: (error: Error, id, context) => {
      // Rollback on error
      if (context?.previousPurchases) {
        queryClient.setQueryData(
          fishPurchaseKeys.list(),
          context.previousPurchases
        )
      }
      if (error.message === "Queued for offline sync") {
        toast.success("Delete queued for sync when online")
      } else {
        toast.error(error.message || "Failed to delete fish purchase")
      }
    },
  })
}

/**
 * Hook to update fish purchase status
 */
export function useUpdateFishPurchaseStatus() {
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: UpdateStatusRequest
    }) => {
      if (!isOnline) {
        // Queue for offline sync
        await offlineQueueService.queueMutation(
          "POST",
          `/fish-purchases/${id}/update-status`,
          data
        )
        throw new Error("Queued for offline sync")
      }
      return fishPurchaseService.updateStatus(id, data)
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(fishPurchaseKeys.detail(variables.id), data)
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: fishPurchaseKeys.lists() })
      toast.success(`Fish purchase ${variables.data.status} successfully`)
    },
    onError: (error: Error) => {
      if (error.message === "Queued for offline sync") {
        toast.success("Status update queued for sync when online")
      } else {
        toast.error(error.message || "Failed to update status")
      }
    },
  })
}

/**
 * Hook to add payment to fish purchase
 */
export function useAddFishPurchasePayment() {
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data: AdvancePaymentRequest
    }) => {
      if (!isOnline) {
        // Queue for offline sync
        await offlineQueueService.queueMutation(
          "POST",
          `/fish-purchases/${id}/payments`,
          data
        )
        throw new Error("Queued for offline sync")
      }
      return fishPurchaseService.addPayment(id, data)
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(fishPurchaseKeys.detail(variables.id), data)
      toast.success("Payment added successfully")
    },
    onError: (error: Error) => {
      if (error.message === "Queued for offline sync") {
        toast.success("Payment queued for sync when online")
      } else {
        toast.error(error.message || "Failed to add payment")
      }
    },
  })
}
