import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';

import {offlineQueueService} from '@/lib/offline-queue';
import {batchKeys, productionOutputKeys} from '@/lib/query-keys';
import {batchService} from '@/lib/services/batch';
import type {BatchFilters, CreateBatchRequest} from '@/types/batch';

import {useNetworkStatus} from './use-network-status';

export function useBatches(filters?: BatchFilters) {
  return useQuery({
    queryKey: batchKeys.list(filters),
    queryFn: async ({signal}) => {
      return batchService.getBatches(filters, {signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useBatch(id: number | null) {
  return useQuery({
    queryKey: batchKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Batch ID is required');
      return batchService.getBatch(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBatchFormData() {
  return useQuery({
    queryKey: batchKeys.formData(),
    queryFn: async ({signal}) => {
      return batchService.getFormData({signal});
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: CreateBatchRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/production/batches',
          data
        );
        throw new Error('Queued for sync');
      }
      return batchService.createBatch(data);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: productionOutputKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: batchKeys.all,
      });
      toast.success(response.message || 'Batch created successfully');
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for sync') {
        toast.info('Batch queued - will sync when online');
      } else {
        toast.error(error.message || 'Failed to create batch');
      }
    },
  });
}
