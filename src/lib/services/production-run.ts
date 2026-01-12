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
  ProductionHubResponse,
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
    // Date filtering for dashboard
    if (filters?.production_day) {
      params.append('production_day', filters.production_day);
    }
    if (filters?.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters?.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters?.shift_id) {
      params.append('shift_id', filters.shift_id.toString());
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

  /**
   * Get production hub dashboard data
   * Returns aggregated metrics by shift for a given production day
   *
   * @param productionDay - Date in yyyy-MM-dd format (production day, not calendar)
   * @param config - Optional abort signal
   *
   * Note to Laravel backend:
   * - productionDay is based on shift cycle (e.g., 7:15 AM to 7:15 AM next day)
   * - Should aggregate all production outputs within each shift
   * - fish_input_kg comes from vehicle bookings with status 'offloaded'
   * - fishmeal_output_kg and fish_oil_output_kg from production_outputs
   * - Group runs and metrics by their shift_id
   */
  getProductionHub: async (
    productionDay?: string,
    config?: {signal?: AbortSignal}
  ): Promise<ProductionHubResponse> => {
    const params = new URLSearchParams();
    if (productionDay) {
      params.append('production_day', productionDay);
    }
    const response = await api.get<ProductionHubResponse>(
      `/production/hub?${params.toString()}`,
      config
    );
    return response.data;
  },
};
