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
  active_run: ActiveProductionRun | null;
  pending_handovers: PendingHandover[];
}

export interface ShiftsResponse {
  shifts: ProductionShift[];
  current_shift: ProductionShift | null;
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
