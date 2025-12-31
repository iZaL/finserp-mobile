import {api} from '@/lib/api';
import type {
  ProductionDashboard,
  ShiftsResponse,
  OperatorsResponse,
  ProductionLinesResponse,
  HandoverFormData,
  ShiftHandover,
  CreateHandoverRequest,
  RunFormData,
  CreateProductionRunRequest,
  CreateProductionRunResponse,
  ProductionRunsFilters,
  ProductionRunsResponse,
  ProductionRunDetail,
} from '@/types/production-run';

export const productionRunService = {
  /**
   * Get list of production runs
   */
  getProductionRuns: async (
    filters?: ProductionRunsFilters,
    config?: {signal?: AbortSignal}
  ): Promise<ProductionRunsResponse> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.per_page) {
      params.append('per_page', filters.per_page.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    const response = await api.get<ProductionRunsResponse>(
      `/production/runs?${params.toString()}`,
      config
    );
    return response.data;
  },

  /**
   * Get a single production run detail
   */
  getProductionRun: async (
    id: number,
    config?: {signal?: AbortSignal}
  ): Promise<{run: ProductionRunDetail}> => {
    const response = await api.get<{run: ProductionRunDetail}>(
      `/production/run/${id}`,
      config
    );
    return response.data;
  },

  /**
   * Get production dashboard data (current shift, active run, pending handovers)
   */
  getDashboard: async (config?: {
    signal?: AbortSignal;
  }): Promise<ProductionDashboard> => {
    const response = await api.get<ProductionDashboard>(
      '/production/dashboard',
      config
    );
    return response.data;
  },

  /**
   * Get all active shifts with current shift indicator
   */
  getShifts: async (config?: {
    signal?: AbortSignal;
  }): Promise<ShiftsResponse> => {
    const response = await api.get<ShiftsResponse>(
      '/production/shifts',
      config
    );
    return response.data;
  },

  /**
   * Get operators (employees who can operate production)
   */
  getOperators: async (
    search?: string,
    config?: {signal?: AbortSignal}
  ): Promise<OperatorsResponse> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await api.get<OperatorsResponse>(
      `/production/operators?${params.toString()}`,
      config
    );
    return response.data;
  },

  /**
   * Get production lines
   */
  getProductionLines: async (config?: {
    signal?: AbortSignal;
  }): Promise<ProductionLinesResponse> => {
    const response = await api.get<ProductionLinesResponse>(
      '/production/production-lines',
      config
    );
    return response.data;
  },

  /**
   * Get handover form data (shifts, current/next shift)
   */
  getHandoverFormData: async (config?: {
    signal?: AbortSignal;
  }): Promise<HandoverFormData> => {
    const response = await api.get<HandoverFormData>(
      '/production/handover/form-data',
      config
    );
    return response.data;
  },

  /**
   * Get handover details
   */
  getHandover: async (id: number): Promise<{handover: ShiftHandover}> => {
    const response = await api.get<{handover: ShiftHandover}>(
      `/production/handover/${id}`
    );
    return response.data;
  },

  /**
   * Create shift handover
   */
  createHandover: async (
    data: CreateHandoverRequest
  ): Promise<{message: string; id: number; production_run_id?: number}> => {
    const response = await api.post<{
      message: string;
      id: number;
      production_run_id?: number;
    }>('/production/handover', data);
    return response.data;
  },

  /**
   * Accept shift handover
   */
  acceptHandover: async (id: number): Promise<{message: string}> => {
    const response = await api.post<{message: string}>(
      `/production/handover/${id}/accept`
    );
    return response.data;
  },

  /**
   * Complete a production run
   */
  completeRun: async (
    id: number,
    data?: {completion_notes?: string}
  ): Promise<{message: string}> => {
    const response = await api.post<{message: string}>(
      `/production/run/${id}/complete`,
      data || {}
    );
    return response.data;
  },

  /**
   * Get form data for creating a production run
   */
  getRunFormData: async (config?: {
    signal?: AbortSignal;
  }): Promise<RunFormData> => {
    const response = await api.get<RunFormData>(
      '/production/runs/form-data',
      config
    );
    return response.data;
  },

  /**
   * Create a new production run
   */
  createRun: async (
    data: CreateProductionRunRequest
  ): Promise<CreateProductionRunResponse> => {
    const response = await api.post<CreateProductionRunResponse>(
      '/production/runs',
      data
    );
    return response.data;
  },

  /**
   * Start a production run
   */
  startRun: async (
    id: number,
    force?: boolean
  ): Promise<{message: string; status: string}> => {
    const response = await api.post<{message: string; status: string}>(
      `/production/run/${id}/start`,
      {force}
    );
    return response.data;
  },
};
