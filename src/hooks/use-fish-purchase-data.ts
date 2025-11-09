import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fishPurchaseService } from "@/lib/services/fish-purchase"
import { fishPurchaseKeys } from "@/lib/query-keys"
import { toast } from "sonner"
import { useMemo } from "react"

/**
 * Hook to fetch fish species list
 * Caches data with React Query for offline support
 */
export function useFishSpecies() {
  return useQuery({
    queryKey: fishPurchaseKeys.species(),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getFishSpecies({ signal })
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - species don't change often
  })
}

/**
 * Hook to fetch suppliers (fish suppliers with bank details)
 */
export function useSuppliers(options?: {
  limit?: number;
  search?: string;
  selectedSupplierId?: number;
}) {
  return useQuery({
    queryKey: fishPurchaseKeys.suppliers(options),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getSuppliers({
        signal,
        limit: options?.limit,
        search: options?.search,
        selectedSupplierId: options?.selectedSupplierId,
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      phone: string
      bank_id?: number
      account_number?: string
    }) => {
      return fishPurchaseService.createSupplier(data)
    },
    onSuccess: () => {
      // Invalidate suppliers list
      queryClient.invalidateQueries({
        queryKey: fishPurchaseKeys.suppliers(),
      })
      toast.success("Supplier created successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create supplier")
    },
  })
}

/**
 * Hook to fetch fish landing sites (locations)
 */
export function useLocations() {
  return useQuery({
    queryKey: fishPurchaseKeys.locations(),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getLocations({ signal })
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - locations don't change often
  })
}

/**
 * Hook to create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; city?: string }) => {
      return fishPurchaseService.createLocation(data)
    },
    onSuccess: () => {
      // Invalidate locations list
      queryClient.invalidateQueries({
        queryKey: fishPurchaseKeys.locations(),
      })
      toast.success("Location created successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create location")
    },
  })
}

/**
 * Hook to fetch banks list
 */
export function useBanks() {
  return useQuery({
    queryKey: fishPurchaseKeys.banks(),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getBanks({ signal })
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - banks rarely change
  })
}

/**
 * Hook to fetch agents list
 */
export function useAgents() {
  return useQuery({
    queryKey: fishPurchaseKeys.agents(),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getAgents({ signal })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch fish purchase settings (bill number, defaults)
 */
export function useFishPurchaseSettings() {
  return useQuery({
    queryKey: fishPurchaseKeys.settings(),
    queryFn: async ({ signal }) => {
      return fishPurchaseService.getSettings({ signal })
    },
    staleTime: 1 * 60 * 1000, // 1 minute - settings might change
  })
}

/**
 * Combined hook to fetch all required data for fish purchase form
 * Use this in the create/edit form pages for convenience
 */
export function useFishPurchaseFormData(options?: {
  selectedSupplierId?: number;
}) {
  const fishSpeciesQuery = useFishSpecies()
  const suppliersQuery = useSuppliers({
    limit: 5, // Show only 5 suppliers initially
    selectedSupplierId: options?.selectedSupplierId,
  })
  const locationsQuery = useLocations()
  const banksQuery = useBanks()
  const agentsQuery = useAgents()
  const settingsQuery = useFishPurchaseSettings()

  // Memoize array creations to ensure stable references
  const fishSpecies = useMemo(() => fishSpeciesQuery.data || [], [fishSpeciesQuery.data])
  const suppliers = useMemo(() => suppliersQuery.data || [], [suppliersQuery.data])
  const locations = useMemo(() => locationsQuery.data || [], [locationsQuery.data])
  const banks = useMemo(() => banksQuery.data || [], [banksQuery.data])
  const agents = useMemo(() => agentsQuery.data || [], [agentsQuery.data])
  const settings = settingsQuery.data

  const loading =
    fishSpeciesQuery.isLoading ||
    suppliersQuery.isLoading ||
    locationsQuery.isLoading ||
    banksQuery.isLoading ||
    agentsQuery.isLoading ||
    settingsQuery.isLoading

  const error =
    fishSpeciesQuery.error ||
    suppliersQuery.error ||
    locationsQuery.error ||
    banksQuery.error ||
    agentsQuery.error ||
    settingsQuery.error

  const refresh = useMemo(() => {
    return () => {
      fishSpeciesQuery.refetch()
      suppliersQuery.refetch()
      locationsQuery.refetch()
      banksQuery.refetch()
      agentsQuery.refetch()
      settingsQuery.refetch()
    }
  }, [fishSpeciesQuery, suppliersQuery, locationsQuery, banksQuery, agentsQuery, settingsQuery])

  return {
    fishSpecies,
    suppliers,
    locations,
    banks,
    agents,
    settings,
    loading,
    error,
    refresh,
  }
}
