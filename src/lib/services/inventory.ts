import {api} from '@/lib/api';
import type {
  ProductTypeStock,
  InventoryMovement,
  MovementFilters,
  TransferRequest,
  AdjustmentRequest,
  InventoryFormData,
  BatchStock,
  BatchStockApiResponse,
  SingleBatchApiResponse,
  BatchTransferRequest,
  BatchTransferApiResponse,
  BatchAdjustmentRequest,
  BatchAdjustmentApiResponse,
  BatchMovement,
  BatchMovementsApiResponse,
  BatchMovementFilters,
} from '@/types/inventory';
import type {ApiResponse} from '@/types/shared';
import type {Warehouse} from '@/types/production-output';

export const inventoryService = {
  /**
   * Get stock grouped by product type with warehouse breakdown
   */
  getStockByProductType: async (config?: {
    signal?: AbortSignal;
  }): Promise<ProductTypeStock[]> => {
    const response = await api.get<ApiResponse<ProductTypeStock[]>>(
      `/inventory/stock-by-product-type`,
      config
    );
    return response.data.data || [];
  },

  /**
   * Get inventory movements with filters
   */
  getMovements: async (
    filters?: MovementFilters,
    config?: {signal?: AbortSignal}
  ): Promise<{
    data: InventoryMovement[];
    meta: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number | null;
      to: number | null;
    };
  }> => {
    const params = new URLSearchParams();

    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.product_type_id)
      params.append('product_type_id', filters.product_type_id.toString());
    if (filters?.warehouse_id)
      params.append('warehouse_id', filters.warehouse_id.toString());
    if (filters?.movement_type && filters.movement_type !== 'all')
      params.append('movement_type', filters.movement_type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page)
      params.append('per_page', filters.per_page.toString());

    const response = await api.get<
      ApiResponse<InventoryMovement[]> & {
        meta: {
          current_page: number;
          per_page: number;
          total: number;
          last_page: number;
          from: number | null;
          to: number | null;
        };
      }
    >(`/inventory/movements?${params.toString()}`, config);

    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
        from: null,
        to: null,
      },
    };
  },

  /**
   * Get recent movements (for dashboard)
   */
  getRecentMovements: async (
    limit: number = 5,
    config?: {signal?: AbortSignal}
  ): Promise<InventoryMovement[]> => {
    const response = await api.get<ApiResponse<InventoryMovement[]>>(
      `/inventory/movements?per_page=${limit}`,
      config
    );
    return response.data.data || [];
  },

  /**
   * Create a transfer (paired adjustments)
   */
  createTransfer: async (
    data: TransferRequest
  ): Promise<{
    source_adjustment: InventoryMovement;
    destination_adjustment: InventoryMovement;
    transfer_reference: string;
  }> => {
    const response = await api.post<
      ApiResponse<{
        source_adjustment: InventoryMovement;
        destination_adjustment: InventoryMovement;
        transfer_reference: string;
      }>
    >(`/inventory/transfers`, data);
    return response.data.data!;
  },

  /**
   * Create a single adjustment
   */
  createAdjustment: async (
    data: AdjustmentRequest
  ): Promise<InventoryMovement> => {
    const response = await api.post<ApiResponse<InventoryMovement>>(
      `/inventory/adjustments`,
      data
    );
    return response.data.data!;
  },

  /**
   * Get form data for transfer/adjustment forms
   */
  getFormData: async (config?: {
    signal?: AbortSignal;
  }): Promise<InventoryFormData> => {
    const response = await api.get<ApiResponse<InventoryFormData>>(
      `/inventory/form-data`,
      config
    );
    return response.data.data!;
  },
};

/**
 * Batch Inventory Service - New batch-level inventory management
 */
export const batchInventoryService = {
  /**
   * Get list of batches with their stock levels
   */
  getBatches: async (
    filters?: {
      warehouse_id?: number;
      product_type_id?: number;
      search?: string;
    },
    config?: {signal?: AbortSignal}
  ): Promise<BatchStock[]> => {
    const params = new URLSearchParams();
    if (filters?.warehouse_id)
      params.append('warehouse_id', filters.warehouse_id.toString());
    if (filters?.product_type_id)
      params.append('product_type_id', filters.product_type_id.toString());
    if (filters?.search) params.append('search', filters.search);

    const url = params.toString()
      ? `/batch-inventory/batches?${params.toString()}`
      : `/batch-inventory/batches`;

    const response = await api.get<BatchStockApiResponse>(url, config);
    return response.data.data || [];
  },

  /**
   * Get a single batch with its details
   */
  getBatch: async (
    id: number,
    config?: {signal?: AbortSignal}
  ): Promise<BatchStock & {is_fully_consumed: boolean}> => {
    const response = await api.get<SingleBatchApiResponse>(
      `/batch-inventory/batches/${id}`,
      config
    );
    return response.data.data;
  },

  /**
   * Transfer batch stock between warehouses
   */
  transfer: async (
    data: BatchTransferRequest
  ): Promise<BatchTransferApiResponse['data']> => {
    const response = await api.post<BatchTransferApiResponse>(
      `/batch-inventory/transfer`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Transfer failed');
    }
    return response.data.data;
  },

  /**
   * Create an adjustment for a batch
   */
  adjustment: async (
    data: BatchAdjustmentRequest
  ): Promise<BatchAdjustmentApiResponse['data']> => {
    const response = await api.post<BatchAdjustmentApiResponse>(
      `/batch-inventory/adjustment`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Adjustment failed');
    }
    return response.data.data;
  },

  /**
   * Get movement history for batch inventory
   */
  getMovements: async (
    filters?: BatchMovementFilters,
    config?: {signal?: AbortSignal}
  ): Promise<{
    data: BatchMovement[];
    meta: BatchMovementsApiResponse['meta'];
  }> => {
    const params = new URLSearchParams();
    if (filters?.warehouse_id)
      params.append('warehouse_id', filters.warehouse_id.toString());
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page)
      params.append('per_page', filters.per_page.toString());

    const url = params.toString()
      ? `/batch-inventory/movements?${params.toString()}`
      : `/batch-inventory/movements`;

    const response = await api.get<BatchMovementsApiResponse>(url, config);
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
      },
    };
  },

  /**
   * Get list of warehouses for dropdowns
   */
  getWarehouses: async (config?: {
    signal?: AbortSignal;
  }): Promise<Warehouse[]> => {
    const response = await api.get<{data: Warehouse[]}>(
      `/batch-inventory/warehouses`,
      config
    );
    return response.data.data || [];
  },

  /**
   * Get list of adjustment reasons
   */
  getReasons: async (config?: {
    signal?: AbortSignal;
  }): Promise<{id: number; name: string}[]> => {
    const response = await api.get<{data: {id: number; name: string}[]}>(
      `/batch-inventory/reasons`,
      config
    );
    return response.data.data || [];
  },
};
