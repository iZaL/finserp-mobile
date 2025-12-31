import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {productionRunService} from '@/lib/services/production-run';
import {productionRunKeys} from '@/lib/query-keys';
import type {
  CreateHandoverRequest,
  CreateProductionRunRequest,
  ProductionRunsFilters,
} from '@/types/production-run';
import {toast} from 'sonner';

/**
 * Hook to get list of production runs
 */
export function useProductionRuns(filters?: ProductionRunsFilters) {
  return useQuery({
    queryKey: productionRunKeys.list(filters),
    queryFn: async ({signal}) => {
      return productionRunService.getProductionRuns(filters, {signal});
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get a single production run detail
 */
export function useProductionRun(id: number | null) {
  return useQuery({
    queryKey: productionRunKeys.detail(id!),
    queryFn: async ({signal}) => {
      if (!id) throw new Error('Production run ID is required');
      return productionRunService.getProductionRun(id, {signal});
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get production dashboard data
 */
export function useProductionDashboard() {
  return useQuery({
    queryKey: productionRunKeys.dashboard(),
    queryFn: async ({signal}) => {
      return productionRunService.getDashboard({signal});
    },
    staleTime: 30 * 1000, // 30 seconds - refresh frequently for live data
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Hook to get all shifts
 */
export function useShifts() {
  return useQuery({
    queryKey: productionRunKeys.shifts(),
    queryFn: async ({signal}) => {
      return productionRunService.getShifts({signal});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - shifts don't change often
  });
}

/**
 * Hook to get operators
 */
export function useOperators(search?: string) {
  return useQuery({
    queryKey: productionRunKeys.operators(search),
    queryFn: async ({signal}) => {
      return productionRunService.getOperators(search, {signal});
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get production lines
 */
export function useProductionLines() {
  return useQuery({
    queryKey: productionRunKeys.productionLines(),
    queryFn: async ({signal}) => {
      return productionRunService.getProductionLines({signal});
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get handover form data
 */
export function useHandoverFormData() {
  return useQuery({
    queryKey: productionRunKeys.handoverFormData(),
    queryFn: async ({signal}) => {
      return productionRunService.getHandoverFormData({signal});
    },
    staleTime: 30 * 1000, // 30 seconds - current shift can change
  });
}

/**
 * Hook to get handover details
 */
export function useHandover(id: number | null) {
  return useQuery({
    queryKey: productionRunKeys.handover(id!),
    queryFn: async () => {
      if (!id) throw new Error('Handover ID is required');
      return productionRunService.getHandover(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create shift handover
 */
export function useCreateHandover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHandoverRequest) => {
      return productionRunService.createHandover(data);
    },
    onSuccess: async () => {
      // Invalidate dashboard to refresh pending handovers
      await queryClient.invalidateQueries({
        queryKey: productionRunKeys.dashboard(),
      });
      toast.success('Shift handover created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create shift handover');
    },
  });
}

/**
 * Hook to accept shift handover
 */
export function useAcceptHandover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return productionRunService.acceptHandover(id);
    },
    onSuccess: async () => {
      // Invalidate dashboard to refresh pending handovers
      await queryClient.invalidateQueries({
        queryKey: productionRunKeys.dashboard(),
      });
      await queryClient.invalidateQueries({
        queryKey: productionRunKeys.handovers(),
      });
      toast.success('Shift handover accepted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept shift handover');
    },
  });
}

/**
 * Hook to complete a production run
 */
export function useCompleteRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completion_notes,
    }: {
      id: number;
      completion_notes?: string;
    }) => {
      return productionRunService.completeRun(id, {completion_notes});
    },
    onSuccess: async () => {
      // Invalidate dashboard to refresh active run
      await queryClient.invalidateQueries({
        queryKey: productionRunKeys.dashboard(),
      });
      toast.success('Production run completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete production run');
    },
  });
}

/**
 * Hook to get run form data (production lines, operators, etc.)
 */
export function useRunFormData() {
  return useQuery({
    queryKey: productionRunKeys.runFormData(),
    queryFn: async ({signal}) => {
      return productionRunService.getRunFormData({signal});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new production run
 */
export function useCreateRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductionRunRequest) => {
      return productionRunService.createRun(data);
    },
    onSuccess: async (data) => {
      // Invalidate dashboard to refresh active run
      await queryClient.invalidateQueries({
        queryKey: productionRunKeys.dashboard(),
      });
      if (data.conflicts && data.conflicts.length > 0) {
        toast.warning('Run created but could not start due to conflicts');
      } else {
        toast.success('Production run created successfully');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create production run');
    },
  });
}

/**
 * Hook to start a production run
 */
export function useStartRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, force}: {id: number; force?: boolean}) => {
      return productionRunService.startRun(id, force);
    },
    onSuccess: async () => {
      // Invalidate dashboard to refresh active run
      await queryClient.invalidateQueries({
        queryKey: productionRunKeys.dashboard(),
      });
      toast.success('Production run started successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start production run');
    },
  });
}
