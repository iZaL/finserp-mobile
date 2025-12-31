import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {productionOutputService} from '@/lib/services/production-output';
import {offlineQueueService} from '@/lib/offline-queue';
import {productionOutputKeys} from '@/lib/query-keys';
import type {
  ProductionOutput,
  ProductionOutputFilters,
  CreateProductionOutputRequest,
  BulkCreateProductionOutputRequest,
} from '@/types/production-output';
import {toast} from 'sonner';
import {useNetworkStatus} from './use-network-status';

export function useProductionOutputs(filters?: ProductionOutputFilters) {
  return useQuery({
    queryKey: productionOutputKeys.list(filters),
    queryFn: async ({signal}) => {
      return productionOutputService.getProductionOutputs(filters, {signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useProductionOutput(id: number | null) {
  return useQuery({
    queryKey: productionOutputKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Production output ID is required');
      return productionOutputService.getProductionOutput(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useProductionOutputFormData() {
  return useQuery({
    queryKey: productionOutputKeys.formData(),
    queryFn: async ({signal}) => {
      return productionOutputService.getFormData({signal});
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateProductionOutput() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: CreateProductionOutputRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/production-outputs',
          data
        );
        throw new Error('Queued for offline sync');
      }
      return productionOutputService.createProductionOutput(data);
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(productionOutputKeys.detail(data.id), data);
      queryClient.invalidateQueries({queryKey: productionOutputKeys.lists()});
      await queryClient.refetchQueries({
        queryKey: productionOutputKeys.lists(),
        type: 'active',
      });
      toast.success('Production output created successfully');
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for offline sync') {
        toast.success('Production output queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to create production output');
      }
    },
  });
}

export function useConfirmProductionOutput() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          `/production-outputs/${id}/confirm`,
          {}
        );
        throw new Error('Queued for offline sync');
      }
      return productionOutputService.confirmProductionOutput(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: productionOutputKeys.detail(id),
      });
      const previousOutput = queryClient.getQueryData<ProductionOutput>(
        productionOutputKeys.detail(id)
      );
      if (previousOutput) {
        queryClient.setQueryData<ProductionOutput>(
          productionOutputKeys.detail(id),
          {...previousOutput, status: 'confirmed'}
        );
      }
      return {previousOutput};
    },
    onSuccess: async (data, id) => {
      queryClient.setQueryData(productionOutputKeys.detail(id), data);
      queryClient.invalidateQueries({queryKey: productionOutputKeys.lists()});
      await queryClient.refetchQueries({
        queryKey: productionOutputKeys.lists(),
        type: 'active',
      });
      await queryClient.refetchQueries({
        queryKey: productionOutputKeys.detail(id),
        type: 'active',
      });
      toast.success('Production output confirmed successfully');
    },
    onError: (error: Error, id, context) => {
      if (context?.previousOutput) {
        queryClient.setQueryData(
          productionOutputKeys.detail(id),
          context.previousOutput
        );
      }
      if (error.message === 'Queued for offline sync') {
        toast.success('Confirmation queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to confirm production output');
      }
    },
  });
}

export function useBulkCreateProductionOutputs() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: BulkCreateProductionOutputRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/production/outputs/bulk-store',
          data
        );
        throw new Error('Queued for offline sync');
      }
      return productionOutputService.bulkCreateProductionOutputs(data);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: productionOutputKeys.lists(),
      });
      await queryClient.refetchQueries({
        queryKey: productionOutputKeys.lists(),
        type: 'active',
      });
      toast.success(
        `${result.count} production output(s) created successfully`
      );
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for offline sync') {
        toast.success('Production outputs queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to create production outputs');
      }
    },
  });
}
