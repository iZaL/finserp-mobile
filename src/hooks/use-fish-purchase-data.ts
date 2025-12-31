import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fishPurchaseService} from '@/lib/services/fish-purchase';
import {fishPurchaseKeys} from '@/lib/query-keys';
import {toast} from 'sonner';
import {useMemo} from 'react';

/**
 * Hook to fetch fish species list
 * Caches data with React Query for offline support
 * @deprecated Use useFishPurchaseFormData() instead for better performance (single request)
 */
export function useFishSpecies() {
  return useQuery({
    queryKey: fishPurchaseKeys.species(),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getFishSpecies({signal});
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - species don't change often
  });
}

/**
 * Hook to fetch suppliers (fish suppliers with bank details)
 * @deprecated Use useFishPurchaseFormData() instead for better performance (single request)
 */
export function useSuppliers(options?: {
  limit?: number;
  search?: string;
  selectedSupplierId?: number;
}) {
  return useQuery({
    queryKey: fishPurchaseKeys.suppliers(options),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getSuppliers({
        signal,
        limit: options?.limit,
        search: options?.search,
        selectedSupplierId: options?.selectedSupplierId,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      phone: string;
      bank_id?: number;
      account_number?: string;
    }) => {
      return fishPurchaseService.createSupplier(data);
    },
    onSuccess: () => {
      // Invalidate suppliers list
      queryClient.invalidateQueries({
        queryKey: fishPurchaseKeys.suppliers(),
      });
      toast.success('Supplier created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create supplier');
    },
  });
}

/**
 * Hook to fetch fish landing sites (locations)
 * @deprecated Use useFishPurchaseFormData() instead for better performance (single request)
 */
export function useLocations() {
  return useQuery({
    queryKey: fishPurchaseKeys.locations(),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getLocations({signal});
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - locations don't change often
  });
}

/**
 * Hook to create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {name: string; city?: string}) => {
      return fishPurchaseService.createLocation(data);
    },
    onSuccess: () => {
      // Invalidate locations list
      queryClient.invalidateQueries({
        queryKey: fishPurchaseKeys.locations(),
      });
      toast.success('Location created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create location');
    },
  });
}

/**
 * Hook to fetch banks list
 * @deprecated Use useFishPurchaseFormData() instead for better performance (single request)
 */
export function useBanks() {
  return useQuery({
    queryKey: fishPurchaseKeys.banks(),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getBanks({signal});
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - banks rarely change
  });
}

/**
 * Hook to fetch agents list
 * @deprecated Use useFishPurchaseFormData() instead for better performance (single request)
 */
export function useAgents() {
  return useQuery({
    queryKey: fishPurchaseKeys.agents(),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getAgents({signal});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch fish purchase settings (bill number, defaults)
 * @deprecated Use useFishPurchaseFormData() instead for better performance (single request)
 */
export function useFishPurchaseSettings() {
  return useQuery({
    queryKey: fishPurchaseKeys.settings(),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getSettings({signal});
    },
    staleTime: 1 * 60 * 1000, // 1 minute - settings might change
  });
}

/**
 * Combined hook to fetch all required data for fish purchase form
 * OPTIMIZED: Uses a single API call instead of 6 separate calls
 * Use this in the create/edit form pages for convenience
 */
export function useFishPurchaseFormData() {
  const query = useQuery({
    queryKey: fishPurchaseKeys.formData(),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getFormData({signal});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoize array creations to ensure stable references
  const fishSpecies = useMemo(
    () => query.data?.fish_species || [],
    [query.data?.fish_species]
  );
  const suppliers = useMemo(
    () => query.data?.suppliers || [],
    [query.data?.suppliers]
  );
  const locations = useMemo(
    () => query.data?.locations || [],
    [query.data?.locations]
  );
  const banks = useMemo(() => query.data?.banks || [], [query.data?.banks]);
  const agents = useMemo(() => query.data?.agents || [], [query.data?.agents]);
  const settings = query.data?.settings;

  return {
    fishSpecies,
    suppliers,
    locations,
    banks,
    agents,
    settings,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  };
}
