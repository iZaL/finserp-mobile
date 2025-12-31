// Production Output Types for Mobile App

/**
 * Production Product Type (Fishmeal, Fish Oil, Soluble)
 */
export interface ProductionProductType {
  id: number;
  name: string;
  code: string;
  description?: string;
  yield_min: number;
  yield_max: number;
  yield_expected: number;
  can_be_packaged: boolean;
  default_package_type_id?: number;
  default_storage_type?: StorageType;
  is_active: boolean;
  display_order: number;
}

/**
 * Production Shift
 */
export interface ProductionShift {
  id: number;
  name: string;
  code: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  display_order: number;
}

/**
 * Production Package Type
 */
export interface ProductionPackageType {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_weight: number;
  unit: string;
  enabled: boolean;
  product_type_id?: number;
}

/**
 * Warehouse
 */
export interface Warehouse {
  id: number;
  name: string;
  code?: string;
  location?: string;
}

/**
 * Storage Type
 */
export type StorageType = 'packaged' | 'tank' | 'bulk';

/**
 * Production Output Status
 */
export type ProductionOutputStatus =
  | 'draft'
  | 'confirmed'
  | 'verified'
  | 'voided';

/**
 * Production Output
 */
export interface ProductionOutput {
  id: number;
  record_number: string;
  production_product_type_id: number;
  product_type?: ProductionProductType;
  production_date: string;
  production_date_formatted?: string;
  shift_id?: number;
  shift?: ProductionShift;
  storage_type: StorageType;
  packaging_item_id?: number;
  packaging_item?: {
    id: number;
    name: string;
  };
  package_type_id?: number;
  package_type?: ProductionPackageType;
  package_count?: number;
  weight_per_package?: number;
  tank_capacity?: number;
  fill_cycles?: number;
  total_quantity: number;
  allocated_quantity?: number;
  available_quantity?: number;
  unit: string;
  warehouse_id: number;
  warehouse?: Warehouse;
  operator_id?: number;
  operator?: {
    id: number;
    name: string;
  };
  created_by?: number;
  creator?: {
    id: number;
    name: string;
  };
  batch_allocations?: {
    id: number;
    batch_id: number;
    batch?: {
      id: number;
      batch_code: string;
    };
    allocated_quantity: number;
    allocated_packages?: number;
  }[];
  status: ProductionOutputStatus;
  verified_at?: string;
  verified_by?: number;
  verifier?: {
    id: number;
    name: string;
  };
  notes?: string;
  created_at: string;
  updated_at?: string;
  is_packaged?: boolean;
  is_tank?: boolean;
  is_bulk?: boolean;
  is_draft?: boolean;
  is_confirmed?: boolean;
  is_verified?: boolean;
  is_voided?: boolean;
}

/**
 * Production Output Filters
 */
export interface ProductionOutputFilters {
  search?: string;
  status?: ProductionOutputStatus | 'all';
  production_date?: string;
  date_from?: string;
  date_to?: string;
  production_product_type_id?: number;
  production_run_id?: number;
  storage_type?: StorageType;
  page?: number;
  per_page?: number;
}

/**
 * Production Output Form Data (dropdowns)
 */
export interface ProductionOutputFormData {
  product_types: ProductionProductType[];
  shifts: ProductionShift[];
  package_types: ProductionPackageType[];
  warehouses: Warehouse[];
}

/**
 * Create Production Output Request
 */
export interface CreateProductionOutputRequest {
  production_product_type_id: number;
  production_date: string;
  production_run_id?: number;
  shift_id?: number;
  storage_type: StorageType;
  packaging_item_id?: number;
  package_type_id?: number;
  package_count?: number;
  weight_per_package?: number;
  tank_capacity?: number;
  fill_cycles?: number;
  total_quantity?: number;
  unit?: string;
  warehouse_id: number;
  operator_id?: number;
  notes?: string;
}

/**
 * Output Product Entry (for bulk store)
 */
export interface OutputProductEntry {
  product_type_id: number;
  storage_type: StorageType;
  package_type_id?: number;
  package_count?: number;
  tank_capacity?: number;
  fill_cycles?: number;
  warehouse_id?: number;
}

/**
 * Bulk Create Production Outputs Request
 */
export interface BulkCreateProductionOutputRequest {
  production_date: string;
  production_run_id?: number;
  shift_id?: number;
  notes?: string;
  products: OutputProductEntry[];
}

/**
 * Production Output List Item (optimized for list views)
 */
export interface ProductionOutputListItem {
  id: number;
  record_number: string;
  production_date: string;
  production_date_formatted?: string;
  product_type?: {
    id: number;
    name: string;
    code: string;
  };
  shift?: {
    id: number;
    name: string;
  };
  storage_type: StorageType;
  package_count?: number;
  fill_cycles?: number;
  total_quantity: number;
  unit: string;
  warehouse?: {
    id: number;
    name: string;
  };
  status: ProductionOutputStatus;
}

/**
 * API Response Types
 */
export interface ProductionOutputApiResponse {
  success: boolean;
  data: ProductionOutput;
  message?: string;
}

export interface ProductionOutputListApiResponse {
  success: boolean;
  data: ProductionOutput[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export interface ProductionOutputFormDataApiResponse {
  success: boolean;
  data: ProductionOutputFormData;
}
