import {api} from '@/lib/api';
import type {
  ProductionBatch,
  BatchFilters,
  BatchFormData,
  CreateBatchRequest,
  CreateBatchResponse,
} from '@/types/batch';
import type {ApiResponse, PaginationMeta} from '@/types/shared';

export const batchService = {
  getBatches: async (
    filters?: BatchFilters,
    config?: {signal?: AbortSignal}
  ): Promise<{data: ProductionBatch[]; meta: PaginationMeta}> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all')
      params.append('status', filters.status);
    if (filters?.production_date)
      params.append('production_date', filters.production_date);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.product_type_id)
      params.append('product_type_id', filters.product_type_id.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page)
      params.append('per_page', filters.per_page.toString());

    const response = await api.get<
      ApiResponse<ProductionBatch[]> & {meta: PaginationMeta}
    >(`/production/batches?${params.toString()}`, config);

    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: null,
        to: null,
      },
    };
  },

  getBatch: async (id: number): Promise<ProductionBatch> => {
    const response = await api.get<ApiResponse<ProductionBatch>>(
      `/production/batches/${id}`
    );
    return response.data.data!;
  },

  createBatch: async (
    data: CreateBatchRequest
  ): Promise<CreateBatchResponse> => {
    const response = await api.post<CreateBatchResponse>(
      `/production/batches`,
      data
    );
    return response.data;
  },

  getFormData: async (config?: {
    signal?: AbortSignal;
  }): Promise<BatchFormData> => {
    const response = await api.get<ApiResponse<BatchFormData>>(
      `/production/batches/form-data`,
      config
    );
    return response.data.data!;
  },
};
