import {api} from '@/lib/api';
import type {
  ProductionOutput,
  ProductionOutputFilters,
  ProductionOutputFormData,
  CreateProductionOutputRequest,
  BulkCreateProductionOutputRequest,
  StorageType,
} from '@/types/production-output';
import type {ApiResponse} from '@/types/shared';

export const productionOutputService = {
  getProductionOutputs: async (
    filters?: ProductionOutputFilters,
    config?: {signal?: AbortSignal}
  ): Promise<{data: ProductionOutput[]}> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all')
      params.append('status', filters.status);
    if (filters?.production_date)
      params.append('production_date', filters.production_date);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.production_product_type_id)
      params.append(
        'production_product_type_id',
        filters.production_product_type_id.toString()
      );
    if (filters?.production_run_id)
      params.append('production_run_id', filters.production_run_id.toString());
    if (filters?.storage_type)
      params.append('storage_type', filters.storage_type);

    const response = await api.get<ApiResponse<ProductionOutput[]>>(
      `/production/outputs?${params.toString()}`,
      config
    );
    return {data: response.data.data || []};
  },

  getProductionOutput: async (id: number): Promise<ProductionOutput> => {
    const response = await api.get<ApiResponse<ProductionOutput>>(
      `/production/outputs/${id}`
    );
    return response.data.data!;
  },

  createProductionOutput: async (
    data: CreateProductionOutputRequest
  ): Promise<ProductionOutput> => {
    const response = await api.post<ApiResponse<ProductionOutput>>(
      `/production/outputs`,
      data
    );
    return response.data.data!;
  },

  bulkCreateProductionOutputs: async (
    data: BulkCreateProductionOutputRequest
  ): Promise<{count: number; data: ProductionOutput[]}> => {
    const response = await api.post<
      ApiResponse<{count: number; data: ProductionOutput[]}>
    >(`/production/outputs/bulk-store`, data);
    return response.data.data!;
  },

  confirmProductionOutput: async (id: number): Promise<ProductionOutput> => {
    const response = await api.post<ApiResponse<ProductionOutput>>(
      `/production-outputs/${id}/confirm`
    );
    return response.data.data!;
  },

  getFormData: async (config?: {
    signal?: AbortSignal;
  }): Promise<ProductionOutputFormData> => {
    const response = await api.get<ApiResponse<ProductionOutputFormData>>(
      `/production-outputs/form-data`,
      config
    );
    return response.data.data!;
  },

  calculateTotal: (
    storageType: StorageType,
    packageCount?: number,
    weightPerPackage?: number,
    tankCapacity?: number,
    fillCycles?: number,
    manualQuantity?: number
  ): number => {
    switch (storageType) {
      case 'packaged':
        return (packageCount || 0) * (weightPerPackage || 0);
      case 'tank':
        return (fillCycles || 0) * (tankCapacity || 0);
      case 'bulk':
        return manualQuantity || 0;
      default:
        return 0;
    }
  },
};
