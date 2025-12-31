import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  inventoryService,
  batchInventoryService,
} from '@/lib/services/inventory';
import {offlineQueueService} from '@/lib/offline-queue';
import {inventoryKeys, batchInventoryKeys} from '@/lib/query-keys';
import type {
  MovementFilters,
  TransferRequest,
  AdjustmentRequest,
  BatchTransferRequest,
  BatchAdjustmentRequest,
  BatchMovementFilters,
} from '@/types/inventory';
import {toast} from 'sonner';
import {useNetworkStatus} from './use-network-status';

/**
 * Hook to get stock grouped by product type
 */
export function useProductTypeStock() {
  return useQuery({
    queryKey: inventoryKeys.stockByType(),
    queryFn: async ({signal}) => {
      return inventoryService.getStockByProductType({signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get inventory movements with filters
 */
export function useInventoryMovements(filters?: MovementFilters) {
  return useQuery({
    queryKey: inventoryKeys.movementsList(filters),
    queryFn: async ({signal}) => {
      return inventoryService.getMovements(filters, {signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get recent movements (for dashboard)
 */
export function useRecentMovements(limit: number = 5) {
  return useQuery({
    queryKey: [...inventoryKeys.movements(), 'recent', limit],
    queryFn: async ({signal}) => {
      return inventoryService.getRecentMovements(limit, {signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get form data for transfer/adjustment forms
 */
export function useInventoryFormData() {
  return useQuery({
    queryKey: inventoryKeys.formData(),
    queryFn: async ({signal}) => {
      return inventoryService.getFormData({signal});
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create a transfer (paired adjustments)
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: TransferRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/inventory/transfers',
          data
        );
        throw new Error('Queued for offline sync');
      }
      return inventoryService.createTransfer(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: inventoryKeys.all});
      toast.success('Transfer completed successfully');
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for offline sync') {
        toast.success('Transfer queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to create transfer');
      }
    },
  });
}

/**
 * Hook to create a single adjustment
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: AdjustmentRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/inventory/adjustments',
          data
        );
        throw new Error('Queued for offline sync');
      }
      return inventoryService.createAdjustment(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: inventoryKeys.all});
      toast.success('Adjustment recorded successfully');
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for offline sync') {
        toast.success('Adjustment queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to create adjustment');
      }
    },
  });
}

// ==========================================
// BATCH INVENTORY HOOKS - NEW
// ==========================================

/**
 * Hook to get batches with stock
 */
export function useBatchStock(filters?: {
  warehouse_id?: number;
  product_type_id?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: batchInventoryKeys.batches(filters),
    queryFn: async ({signal}) => {
      return batchInventoryService.getBatches(filters, {signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get a single batch
 */
export function useBatch(id: number | null) {
  return useQuery({
    queryKey: batchInventoryKeys.batch(id ?? 0),
    queryFn: async ({signal}) => {
      if (!id) return null;
      return batchInventoryService.getBatch(id, {signal});
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get batch movements
 */
export function useBatchMovements(filters?: BatchMovementFilters) {
  return useQuery({
    queryKey: batchInventoryKeys.movements(filters),
    queryFn: async ({signal}) => {
      return batchInventoryService.getMovements(filters, {signal});
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get warehouses
 */
export function useBatchWarehouses() {
  return useQuery({
    queryKey: batchInventoryKeys.warehouses(),
    queryFn: async ({signal}) => {
      return batchInventoryService.getWarehouses({signal});
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get adjustment reasons
 */
export function useBatchAdjustmentReasons() {
  return useQuery({
    queryKey: batchInventoryKeys.reasons(),
    queryFn: async ({signal}) => {
      return batchInventoryService.getReasons({signal});
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create a batch transfer
 */
export function useBatchTransfer() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: BatchTransferRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/batch-inventory/transfer',
          data
        );
        throw new Error('Queued for offline sync');
      }
      return batchInventoryService.transfer(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: batchInventoryKeys.all});
      await queryClient.invalidateQueries({queryKey: inventoryKeys.all});
      toast.success('Transfer completed successfully');
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for offline sync') {
        toast.success('Transfer queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to create transfer');
      }
    },
  });
}

/**
 * Hook to create a batch adjustment
 */
export function useBatchAdjustment() {
  const queryClient = useQueryClient();
  const {isOnline} = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: BatchAdjustmentRequest) => {
      if (!isOnline) {
        await offlineQueueService.queueMutation(
          'POST',
          '/batch-inventory/adjustment',
          data
        );
        throw new Error('Queued for offline sync');
      }
      return batchInventoryService.adjustment(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: batchInventoryKeys.all});
      await queryClient.invalidateQueries({queryKey: inventoryKeys.all});
      toast.success('Adjustment recorded successfully');
    },
    onError: (error: Error) => {
      if (error.message === 'Queued for offline sync') {
        toast.success('Adjustment queued for sync when online');
      } else {
        toast.error(error.message || 'Failed to create adjustment');
      }
    },
  });
}
