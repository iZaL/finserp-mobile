export interface ProductionShift {
  id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  color: string;
  is_current?: boolean;
}

export interface Operator {
  id: number;
  name: string;
  phone?: string;
}

export interface ProductionLine {
  id: number;
  name: string;
  code?: string;
  description?: string;
  max_capacity?: number;
}

export interface ProductionRunLine {
  id: number;
  name: string;
  planned_capacity: number;
  actual_production: number;
  status: string;
}

export interface ActiveProductionRun {
  id: number;
  name: string;
  status: 'planned' | 'in_progress' | 'completed' | 'canceled';
  operator: Operator | null;
  production_lines: ProductionRunLine[];
  created_at: string;
}

export interface ShiftHandoverIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PendingHandover {
  id: number;
  from_shift: string;
  to_shift: string;
  status: string;
  created_at: string;
}

export interface ShiftHandover {
  id: number;
  date: string;
  from_shift: string;
  to_shift: string;
  from_user: string;
  to_user?: string;
  production_run?: {
    id: number;
    name: string;
  };
  pending_tasks: string[];
  issues: ShiftHandoverIssue[];
  notes: string | null;
  status: 'pending' | 'accepted';
  accepted_by?: string;
  accepted_at?: string;
  created_at: string;
}

export interface ProductionDashboard {
  current_shift: ProductionShift | null;
  current_operator: Operator | null;
  active_run: ActiveProductionRun | null;
  pending_handovers: PendingHandover[];
}

export interface ShiftsResponse {
  shifts: ProductionShift[];
  current_shift: ProductionShift | null;
  timezone?: string; // Factory timezone from settings (e.g., 'Asia/Muscat')
}

export interface OperatorsResponse {
  operators: Operator[];
}

export interface ProductionLinesResponse {
  production_lines: ProductionLine[];
}

export interface HandoverFormData {
  shifts: Pick<ProductionShift, 'id' | 'name' | 'code' | 'color'>[];
  current_shift: {id: number; name: string} | null;
  next_shift: {id: number; name: string} | null;
  operators: Operator[];
  date: string;
}

export interface CreateHandoverRequest {
  from_shift: string;
  to_shift: string;
  to_user_id?: number;
  pending_tasks?: string[];
  issues?: ShiftHandoverIssue[];
  notes?: string;
}

export interface RunFormData {
  production_lines: ProductionLine[];
  operators: Operator[];
  current_shift: {id: number; name: string} | null;
  suggested_name: string;
}

export interface ProductionLineEntry {
  production_line_id: number;
  planned_capacity: number;
}

export interface CreateProductionRunRequest {
  name: string;
  operator_id: number;
  notes?: string;
  production_lines: ProductionLineEntry[];
  start_immediately?: boolean;
}

export interface CreateProductionRunResponse {
  message: string;
  id: number;
  status: string;
  conflicts?: Array<{
    run_id: number;
    run_name: string;
    conflicting_lines: string[];
  }>;
}

export type ProductionRunStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'canceled';

export interface ProductTypeOutput {
  product_type_id: number;
  product_type_name: string;
  product_type_code: string | null;
  total_quantity: number;
}

export interface ProductionRunListItem {
  id: number;
  name: string;
  status: ProductionRunStatus;
  date: string;
  operator: {id: number; name: string} | null;
  shift?: {
    id: number;
    name: string;
    code: string;
    color: string;
  } | null;
  total_planned: number;
  total_actual: number;
  lines_count: number;
  lines: {id: number; name: string}[];
  outputs_by_product_type: ProductTypeOutput[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ProductionRunDetail {
  id: number;
  name: string;
  status: ProductionRunStatus;
  notes: string | null;
  date: string;
  operator: {id: number; name: string} | null;
  shift: {
    id: number;
    name: string;
    code: string;
    color: string;
    start_time: string;
    end_time: string;
  } | null;
  production_lines: {
    id: number;
    name: string | null;
    planned_capacity: number;
    actual_production: number;
    status: string;
  }[];
  total_planned: number;
  total_actual: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ProductionRunsFilters {
  status?: ProductionRunStatus | 'all';
  per_page?: number;
  page?: number;
  /** Filter by production day (yyyy-MM-dd) - shift-based, not calendar day */
  production_day?: string;
  /** Filter from datetime (ISO 8601 format) */
  date_from?: string;
  /** Filter to datetime (ISO 8601 format) */
  date_to?: string;
  /** Filter by shift ID */
  shift_id?: number;
}

export interface ProductionRunsResponse {
  data: ProductionRunListItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Aggregated metrics for a production day/shift
 * Used in the production hub dashboard
 */
export interface ProductionDayMetrics {
  /** Total fish input in kg (from offloaded vehicles) */
  fish_input_kg: number;
  /** Total fishmeal output in kg */
  fishmeal_output_kg: number;
  /** Total fish oil output in kg */
  fish_oil_output_kg: number;
  /** Number of vehicles offloaded */
  vehicle_count: number;
}

/**
 * Shift data with runs and aggregated metrics
 */
export interface ShiftDayData {
  shift: ProductionShift;
  runs: ProductionRunListItem[];
  metrics: ProductionDayMetrics;
}

/**
 * Response for production hub dashboard
 * Groups data by production day and shift
 */
export interface ProductionHubResponse {
  /** Production day in yyyy-MM-dd format (shift-based) */
  production_day: string;
  /** Factory timezone from settings */
  timezone: string;
  /** All shifts for this factory */
  shifts: ProductionShift[];
  /** Current active shift (null if outside shift hours) */
  current_shift: ProductionShift | null;
  /** Data for each shift */
  shift_data: ShiftDayData[];
  /** Day totals (aggregated across all shifts) */
  day_totals: ProductionDayMetrics;
}
