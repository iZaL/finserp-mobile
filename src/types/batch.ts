import {
  ProductionOutput,
  ProductionProductType,
  Warehouse,
  ProductionPackageType,
} from './production-output';

export type BatchStatus =
  | 'draft'
  | 'in_process'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'allocated'
  | 'shipped';
export type BatchType = 'intermediate' | 'final';

export interface ProductionBatch {
  id: number;
  batch_code: string;
  name: string;
  type: BatchType;
  status: BatchStatus;
  status_color?: string;
  production_date: string;
  total_weight: number;
  allocated_weight?: number;
  yield_percentage: number;
  is_fully_consumed?: boolean;
  product_type_id?: number;
  product_type?: {
    id: number;
    name: string;
    code: string;
  };
  warehouse_id?: number;
  warehouse?: {
    id: number;
    name: string;
  };
  package_type_id?: number;
  package_type?: {
    id: number;
    name: string;
    code: string;
    default_weight?: number;
  };
  production_run_ids?: number[];
  created_at: string;
  updated_at?: string;
  created_by?: number;
  creator_name?: string;
}

export interface OutputAllocation {
  output_id: number;
  quantity: number;
  package_count?: number;
}

export interface BatchProduct {
  product_type_id: number;
  warehouse_id?: number;
  package_type_id?: number;
  output_allocations: OutputAllocation[];
}

export interface SourcePurchase {
  purchase_id: number;
  weight_used: number;
}

export interface CreateBatchRequest {
  type?: BatchType;
  production_date: string;
  production_run_ids?: number[];
  source_purchases?: SourcePurchase[];
  products: BatchProduct[];
}

export interface CreateBatchResponse {
  success: boolean;
  message: string;
  count: number;
  data: ProductionBatch[];
}

export interface BatchListResponse {
  success: boolean;
  data: ProductionBatch[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BatchDetailResponse {
  success: boolean;
  data: ProductionBatch;
}

export interface BatchFormData {
  product_types: ProductionProductType[];
  package_types: ProductionPackageType[];
  warehouses: Warehouse[];
}

export interface BatchFormDataResponse {
  success: boolean;
  data: BatchFormData;
}

export interface BatchFilters {
  search?: string;
  status?: BatchStatus | 'all';
  production_date?: string;
  date_from?: string;
  date_to?: string;
  product_type_id?: number;
  page?: number;
  per_page?: number;
}

export interface SelectedOutputForBatch {
  id: number;
  record_number: string;
  production_product_type_id: number;
  product_type?: {
    id: number;
    name: string;
    code: string;
  };
  available_quantity: number;
  package_count?: number;
  warehouse_id?: number;
  warehouse?: {
    id: number;
    name: string;
  };
}
